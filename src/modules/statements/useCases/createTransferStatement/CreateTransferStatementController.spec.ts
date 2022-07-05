import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
let tokenGlobal: string;
let receiverId: string;
const emailGlobal = "jhon@doe.com";
const passwordGlobal = "12345";
const nameGlobal = "Jhon Doe";

describe("Create Transfer Statement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();

    const user_id = uuidv4();

    const password = await hash(passwordGlobal, 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at) values('${user_id}', '${nameGlobal}', '${emailGlobal}', '${password}', 'now()', 'now()')`
    );

    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: emailGlobal,
      password: passwordGlobal,
    });

    tokenGlobal = responseAuth.body.token;

    const recId = uuidv4();

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at) values('${recId}', 'Kate Hall', 'zitika@un.gp', '${password}', 'now()', 'now()')`
    );

    receiverId = recId;
  });
  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });
  it("Should be able to create a new Transfer Statement", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 500,
        description: "Test Deposit",
      })
      .set({
        authorization: `Bearer ${tokenGlobal}`,
      });

    const responseTransfer = await request(app)
      .post(`/api/v1/statements/transfer/${receiverId}`)
      .send({
        amount: 100,
        description: "Description Test",
      })
      .set({
        authorization: `Bearer ${tokenGlobal}`,
      });

    expect(responseTransfer.status).toEqual(201);
    expect(responseTransfer.body).toHaveProperty("id");
  });
  it("Should not be able to create a new Transfer Statement for a nonexisting user", async () => {
    const falseId = uuidv4();

    const responseTransfer = await request(app)
      .post(`/api/v1/statements/transfer/${falseId}`)
      .send({
        amount: 100,
        description: "Description Test",
      })
      .set({
        authorization: `Bearer ${tokenGlobal}`,
      });

    expect(responseTransfer.status).toEqual(404);
    expect(responseTransfer.body).toEqual({
      message: "Receiver not found or is Incorrect",
    });
  });
  it("Should not be able to create a new Transfer Statement without funds", async () => {
    const responseTransfer = await request(app)
      .post(`/api/v1/statements/transfer/${receiverId}`)
      .send({
        amount: 600,
        description: "Description Test",
      })
      .set({
        authorization: `Bearer ${tokenGlobal}`,
      });

    expect(responseTransfer.status).toEqual(400);
    expect(responseTransfer.body).toEqual({
      message: "Insufficient funds",
    });
  });
});
