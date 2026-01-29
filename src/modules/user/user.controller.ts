import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from 'src/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get paginated list of users' })
  async getUsers(@Query() query: PaginationQueryDto) {
    return this.userService.findAllPaginated(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user info from JWT' })
  async getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
}
