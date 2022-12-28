import { ApiProperty } from '@nestjs/swagger';
import {IsNotEmpty} from "class-validator";

export class CheckVerificationCodeDtoDto {
  @ApiProperty()
  @IsNotEmpty()
  code: string;
}
