import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe("Get Balance", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    getBalanceUseCase = new GetBalanceUseCase(statementsRepositoryInMemory, usersRepositoryInMemory);
  })
  it("Should be able to return all operations", async () => {
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

    const returnedStatement = await getBalanceUseCase.execute({ user_id: user.id!})

    expect(returnedStatement).toHaveProperty("balance")
    expect(returnedStatement.statement).toEqual([statement])
  })
  it("Should not be able to return operations for a non existing user", async () => {
    expect(async () => {
      const user: User = await usersRepositoryInMemory.create({
        name: "Jhon Doe",
        email: "jhon@doe.com",
        password: "12345"
      })

      await statementsRepositoryInMemory.create({
        user_id: user.id!,
        description: "Teste",
        amount: 4000,
        type: OperationType.DEPOSIT
      })

      await getBalanceUseCase.execute({ user_id: "12345"})
    }).rejects.toBeInstanceOf(GetBalanceError)
  })
})
