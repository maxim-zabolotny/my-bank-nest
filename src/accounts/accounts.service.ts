import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit-account.dto';
import { WithdrawDto } from './dto/withdraw-account.dto';

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
    return this.prisma.account.findFirst({ where: { userId } });
  }

  async deposit(depositDto: DepositDto) {
    const account = await this.findByUser(depositDto.userId);

    if (!account) throw new NotFoundException(`Account not found`);

    const newBalance = account.balance + depositDto.value;

    await this.prisma.$transaction([
      this.prisma.account.update({
        where: { userId: depositDto.userId },
        data: {
          balance: newBalance,
        },
      }),
      this.prisma.accountHistory.create({
        data: {
          balance: newBalance,
          value: depositDto.value,
          description: 'Successful deposit',
          accountId: account.id,
        },
      }),
    ]);
  }

  async withdraw(withdrawDto: WithdrawDto) {
    const account = await this.findByUser(withdrawDto.userId);

    if (!account) throw new NotFoundException(`Account not found`);

    const newBalance = account.balance - withdrawDto.value;

    if (newBalance < 0)
      throw new ConflictException(`The withdraw is more than balance`);

    await this.prisma.$transaction([
      this.prisma.account.update({
        where: { userId: withdrawDto.userId },
        data: {
          balance: newBalance,
        },
      }),
      this.prisma.accountHistory.create({
        data: {
          balance: newBalance,
          value: withdrawDto.value,
          description: 'Successful withdraw',
          accountId: account.id,
        },
      }),
    ]);
  }
}
