import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase"
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError"

let usersRepositoryInMemory: InMemoryUsersRepository
let authenticateUserUseCase: AuthenticateUserUseCase

describe("Authenticate User", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory)
  })
  it("Should be able to create a session", async () => {
    const user = await usersRepositoryInMemory.create({
      name: "Jhon Doe",
      email: "jhon@doe.com",
      password: "12345"
    })

    const authentication = await authenticateUserUseCase.execute({ email: user.email, password: user.password})

    expect(authentication).toHaveProperty("token")
    expect(authentication.user).toHaveProperty("id")
  })
  it("Should not be able to create a session with wrong password", async () => {
    expect(async () => {
      const user = await usersRepositoryInMemory.create({
        name: "Jhon Doe",
        email: "jhon@doe.com",
        password: "12345"
      })

      await authenticateUserUseCase.execute({ email: user.email, password: "1234"})
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })
  it("Should not be able to create a session with wrong email", async () => {
    expect(async () => {
      const user = await usersRepositoryInMemory.create({
        name: "Jhon Doe",
        email: "jhon@doe.com",
        password: "12345"
      })

      await authenticateUserUseCase.execute({ email: "teste@teste.com", password: user.password})
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })
  it("Should not be able to create a session for a non existing user", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({ email: "jhon@doe.com", password: "1234"})
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })
})
