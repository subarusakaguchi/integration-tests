import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType, Statement } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "../createStatement/CreateStatementError";

interface ICreateTransferStatementRequest {
  user_id: string;
  amount: number;
  sender_id: string;
  description: string;
  type: OperationType;
}

@injectable()
class CreateTransferStatementUseCase {
  constructor(
    @inject("StatementsRepository")
    private statementsRepository: IStatementsRepository,
    @inject("UsersRepository")
    private usersRepository: IUsersRepository
  ) {}
  async execute({
    user_id,
    amount,
    sender_id,
    description,
    type,
  }: ICreateTransferStatementRequest): Promise<Statement> {
    const receiverExists = await this.usersRepository.findById(user_id);

    if (!receiverExists || receiverExists.id === sender_id) {
      throw new CreateStatementError.ReceiverNotFound();
    }

    const senderBalance =
      await this.statementsRepository.getUserStatementsBalance({
        user_id: sender_id,
        with_statement: false,
      });

    if (senderBalance.balance < amount) {
      throw new CreateStatementError.InsufficientFunds();
    }

    const transferStatement = await this.statementsRepository.create({
      user_id,
      amount,
      sender_id,
      description,
      type,
    });

    return transferStatement;
  }
}

export { CreateTransferStatementUseCase };
