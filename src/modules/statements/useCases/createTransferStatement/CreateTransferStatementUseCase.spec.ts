import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { CreateTransferStatementUseCase } from "./CreateTransferStatementUseCase";

let createTransferStatementUseCase: CreateTransferStatementUseCase;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let usersRepositoryInMemory: InMemoryUsersRepository;

describe("Create Transfer Statement", () => {
  beforeEach(() => {
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createTransferStatementUseCase = new CreateTransferStatementUseCase(
      statementsRepositoryInMemory,
      usersRepositoryInMemory
    );
  });
  it("Should be able to create a new transfer statement", async () => {
    const user = await usersRepositoryInMemory.create({
      name: "Randy Reynolds",
      email: "iga@ikinokka.eh",
      password: "12345",
    });

    await statementsRepositoryInMemory.create({
      user_id: "048872509",
      amount: 100,
      description: "Test Deposit",
      type: OperationType.DEPOSIT,
    });

    if (user.id) {
      const transfer = await createTransferStatementUseCase.execute({
        user_id: user.id,
        sender_id: "048872509",
        amount: 100,
        description: "Test Transfer",
        type: OperationType.TRANSFER,
      });

      expect(transfer).toHaveProperty("id");
    }
  });
  it("Should not be able to create a new transfer statement to a nonexisting user", async () => {
    expect(async () => {
      await createTransferStatementUseCase.execute({
        user_id: "706679446",
        sender_id: "048872509",
        amount: 100,
        description: "Test Transfer",
        type: OperationType.TRANSFER,
      });
    }).rejects.toEqual(new CreateStatementError.ReceiverNotFound());
  });
  it("Should not be able to create a new transfer statement with insufficient funds", async () => {
    const user = await usersRepositoryInMemory.create({
      name: "Randy Reynolds",
      email: "iga@ikinokka.eh",
      password: "12345",
    });

    if (user.id) {
      await statementsRepositoryInMemory.create({
        user_id: user.id,
        amount: 100,
        description: "Test Deposit",
        type: OperationType.DEPOSIT,
      });

      await statementsRepositoryInMemory.create({
        user_id: "048872509",
        sender_id: user.id,
        amount: 100,
        description: "Test Transfer",
        type: OperationType.TRANSFER,
      });

      await statementsRepositoryInMemory.create({
        user_id: user.id,
        sender_id: "048872509",
        amount: 200,
        description: "Test Transfer",
        type: OperationType.TRANSFER,
      });

      expect(async () => {
        await createTransferStatementUseCase.execute({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          user_id: user.id!,
          sender_id: "048872509",
          amount: 100,
          description: "Test Transfer",
          type: OperationType.TRANSFER,
        });
      }).rejects.toEqual(new CreateStatementError.InsufficientFunds());
    }
  });
});
