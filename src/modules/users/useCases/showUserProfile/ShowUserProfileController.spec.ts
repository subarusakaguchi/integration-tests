import { Connection } from "typeorm"
import { v4 as uuidv4 } from 'uuid'
import { hash } from "bcryptjs"
import request from "supertest"
import { app } from "../../../../app"

import createConnection from '../../../../database/index'

let connection: Connection
let tokenGlobal: string
const emailGlobal = "jhon@doe.com"
const passwordGlobal = "12345"
const nameGlobal = "Jhon Doe"

describe("Show User Profile", () => {
  beforeAll(async () => {
    connection = await createConnection()

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
  it("Should not be able to show the profile of without a token", async () => {
    const userProfileResponse = await request(app).get("/api/v1/profile")

    expect(userProfileResponse.status).toEqual(401)
    expect(userProfileResponse.text).toEqual('{"message":"JWT token is missing!"}')
  })
})
