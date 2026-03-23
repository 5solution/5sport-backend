import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiCreatedSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiCreatedSuccessResponse(null, { description: 'Gửi feedback' })
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, { description: 'Danh sách feedback (admin)' })
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @Query('category') category: string,
  ) {
    return this.feedbackService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      category,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, { description: 'Chi tiết feedback' })
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, { description: 'Cập nhật trạng thái feedback' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFeedbackStatusDto) {
    return this.feedbackService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, { description: 'Xóa feedback' })
  remove(@Param('id') id: string) {
    return this.feedbackService.remove(id);
  }
}
