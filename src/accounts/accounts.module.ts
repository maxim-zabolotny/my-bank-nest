import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AccountsController],
  imports: [PrismaModule],
  providers: [AccountsService],
})
export class AccountsModule {}
