import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
const emailGlobal = "jhon@doe.com";
const passwordGlobal = "12345";
const nameGlobal = "Jhon Doe";

describe("Authenticate User", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();

    const id = uuidv4();

    const password = await hash(passwordGlobal, 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at) values('${id}', '${nameGlobal}', '${emailGlobal}', '${password}', 'now()', 'now()')`
    );
  });
  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
  it("Should be able to create a session", async () => {
    const authenticationResponse = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: emailGlobal,
        password: passwordGlobal,
      });

    const response = authenticationResponse.body;

    expect(response).toHaveProperty("token");
    expect(response.user).toHaveProperty("id");
    expect(response.user.name).toEqual(nameGlobal);
  });
  it("Should not be able to create a session with wrong email", async () => {
    const authenticationResponse = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "teste@test.com",
        password: passwordGlobal,
      });

    expect(authenticationResponse.status).toEqual(401);
    expect(authenticationResponse.text).toEqual(
      '{"message":"Incorrect email or password"}'
    );
  });
  it("Should not be able to create a session with wrong password", async () => {
    const authenticationResponse = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: emailGlobal,
        password: "54321",
      });

    expect(authenticationResponse.status).toEqual(401);
    expect(authenticationResponse.text).toEqual(
      '{"message":"Incorrect email or password"}'
    );
  });
});
