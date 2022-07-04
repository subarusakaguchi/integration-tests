import { Connection } from "typeorm"
import { v4 as uuidv4 } from 'uuid'
import { hash } from "bcryptjs"
import request from "supertest"
import { app } from "../../../../app"

import createConnection from '../../../../database/index'

let connection: Connection
let tokenGlobal: string
const amountGlobal = 4
const emailGlobal = "jhon@doe.com"
const passwordGlobal = "12345"
const nameGlobal = "Jhon Doe"

describe("Get Balance", () => {
  beforeAll(async () => {
    connection = await createConnection()

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

    const statementId = uuidv4()

    await connection.query(
      `INSERT INTO STATEMENTS(id, user_id, description, amount, type, created_at, updated_at) values('${statementId}', '${user_id}', 'Test', ${amountGlobal}, 'deposit', 'now()', 'now()')`
    )
  })
  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })
  it("Should be able to return balance of an existing user", async () => {
    const balanceResponse = await request(app).get("/api/v1/statements/balance")
    .set({
      authorization: `Bearer ${tokenGlobal}`
    })

    const response = balanceResponse.body

    expect(response).toHaveProperty("balance")
    expect(response.balance).toEqual(amountGlobal)
    expect(response.statement[0]).toHaveProperty("id")
  })
  it("Should not be able to return balance without a token", async () => {
    const userProfileResponse = await request(app).get("/api/v1/statements/balance")

    expect(userProfileResponse.status).toEqual(401)
    expect(userProfileResponse.text).toEqual('{"message":"JWT token is missing!"}')
  })
})
