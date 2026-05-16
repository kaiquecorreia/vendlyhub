import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ValidateUserUseCase } from '../use-cases/validate-user.usecase';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private validateUserUseCase: ValidateUserUseCase) {
    super({ usernameField: 'identifier' });
  }

  async validate(identifier: string, password: string) {
    const user = await this.validateUserUseCase.execute(identifier, password);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
