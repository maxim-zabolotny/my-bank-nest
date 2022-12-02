import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit-account.dto';
import { TransferDto } from './dto/transfer-account.dto';
import { WithdrawDto } from './dto/withdraw-account.dto';
import { MovimentationType } from './enums/movimentation.enum';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto) {
    const alreadyExists = await this.findByUser(createAccountDto.userId);

    if (alreadyExists)
      throw new ConflictException('Account already exists to user');

    const balance = 0;

    return this.prisma.account.create({
      data: {
        balance,
        user: { connect: { id: createAccountDto.userId } },
        accountHistory: {
          create: { description: 'Account created', balance, value: balance },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.account.findUnique({ where: { id } });
  }

  findByUser(userId: string) {
    return this.prisma.account.findFirst({
      where: { userId },
      include: { accountHistory: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findByEmail(email: string) {
    return this.prisma.account.findFirst({
      where: { user: { email } },
    });
  }

  async movimentation(
    movimentationDto: DepositDto | WithdrawDto,
    type: MovimentationType,
  ) {
    const account = await this.findByUser(movimentationDto.userId);

    if (!account) throw new NotFoundException(`Account not found`);

    const description =
      type === MovimentationType.DEPOSIT
        ? 'Successful deposit'
        : 'Successful withdraw';

    const parsedValue =
      movimentationDto.value * (type === MovimentationType.WITHDRAW ? -1 : 1);

    const newBalance = account.balance + parsedValue;

    if (newBalance < 0)
      throw new ConflictException(`The withdraw is more than balance`);

    await this.prisma.$transaction([
      this.prisma.account.update({
        where: { userId: movimentationDto.userId },
        data: {
          balance: newBalance,
        },
      }),
      this.prisma.accountHistory.create({
        data: {
          balance: newBalance,
          value: parsedValue,
          description,
          accountId: account.id,
        },
      }),
    ]);
  }

  async transfer(transferDto: TransferDto) {
    if (transferDto.senderEmail === transferDto.receiverEmail)
      throw new ConflictException('Is not possible send money to your self');

    const senderAccount = await this.findByUser(transferDto.userId);

    if (!senderAccount)
      throw new NotFoundException('You should create an account first');

    if (transferDto.value > senderAccount.balance)
      throw new UnprocessableEntityException("You don't have balance enough");

    const receiverAccount = await this.findByEmail(transferDto.receiverEmail);

    if (!receiverAccount)
      throw new NotFoundException(
        `Account with email ${transferDto.receiverEmail} doesn't exists`,
      );

    const senderNewBalance = senderAccount.balance - transferDto.value;
    const recieverNewBalance = receiverAccount.balance + transferDto.value;

    await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: senderAccount.id },
        data: {
          balance: senderNewBalance,
        },
      }),
      this.prisma.accountHistory.create({
        data: {
          balance: senderNewBalance,
          value: -transferDto.value,
          description: `Transfer sent to account ${receiverAccount.id}`,
          accountId: senderAccount.id,
        },
      }),
      this.prisma.account.update({
        where: { id: receiverAccount.id },
        data: {
          balance: recieverNewBalance,
        },
      }),
      this.prisma.accountHistory.create({
        data: {
          balance: recieverNewBalance,
          value: transferDto.value,
          description: `Transfer received from account ${senderAccount.id}`,
          accountId: receiverAccount.id,
        },
      }),
    ]);
  }
}
