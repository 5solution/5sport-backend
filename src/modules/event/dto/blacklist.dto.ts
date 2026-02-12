import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetBlacklistDto {
  @ApiProperty({
    description:
      'Danh sách email/SĐT cần chặn (phân tách bởi dấu cách hoặc Enter)',
    example: 'spam@example.com 0901234567\ntest@test.com',
  })
  @IsString()
  raw: string;
}
