import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { Statement } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let createStatementeUseCase: CreateStatementUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe("Get Balance", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    createStatementeUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
  })
  it("Should be able to create a new Deposit Statement", async () => {
    const user: User = await usersRepositoryInMemory.create({
      name: "Jhon Doe",
      email: "jhon@doe.com",
      password: "12345"
    })

    const statement = await createStatementeUseCase.execute({
      user_id: user.id!,
      description: "Teste",
      amount: 4000,
      type: OperationType.DEPOSIT
    })

    expect(statement).toHaveProperty("id")
    expect(statement).toBeInstanceOf(Statement)
  })
  it("Should be able to create a new Withdraw Statement", async () => {
    const user: User = await usersRepositoryInMemory.create({
      name: "Jhon Doe",
      email: "jhon@doe.com",
      password: "12345"
    })

    await createStatementeUseCase.execute({
      user_id: user.id!,
      description: "Teste",
      amount: 4000,
      type: OperationType.DEPOSIT
    })

    const statement = await createStatementeUseCase.execute({
      user_id: user.id!,
      description: "Teste",
      amount: 3000,
      type: OperationType.WITHDRAW
    })

    expect(statement).toHaveProperty("id")
    expect(statement).toBeInstanceOf(Statement)
  })
  it("Should not be able to create a new Statement for a non existing user", async () => {
    expect(async () => {
      await createStatementeUseCase.execute({
        user_id: "Teste",
        description: "Teste",
        amount: 4000,
        type: OperationType.DEPOSIT
      })
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })
  it("Should not be able to create a new Withdraw Statement greater than the Deposited value", async () => {
    expect(async () => {
      const user: User = await usersRepositoryInMemory.create({
        name: "Jhon Doe",
        email: "jhon@doe.com",
        password: "12345"
      })

      await createStatementeUseCase.execute({
        user_id: user.id!,
        description: "Teste",
        amount: 4000,
        type: OperationType.DEPOSIT
      })

      await createStatementeUseCase.execute({
        user_id: user.id!,
        description: "Teste",
        amount: 5000,
        type: OperationType.WITHDRAW
      })
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
  })
})
