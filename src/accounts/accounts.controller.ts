import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserFromJwt } from 'src/auth/models/UserFromJwt';
import { AccountsService } from './accounts.service';
import { DepositDto } from './dto/deposit-account.dto';
import { WithdrawDto } from './dto/withdraw-account.dto';

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
  findOne(@CurrentUser() user: UserFromJwt) {
    return this.accountsService.findByUser(user.id);
  }

  @Post('deposit')
  @HttpCode(204)
  deposit(@CurrentUser() user: UserFromJwt, @Body() depositoDto: DepositDto) {
    return this.accountsService.deposit({
      ...depositoDto,
      userId: user.id,
    });
  }

  @Post('withdraw')
  @HttpCode(204)
  withdraw(@CurrentUser() user: UserFromJwt, @Body() withdrawDto: WithdrawDto) {
    return this.accountsService.withdraw({
      value: withdrawDto.value,
      userId: user.id,
    });
  }
}
