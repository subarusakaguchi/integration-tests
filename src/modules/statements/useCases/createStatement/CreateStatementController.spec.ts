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

describe("Create Statement", () => {
  beforeAll(async () => {
    const defaultOptions = await getConnectionOptions()
    connection = await createConnection(
      Object.assign(defaultOptions, {
        host: "localhost",
        database: "fin_api"
      })
    )

    await connection.runMigrations()

    const user_id = uuidv4();

    const password = await hash(passwordGlobal, 8)

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at) values('${user_id}', '${nameGlobal}', '${emailGlobal}', '${password}', 'now()', 'now()')`
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
  it("Should be able to create a new Deposit Statement", async () => {
    const depositResponse = await request(app).post(`/api/v1/statements/deposit`)
    .send({
      amount: 400.00,
      description: "Test"
    })
    .set({
      authorization: `Bearer ${tokenGlobal}`
    })

    expect(depositResponse.status).toEqual(201)
    expect(depositResponse.body).toHaveProperty("id")
  })
  it("Should be able to create a new Withdraw Statement", async () => {
    const withdrawResponse = await request(app).post(`/api/v1/statements/withdraw`)
    .send({
      amount: 300.00,
      description: "Test"
    })
    .set({
      authorization: `Bearer ${tokenGlobal}`
    })

    expect(withdrawResponse.status).toEqual(201)
    expect(withdrawResponse.body).toHaveProperty("id")
    expect(400 - Number(withdrawResponse.body.amount)).toEqual(100)
  })
  it("Should not be able to create a new statement for a nonexisting user", async () => {
    const tokenTest = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNWNlYmM5YWItZGI4MS00ZGMxLWI3YzktNDhhNWIzZWM3OTJiIiwibmFtZSI6Ikpob24gRG9lIiwiZW1haWwiOiJqaG9uQGRvZS5jb20iLCJwYXNzd29yZCI6IiQyYSQwOCR1MGF3Q290dWJPcHpkOGNOcHNRWVJlN2M3RnJWZXlZdkx5Qm1zTE91TzZzeTZvTWZZNDFXLiIsImNyZWF0ZWRfYXQiOiIyMDIyLTA2LTMwVDA1OjMxOjUwLjE1NFoiLCJ1cGRhdGVkX2F0IjoiMjAyMi0wNi0zMFQwNTozMTo1MC4xNTRaIn0sImlhdCI6MTY1NjU1NjMxMCwiZXhwIjoxNjU2NjQyNzEwLCJzdWIiOiI1Y2ViYzlhYi1kYjgxLTRkYzEtYjdjOS00OGE1YjNlYzc5MmIifQ.v7inPrDWFh09HUkUrcr5uT5TTWW8dFtHas90F9NmjCU"

    const depositResponse = await request(app).get(`/api/v1/statements/deposit`).set({
      authorization: `Bearer ${tokenTest}`
    })

    expect(depositResponse.status).toEqual(404)
    expect(depositResponse.text).toEqual('{"message":"User not found"}')
  })
  it("Should not be able to create a new withdraw statement if it value is greater than balance", async () => {
    const withdrawResponse = await request(app).post(`/api/v1/statements/withdraw`)
    .send({
      amount: 200.00,
      description: "Test"
    })
    .set({
      authorization: `Bearer ${tokenGlobal}`
    })

    expect(withdrawResponse.status).toEqual(400)
    expect(withdrawResponse.text).toEqual('{"message":"Insufficient funds"}')
  })
  it("Should not be able to create a new statement without a token", async () => {
    const statementResponse = await request(app).get("/api/v1/statements/deposit").send({
      amount: 200.00,
      description: "Test"
    })

    expect(statementResponse.status).toEqual(401)
    expect(statementResponse.text).toEqual('{"message":"JWT token is missing!"}')
  })
})
