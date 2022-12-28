import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @ApiProperty()
  name: string;

  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(3)
  @ApiProperty()
  password: string;

  @IsPhoneNumber()
  @ApiProperty()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phone: string;
}
