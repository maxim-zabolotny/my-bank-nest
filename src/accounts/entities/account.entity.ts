import { ApiProperty } from '@nestjs/swagger';

export class Account {
  @ApiProperty()
  id: string;
  @ApiProperty()
  balance: number;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
