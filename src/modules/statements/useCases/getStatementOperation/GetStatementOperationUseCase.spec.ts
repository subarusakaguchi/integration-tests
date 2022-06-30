import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { Statement } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe("Get Balance", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(usersRepositoryInMemory, statementsRepositoryInMemory);
  })
  it("Should be able to return an specific operation", async () => {
    const user: User = await usersRepositoryInMemory.create({
      name: "Jhon Doe",
      email: "jhon@doe.com",
      password: "12345"
    })

    const statement = await statementsRepositoryInMemory.create({
      user_id: user.id!,
      description: "Teste",
      amount: 4000,
      type: OperationType.DEPOSIT
    })

    const returnedStatement = await getStatementOperationUseCase.execute({ user_id: user.id!, statement_id: statement.id!})

    expect(returnedStatement).toHaveProperty("id")
    expect(returnedStatement).toBeInstanceOf(Statement)
  })
  it("Should not be able to return an operation for a non existing user", async () => {
    expect(async () => {
      const statement = await statementsRepositoryInMemory.create({
        user_id: "12345",
        description: "Teste",
        amount: 4000,
        type: OperationType.DEPOSIT
      })

      await getStatementOperationUseCase.execute({ user_id: "Teste", statement_id: statement.id!})
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
  })
  it("Should not be able to return a non existing operation for a user", async () => {
    expect(async () => {
      const user: User = await usersRepositoryInMemory.create({
        name: "Jhon Doe",
        email: "jhon@doe.com",
        password: "12345"
      })

      await getStatementOperationUseCase.execute({ user_id: user.id!, statement_id: "Teste"})
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
  })
})
