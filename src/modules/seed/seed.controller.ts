import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { GenerateUsersDto } from './dto/generate-users.dto';
import { RegisterParticipantsDto } from './dto/register-participants.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../user/user.entity';
import { EventParticipant } from '../event/entities/event-participant.entity';

@ApiTags('seed')
@Controller('seed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('users')
  @ApiOperation({ summary: 'Generate bot users with athlete profiles' })
  @ApiResponse({
    status: 201,
    description: 'Bot users generated',
    type: [User],
  })
  async generateUsers(@Body() dto: GenerateUsersDto): Promise<User[]> {
    return await this.seedService.generateUsers(dto);
  }

  @Post('register-participants')
  @ApiOperation({
    summary: 'Register bot users as participants in a session',
  })
  @ApiResponse({
    status: 201,
    description: 'Participants registered',
    type: [EventParticipant],
  })
  async registerParticipants(
    @Body() dto: RegisterParticipantsDto,
  ): Promise<EventParticipant[]> {
    return await this.seedService.registerParticipants(dto);
  }
}
