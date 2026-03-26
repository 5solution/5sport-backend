import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from 'src/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { User } from './user.entity';
import { UserService } from './user.service';
import { ParticipantService } from '../event/participant.service';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly participantService: ParticipantService,
  ) {}

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

  @Get('me/events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get events the current user has participated in' })
  async getMyEvents(@CurrentUser() user: User) {
    const participations = await this.participantService.findByUser(user.id);

    return participations.map((p) => ({
      participantId: p.id,
      status: p.status,
      ticketCode: p.ticketCode,
      registrationDate: p.registrationDate,
      checkinDate: p.checkinDate,
      bibNumber: p.bibNumber,
      partnerId: p.partnerId,
      partner: p.partner ? { id: p.partner.id, name: p.partner.name } : null,
      session: p.session
        ? {
            id: p.session.id,
            name: p.session.name,
            competitionFormat: p.session.competitionFormat,
            requirePartner: p.session.requirePartner,
          }
        : null,
      event: p.event
        ? {
            id: p.event.id,
            name: p.event.name,
            brand: p.event.brand,
            sportType: p.event.sportType,
            slug: p.event.slug,
            status: p.event.status,
            bannerImageUrl: p.event.bannerImageUrl,
            eventStartTime: p.event.eventStartTime,
            eventEndTime: p.event.eventEndTime,
            address: p.event.address,
          }
        : null,
    }));
  }
}
