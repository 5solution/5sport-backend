import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Omit<User, 'password'>>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
      select: [
        'id',
        'email',
        'displayName',
        'avatarUrl',
        'role',
        'tags',
        'created_at',
        'updated_at',
      ],
    });

    return new PaginatedResponseDto(users, totalItems, page, limit);
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'displayName',
        'avatarUrl',
        'role',
        'tags',
        'created_at',
        'updated_at',
      ],
    });

    return user;
  }
}
