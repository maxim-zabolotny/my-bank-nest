import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, Min, NotEquals } from 'class-validator';

export class TransferDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @NotEquals(0)
  value: number;

  @ApiProperty()
  @IsEmail()
  receiverEmail: string;

  userId?: string;
  senderEmail?: string;
}
