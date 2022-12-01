import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class WithdrawDto {
  @ApiProperty()
  @IsNumber()
  value: number;

  userId?: string;
}
