import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignMatchDto {
  @ApiProperty({ description: 'Match ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  matchId: string;

  @ApiProperty({ description: 'Court ID to assign to' })
  @IsUUID()
  @IsNotEmpty()
  courtId: string;
}

export class UnassignMatchDto {
  @ApiProperty({ description: 'Match ID to unassign' })
  @IsUUID()
  @IsNotEmpty()
  matchId: string;
}

export class SwapCourtDto {
  @ApiProperty({ description: 'Match ID' })
  @IsUUID()
  @IsNotEmpty()
  matchId: string;

  @ApiProperty({ description: 'New Court ID' })
  @IsUUID()
  @IsNotEmpty()
  newCourtId: string;
}
