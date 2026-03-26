import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';
import { EventModule } from '../event/event.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => EventModule)],
  controllers: [UsersController],
  providers: [UserService],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
