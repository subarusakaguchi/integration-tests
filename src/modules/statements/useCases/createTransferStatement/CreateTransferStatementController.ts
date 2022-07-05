import { Request, Response } from "express";
import { container } from "tsyringe";

import { OperationType } from "../../entities/Statement";
import { CreateTransferStatementUseCase } from "./CreateTransferStatementUseCase";

class CreateTransferStatementController {
  async execute(req: Request, res: Response): Promise<Response> {
    const { id: sender_id } = req.user;
    const { user_id } = req.params;
    const { amount, description } = req.body;

    const path = req.originalUrl.split("/");

    const type: OperationType = path[path.length - 2] as OperationType;

    const createTransferStatementUseCase = container.resolve(
      CreateTransferStatementUseCase
    );

    const statement = await createTransferStatementUseCase.execute({
      user_id,
      sender_id,
      amount,
      description,
      type,
    });

    return res.status(201).json(statement);
  }
}

export { CreateTransferStatementController };
