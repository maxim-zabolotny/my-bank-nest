import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/models/UserFromJwt';
import { AccountsService } from './accounts.service';
import { DepositDto } from './dto/deposit-account.dto';
import { TransferDto } from './dto/transfer-account.dto';
import { WithdrawDto } from './dto/withdraw-account.dto';
import { MovimentationType } from './enums/movimentation.enum';

@ApiTags('Account')
@ApiSecurity('bearer')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@CurrentUser() user: UserFromJwt) {
    return this.accountsService.create({
      userId: user.id,
    });
  }

  @Get()
  async findOne(@CurrentUser() user: UserFromJwt) {
    const account = await this.accountsService.findByUser(user.id);
    if (!account)
      throw new NotFoundException(`Account not found for this user`);

    return account;
  }

  @Post('deposit')
  @HttpCode(204)
  deposit(@CurrentUser() user: UserFromJwt, @Body() depositoDto: DepositDto) {
    return this.accountsService.movimentation(
      {
        ...depositoDto,
        userId: user.id,
      },
      MovimentationType.DEPOSIT,
    );
  }

  @Post('withdraw')
  @HttpCode(204)
  withdraw(@CurrentUser() user: UserFromJwt, @Body() withdrawDto: WithdrawDto) {
    return this.accountsService.movimentation(
      {
        value: withdrawDto.value,
        userId: user.id,
      },
      MovimentationType.WITHDRAW,
    );
  }

  @Post('transfer')
  @HttpCode(204)
  transfer(@CurrentUser() user: UserFromJwt, @Body() transferDto: TransferDto) {
    return this.accountsService.transfer({
      ...transferDto,
      userId: user.id,
      senderEmail: user.email,
    });
  }
}
