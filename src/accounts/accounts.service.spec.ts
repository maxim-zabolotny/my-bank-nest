import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import {
  makeFakeUser,
  makeFakeAccount,
  makeFakeAccountHistory,
} from '../utils/tests/faker';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';
import { AccountHistory } from './entities/accountHistory.entity';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DepositDto } from './dto/deposit-account.dto';
import { faker } from '@faker-js/faker';
import { MovimentationType } from './enums/movimentation.enum';
import { WithdrawDto } from './dto/withdraw-account.dto';
import { TransferDto } from './dto/transfer-account.dto';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: PrismaService;
  let fakeAccount: Account;
  let fakeAccountHistory: AccountHistory;
  let fakeUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue({
        account: {
          findUnique: () => jest.fn(),
          findFirst: () => jest.fn(),
          create: () => jest.fn(),
          update: () => jest.fn(),
        },
        accountHistory: {
          create: () => jest.fn(),
          update: () => jest.fn(),
        },
        $transaction: () => jest.fn(),
      })
      .compile();

    service = module.get<AccountsService>(AccountsService);
    prisma = module.get(PrismaService);
    fakeAccount = makeFakeAccount();
    fakeAccountHistory = makeFakeAccountHistory();
    fakeUser = makeFakeUser();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call findUnique with correct values', () => {
    jest.spyOn(prisma.account, 'findUnique').mockResolvedValue(fakeAccount);

    expect(service.findOne(fakeAccount.id)).resolves.toBe(fakeAccount);
    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { id: fakeAccount.id },
    });
  });

  it('should throws if findUnique throws', () => {
    const exception = new Error('any-error');
    jest.spyOn(prisma.account, 'findUnique').mockRejectedValueOnce(exception);

    expect(service.findOne(fakeAccount.id)).rejects.toEqual(exception);
  });

  it('should call findFirst with correct values', () => {
    jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(fakeAccount);

    expect(service.findByUser(fakeAccount.userId)).resolves.toBe(fakeAccount);
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { userId: fakeAccount.userId },
      include: { accountHistory: { orderBy: { createdAt: 'desc' } } },
    });
  });

  it('should throws if findFirst throws', () => {
    const exception = new Error('any-error');
    jest.spyOn(prisma.account, 'findFirst').mockRejectedValueOnce(exception);

    expect(service.findByUser(fakeAccount.userId)).rejects.toEqual(exception);
  });

  it('should call findFirst with correct values', () => {
    jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(fakeAccount);

    expect(service.findByEmail(fakeUser.email)).resolves.toBe(fakeAccount);
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { user: { email: fakeUser.email } },
    });
  });

  it('should throws if findFirst throws', () => {
    const exception = new Error('any-error');
    jest.spyOn(prisma.account, 'findFirst').mockRejectedValueOnce(exception);

    expect(service.findByEmail(fakeUser.email)).rejects.toEqual(exception);
  });

  it('should create an account with success', async () => {
    jest.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
    jest.spyOn(prisma.account, 'create').mockResolvedValue(fakeAccount);

    const response = await service.create({ userId: fakeUser.id });

    expect(response).toEqual(fakeAccount);
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        balance: 0,
        user: { connect: { id: fakeUser.id } },
        accountHistory: {
          create: { description: 'Account created', balance: 0, value: 0 },
        },
      },
    });
  });

  it('should throw if account already exists', async () => {
    jest.spyOn(service, 'findByUser').mockResolvedValue({
      ...fakeAccount,
      accountHistory: [fakeAccountHistory],
    });
    jest.spyOn(prisma.account, 'create').mockResolvedValue(fakeAccount);

    const response = service.create({ userId: fakeUser.id });

    expect(response).rejects.toEqual(
      new ConflictException('Account already exists to user'),
    );
    expect(prisma.account.create).not.toHaveBeenCalled();
  });

  it('should make a deposit movimentation with success', async () => {
    jest.spyOn(service, 'findByUser').mockResolvedValue({
      ...fakeAccount,
      accountHistory: [fakeAccountHistory],
    });
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const depoistDto: DepositDto = {
      value: faker.datatype.float(),
      userId: fakeUser.id,
    };

    await service.movimentation(depoistDto, MovimentationType.DEPOSIT);

    const newBalance = fakeAccount.balance + depoistDto.value;

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { userId: depoistDto.userId },
      data: {
        balance: newBalance,
      },
    });
    expect(prisma.accountHistory.create).toHaveBeenCalledWith({
      data: {
        balance: newBalance,
        value: depoistDto.value,
        description: 'Successful deposit',
        accountId: fakeAccount.id,
      },
    });
  });

  it('should make a withdraw movimentation with success', async () => {
    const mockBalance = 200;

    jest.spyOn(service, 'findByUser').mockResolvedValue({
      ...fakeAccount,
      balance: mockBalance,
      accountHistory: [fakeAccountHistory],
    });
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const withdrawDto: WithdrawDto = {
      value: 100,
      userId: fakeUser.id,
    };

    await service.movimentation(withdrawDto, MovimentationType.WITHDRAW);

    const newBalance = mockBalance - withdrawDto.value;

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { userId: withdrawDto.userId },
      data: {
        balance: newBalance,
      },
    });
    expect(prisma.accountHistory.create).toHaveBeenCalledWith({
      data: {
        balance: newBalance,
        value: -withdrawDto.value,
        description: 'Successful withdraw',
        accountId: fakeAccount.id,
      },
    });
  });

  it('should throw if a value of withdraw is more than account balance', async () => {
    const mockBalance = 100;

    jest.spyOn(service, 'findByUser').mockResolvedValue({
      ...fakeAccount,
      balance: mockBalance,
      accountHistory: [fakeAccountHistory],
    });
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const withdrawDto: WithdrawDto = {
      value: 200,
      userId: fakeUser.id,
    };

    expect(
      service.movimentation(withdrawDto, MovimentationType.WITHDRAW),
    ).rejects.toEqual(
      new ConflictException(`The withdraw is more than balance`),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.account.update).not.toHaveBeenCalledWith();
    expect(prisma.accountHistory.create).not.toHaveBeenCalledWith();
  });

  it("should throw if account doesn't exists", async () => {
    jest.spyOn(service, 'findByUser').mockResolvedValue(null);
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const withdrawDto: WithdrawDto = {
      value: 100,
      userId: fakeUser.id,
    };

    expect(
      service.movimentation(withdrawDto, MovimentationType.WITHDRAW),
    ).rejects.toEqual(new NotFoundException(`Account not found`));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.account.update).not.toHaveBeenCalledWith();
    expect(prisma.accountHistory.create).not.toHaveBeenCalledWith();
  });

  it('should make a transfer with success', async () => {
    const senderBalance = faker.datatype.float({ min: 0, precision: 2 });
    const recieverBalance = faker.datatype.float({ min: 0, precision: 2 });

    jest.spyOn(service, 'findByUser').mockResolvedValue({
      ...fakeAccount,
      balance: senderBalance,
      accountHistory: [fakeAccountHistory],
    });

    const receiverAccount: Account = {
      ...makeFakeAccount(),
      balance: recieverBalance,
    };

    jest.spyOn(service, 'findByEmail').mockResolvedValue(receiverAccount);
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const transferDto: TransferDto = {
      value: faker.datatype.float({ max: senderBalance }),
      receiverEmail: fakeUser.email,
      senderEmail: faker.internet.email(),
    };

    await service.transfer(transferDto);

    const senderNewBalance = senderBalance - transferDto.value;
    const recieverNewBalance = recieverBalance + transferDto.value;

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.account.update).toHaveBeenNthCalledWith(1, {
      where: { id: fakeAccount.id },
      data: {
        balance: senderNewBalance,
      },
    });
    expect(prisma.accountHistory.create).toHaveBeenNthCalledWith(1, {
      data: {
        balance: senderNewBalance,
        value: -transferDto.value,
        description: `Transfer sent to account ${receiverAccount.id}`,
        accountId: fakeAccount.id,
      },
    });
    expect(prisma.account.update).toHaveBeenNthCalledWith(2, {
      where: { id: receiverAccount.id },
      data: {
        balance: recieverNewBalance,
      },
    });
    expect(prisma.accountHistory.create).toHaveBeenNthCalledWith(2, {
      data: {
        balance: recieverNewBalance,
        value: transferDto.value,
        description: `Transfer received from account ${fakeAccount.id}`,
        accountId: receiverAccount.id,
      },
    });
  });

  it('should throw if emails are equals', async () => {
    const email = fakeUser.email;

    expect(
      service.transfer({
        receiverEmail: email,
        senderEmail: email,
        value: faker.datatype.float(),
      }),
    ).rejects.toEqual(
      new ConflictException('Is not possible send money to your self'),
    );
  });

  it("should throw if sender account doesn't exists", async () => {
    jest.spyOn(service, 'findByUser').mockResolvedValue(null);
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const transferDto: TransferDto = {
      value: faker.datatype.float(),
      receiverEmail: fakeUser.email,
      senderEmail: faker.internet.email(),
    };

    expect(service.transfer(transferDto)).rejects.toEqual(
      new NotFoundException('You should create an account first'),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.account.update).not.toHaveBeenCalled();
    expect(prisma.accountHistory.create).not.toHaveBeenCalled();
  });

  it('should throw if the transfer value is more than account balance', async () => {
    const senderBalance = faker.datatype.float({ min: 0, precision: 2 });

    jest.spyOn(service, 'findByUser').mockResolvedValue({
      ...fakeAccount,
      balance: senderBalance,
      accountHistory: [fakeAccountHistory],
    });
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const transferDto: TransferDto = {
      value: faker.datatype.float({ min: senderBalance + 1 }),
      receiverEmail: fakeUser.email,
      senderEmail: faker.internet.email(),
    };

    expect(service.transfer(transferDto)).rejects.toEqual(
      new UnprocessableEntityException("You don't have balance enough"),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.account.update).not.toHaveBeenCalled();
    expect(prisma.accountHistory.create).not.toHaveBeenCalled();
  });

  it("should throw if reciever account doesn't exists", async () => {
    const senderBalance = faker.datatype.float({ min: 10, precision: 2 });

    jest.spyOn(service, 'findByUser').mockResolvedValue({
      ...fakeAccount,
      balance: senderBalance,
      accountHistory: [fakeAccountHistory],
    });
    jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(prisma.account, 'update').mockResolvedValueOnce(null);
    jest.spyOn(prisma.accountHistory, 'create').mockResolvedValueOnce(null);
    jest.spyOn(prisma, '$transaction').mockResolvedValue(null);

    const transferDto: TransferDto = {
      value: faker.datatype.float({ max: senderBalance - 1 }),
      receiverEmail: fakeUser.email,
      senderEmail: faker.internet.email(),
    };

    expect(service.transfer(transferDto)).rejects.toEqual(
      new NotFoundException(
        `Account with email ${transferDto.receiverEmail} doesn't exists`,
      ),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.account.update).not.toHaveBeenCalled();
    expect(prisma.accountHistory.create).not.toHaveBeenCalled();
  });
});
