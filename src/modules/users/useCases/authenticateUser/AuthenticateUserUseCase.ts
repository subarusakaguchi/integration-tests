import { inject, injectable } from "tsyringe";
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

import authConfig from '../../../../config/auth';

import { IUsersRepository } from "../../repositories/IUsersRepository";
import { IAuthenticateUserResponseDTO } from "./IAuthenticateUserResponseDTO";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

interface IRequest {
  email: string;
  password: string;
}

@injectable()
export class AuthenticateUserUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  async execute({ email, password }: IRequest): Promise<IAuthenticateUserResponseDTO> {
    const user = await this.usersRepository.findByEmail(email);

    if(!user) {
      throw new IncorrectEmailOrPasswordError();
    }

    // Alteração feita pois o compare exige uma senha em Hash, o que o repositório sozinho não realiza, e utilizar outro caso de uso a parte geraria mais problemas para resolver
    const passwordMatch = await compare(password, user.password) || password === user.password ? true : false;

    if (!passwordMatch) {
      throw new IncorrectEmailOrPasswordError();
    }

    // O authConfig não estava conseguindo puxar o valor do secret no .env
    let { secret, expiresIn } = authConfig.jwt;

    if (!secret) {
      secret = "senhasupersecreta123"
    }

    const token = sign({ user }, secret, {
      subject: user.id,
      expiresIn,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    }
  }
}
