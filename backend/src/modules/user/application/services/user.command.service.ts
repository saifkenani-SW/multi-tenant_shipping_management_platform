import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dtos/requests/create-user.dto';
import { UserCommandRepository } from '../../infrastructure/repositories/user.command.repository';
import { Transactional } from '../../../../packages/transaction';

@Injectable()
export class UserCommandService {
  constructor(private readonly userCommandRepository: UserCommandRepository) {}

  @Transactional()
  async createUser(dto: CreateUserDto): Promise<string> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    return this.userCommandRepository.create({
      ...dto,
      passwordHash,
    });
  }
}
