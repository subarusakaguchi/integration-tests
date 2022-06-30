import { User } from "../../entities/User"
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { ShowUserProfileError } from "./ShowUserProfileError"
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase"

let usersRepositoryInMemory: InMemoryUsersRepository
let showUserProfileUseCase: ShowUserProfileUseCase

describe("Show User Profile", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepositoryInMemory)
  })
  it("Should be able to return an user by id", async () => {
    const createdUser: User = await usersRepositoryInMemory.create({
      name: "Jhon Doe",
      email: "jhon@doe.com",
      password: "12345"
    })

    const returnedUser = await showUserProfileUseCase.execute(createdUser.id as string)

    expect(returnedUser).toEqual(createdUser)
  })
  it("Should not be able to return an non existing user", async () => {
    expect(async () => {
      await showUserProfileUseCase.execute("12345")
    }).rejects.toBeInstanceOf(ShowUserProfileError)
  })
  it("Should not be able to return user with wrong id", async () => {
    expect(async () => {
      const createdUser: User = await usersRepositoryInMemory.create({
        name: "Jhon Doe",
        email: "jhon@doe.com",
        password: "12345"
      })

      await showUserProfileUseCase.execute("teste")
    }).rejects.toBeInstanceOf(ShowUserProfileError)
  })
})
