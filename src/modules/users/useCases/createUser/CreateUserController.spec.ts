import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
const emailGlobal = "jhon@doe.com";
const passwordGlobal = "12345";
const nameGlobal = "Jhon Doe";

describe("Create User", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();
  });
  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
  it("Should be able to create a new User", async () => {
    const password = await hash(passwordGlobal, 8);

    const response = await request(app).post("/api/v1/users").send({
      name: nameGlobal,
      email: emailGlobal,
      password,
    });

    expect(response.status).toEqual(201);
  });
  it("Should not be able to create a User with an existing email", async () => {
    const password = await hash(passwordGlobal, 8);

    const responseTest = await request(app).post("/api/v1/users").send({
      name: nameGlobal,
      email: emailGlobal,
      password,
    });

    expect(responseTest.status).toEqual(400);
    expect(responseTest.text).toEqual('{"message":"User already exists"}');
  });
});
