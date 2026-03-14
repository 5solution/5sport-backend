import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { TestGroupOrderEmailDto } from './dto/test-group-order-email.dto';
import { Roles, Role } from 'src/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('ping')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  ping() {
    return this.mailService.ping();
  }

  @Post('test/group-order')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  testGroupOrderEmail(@Body() dto: TestGroupOrderEmailDto) {
    return this.mailService.sendGroupOrderConfirmation(dto);
  }
}
