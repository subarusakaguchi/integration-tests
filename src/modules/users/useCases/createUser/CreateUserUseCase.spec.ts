import { User } from "../../entities/User"
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { CreateUserError } from "./CreateUserError"
import { CreateUserUseCase } from "./CreateUserUseCase"

let createUserUseCase: CreateUserUseCase
let usersRepositoryInMemory: InMemoryUsersRepository

describe("Create User", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
  })
  it("Should be able to Create a new user", async () => {
    const user = {
      name: "Jhon Doe",
      email: "jhon@doe.com",
      password: "12345"
    }

    const createdUser = await createUserUseCase.execute(user)

    expect(createdUser).toHaveProperty("id")
    expect(createdUser).toBeInstanceOf(User)
  })
  it("Should not be able to Create a user with same email", async () => {
    expect(async () => {
      const user = {
        name: "Jhon Doe",
        email: "jhon@doe.com",
        password: "12345"
      }

      await createUserUseCase.execute(user)
      await createUserUseCase.execute(user)
    }).rejects.toBeInstanceOf(CreateUserError)
  })
})
