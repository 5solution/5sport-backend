import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleTokenDto {
  @ApiProperty({
    description: 'Google ID token from OAuth (JWT token from Google)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTE1MmU0ZmY0YTNiOGQ2M2QzOGE...',
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
