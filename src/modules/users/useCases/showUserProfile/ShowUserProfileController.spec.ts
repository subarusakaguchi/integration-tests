import { Connection, createConnection, getConnectionOptions } from "typeorm"
import { v4 as uuidv4 } from 'uuid'
import { hash } from "bcryptjs"
import request from "supertest"
import { app } from "../../../../app"

let connection: Connection
let tokenGlobal: string
const emailGlobal = "jhon@doe.com"
const passwordGlobal = "12345"
const nameGlobal = "Jhon Doe"

describe("Show User Profile", () => {
  beforeAll(async () => {
    const defaultOptions = await getConnectionOptions()
    connection = await createConnection(
      Object.assign(defaultOptions, {
        host: "localhost",
        database: "fin_api"
      })
    )

    await connection.runMigrations()

    const id = uuidv4();

    const password = await hash(passwordGlobal, 8)

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at) values('${id}', '${nameGlobal}', '${emailGlobal}', '${password}', 'now()', 'now()')`
    )

    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: emailGlobal,
      password: passwordGlobal
    })

    tokenGlobal = responseAuth.body.token
  })
  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })
  it("Should be able to show the user profile", async () => {
    const userProfileResponse = await request(app).get("/api/v1/profile").set({
      authorization: `Bearer ${tokenGlobal}`
    })

    const response = userProfileResponse.body

    expect(response).toHaveProperty("id")
    expect(response.name).toEqual(nameGlobal)
  })
  it("Should not be able to show the profile of a non existing user", async () => {
    const tokenTest = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNWNlYmM5YWItZGI4MS00ZGMxLWI3YzktNDhhNWIzZWM3OTJiIiwibmFtZSI6Ikpob24gRG9lIiwiZW1haWwiOiJqaG9uQGRvZS5jb20iLCJwYXNzd29yZCI6IiQyYSQwOCR1MGF3Q290dWJPcHpkOGNOcHNRWVJlN2M3RnJWZXlZdkx5Qm1zTE91TzZzeTZvTWZZNDFXLiIsImNyZWF0ZWRfYXQiOiIyMDIyLTA2LTMwVDA1OjMxOjUwLjE1NFoiLCJ1cGRhdGVkX2F0IjoiMjAyMi0wNi0zMFQwNTozMTo1MC4xNTRaIn0sImlhdCI6MTY1NjU1NjMxMCwiZXhwIjoxNjU2NjQyNzEwLCJzdWIiOiI1Y2ViYzlhYi1kYjgxLTRkYzEtYjdjOS00OGE1YjNlYzc5MmIifQ.v7inPrDWFh09HUkUrcr5uT5TTWW8dFtHas90F9NmjCU"

    const userProfileResponse = await request(app).get("/api/v1/profile").set({
      authorization: `Bearer ${tokenTest}`
    })

    expect(userProfileResponse.status).toEqual(404)
    expect(userProfileResponse.text).toEqual('{"message":"User not found"}')
  })
  it("Should not be able to show the profile of without a token", async () => {
    const userProfileResponse = await request(app).get("/api/v1/profile")

    expect(userProfileResponse.status).toEqual(401)
    expect(userProfileResponse.text).toEqual('{"message":"JWT token is missing!"}')
  })
})
