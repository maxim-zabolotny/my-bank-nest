import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/models/UserFromJwt';
import { AccountsService } from './accounts.service';
import { DepositDto } from './dto/deposit-account.dto';
import { TransferDto } from './dto/transfer-account.dto';
import { WithdrawDto } from './dto/withdraw-account.dto';
import { Account } from './entities/account.entity';
import { MovimentationType } from './enums/movimentation.enum';

@ApiTags('Account')
@ApiSecurity('bearer')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @ApiResponse({
    status: 201,
    description: 'Account created',
    type: Account,
  })
  @ApiConflictResponse({ description: 'Account already created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorired' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOperation({
    summary: 'Create an account to current user',
    description: 'Create an account to current user, *One account per user*',
  })
  @Post()
  create(@CurrentUser() user: UserFromJwt) {
    return this.accountsService.create({
      userId: user.id,
    });
  }

  @ApiResponse({
    status: 200,
    description: 'Account details',
    type: Account,
  })
  @ApiNotFoundResponse({ description: 'Account not exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorired' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOperation({
    summary: 'Account details with balance and history',
    description: 'Get details of the user account',
  })
  @Get()
  async findOne(@CurrentUser() user: UserFromJwt) {
    const account = await this.accountsService.findByUser(user.id);
    if (!account)
      throw new NotFoundException(`Account not found for this user`);

    return account;
  }

  @ApiResponse({
    status: 204,
    description: 'Success',
  })
  @ApiOperation({
    summary: 'Make a deposit',
    description: 'Send money to user account',
  })
  @ApiNotFoundResponse({ description: 'Account not exists' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorired' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
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

  @ApiResponse({
    status: 204,
    description: 'Success',
  })
  @ApiNotFoundResponse({ description: 'Account not exists' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorired' })
  @ApiConflictResponse({ description: 'The withdraw is more than balance' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOperation({
    summary: 'Make a withdraw',
    description: 'Make a withdraw and use the money in another bank',
  })
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

  @ApiResponse({
    status: 204,
    description: 'Success',
  })
  @ApiOperation({
    summary: 'Transfer money',
    description: 'Transfer money to another *my-bank* account',
  })
  @ApiNotFoundResponse({ description: 'Account not exists' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorired' })
  @ApiConflictResponse({ description: 'The transfer is more than balance' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
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
