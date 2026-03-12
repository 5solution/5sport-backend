import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CourtService } from './court.service';

class ValidateQrDto {
  token: string;
}

@ApiTags('court-auth')
@Controller('auth/court')
export class CourtAccessController {
  constructor(private readonly courtService: CourtService) {}

  @Post('qr')
  @ApiOperation({
    summary: 'Validate court QR token and issue court access JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns court-scoped access token',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired QR token' })
  async validateQr(
    @Body() dto: ValidateQrDto,
  ): Promise<{ accessToken: string; courtId: string; eventId: string }> {
    const { courtId, eventId } = await this.courtService.validateQrToken(
      dto.token,
    );
    const accessToken = await this.courtService.issueCourtAccessToken(
      courtId,
      eventId,
    );

    return { accessToken, courtId, eventId };
  }
}
