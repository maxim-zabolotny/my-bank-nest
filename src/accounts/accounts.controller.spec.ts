import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UserFromJwt } from 'src/auth/models/UserFromJwt';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';
import { faker } from '@faker-js/faker';
import { AccountHistory } from './entities/accountHistory.entity';
import { NotFoundException } from '@nestjs/common';
import { DepositDto } from './dto/deposit-account.dto';
import { MovimentationType } from './enums/movimentation.enum';
import { WithdrawDto } from './dto/withdraw-account.dto';
import { TransferDto } from './dto/transfer-account.dto';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: DeepMockProxy<AccountsService>;
  let fakeAccount: DeepMockProxy<Account>;
  let fakeAccountHistory: DeepMockProxy<AccountHistory>;
  let fakerUseFromJwt: UserFromJwt;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [AccountsService],
    })
      .overrideProvider(AccountsService)
      .useValue(mockDeep<AccountsService>())
      .compile();

    service = module.get(AccountsService);
    controller = module.get<AccountsController>(AccountsController);
    fakeAccount = mockDeep<Account>();
    fakeAccountHistory = mockDeep<AccountHistory>();
    fakerUseFromJwt = {
      email: faker.internet.email(),
      id: faker.datatype.uuid(),
      name: faker.name.fullName(),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call AccountsService.create with correct values', async () => {
    service.create.mockResolvedValueOnce(fakeAccount);

    await controller.create(fakerUseFromJwt);

    expect(service.create).toHaveBeenCalledWith({ userId: fakerUseFromJwt.id });
  });

  it('should throws if AccountsService.create throws', async () => {
    const exception = new Error('any-error');

    service.create.mockRejectedValueOnce(exception);

    expect(controller.create(fakerUseFromJwt)).rejects.toEqual(exception);
  });

  it('should call AccountsService.findByUser with correct values', async () => {
    service.findByUser.mockResolvedValueOnce({
      ...fakeAccount,
      accountHistory: [fakeAccountHistory],
    });

    await controller.findOne(fakerUseFromJwt);

    expect(service.findByUser).toHaveBeenCalledWith(fakerUseFromJwt.id);
  });

  it('should throws if AccountsService.findByUser throws', async () => {
    const exception = new Error('any-error');

    service.findByUser.mockRejectedValueOnce(exception);

    expect(controller.findOne(fakerUseFromJwt)).rejects.toEqual(exception);
  });

  it('should throws if AccountsService.findByUser return null', async () => {
    service.findByUser.mockResolvedValueOnce(null);

    expect(controller.findOne(fakerUseFromJwt)).rejects.toEqual(
      new NotFoundException(`Account not found for this user`),
    );
  });

  it('should call AccountsService.movimentation with correct values', async () => {
    service.movimentation.mockResolvedValueOnce();

    const deposit: DepositDto = {
      value: faker.datatype.float(),
    };

    await controller.deposit(fakerUseFromJwt, deposit);

    expect(service.movimentation).toHaveBeenCalledWith(
      {
        ...deposit,
        userId: fakerUseFromJwt.id,
      },
      MovimentationType.DEPOSIT,
    );
  });

  it('should throws if AccountsService.movimentation throws', async () => {
    const exception = new Error('any-error');

    const deposit: DepositDto = {
      value: faker.datatype.float(),
    };

    service.movimentation.mockRejectedValueOnce(exception);

    expect(controller.deposit(fakerUseFromJwt, deposit)).rejects.toEqual(
      exception,
    );
  });

  it('should call AccountsService.movimentation with correct values', async () => {
    service.movimentation.mockResolvedValueOnce();

    const withdraw: WithdrawDto = {
      value: faker.datatype.float(),
    };

    await controller.withdraw(fakerUseFromJwt, withdraw);

    expect(service.movimentation).toHaveBeenCalledWith(
      {
        ...withdraw,
        userId: fakerUseFromJwt.id,
      },
      MovimentationType.WITHDRAW,
    );
  });

  it('should throws if AccountsService.movimentation throws', async () => {
    const exception = new Error('any-error');

    const withdraw: WithdrawDto = {
      value: faker.datatype.float(),
    };

    service.movimentation.mockRejectedValueOnce(exception);

    expect(controller.withdraw(fakerUseFromJwt, withdraw)).rejects.toEqual(
      exception,
    );
  });

  it('should call AccountsService.transfer with correct values', async () => {
    service.transfer.mockResolvedValueOnce();

    const transfer: TransferDto = {
      receiverEmail: faker.internet.email(),
      value: faker.datatype.float(),
    };

    await controller.transfer(fakerUseFromJwt, transfer);

    expect(service.transfer).toHaveBeenCalledWith({
      ...transfer,
      userId: fakerUseFromJwt.id,
      senderEmail: fakerUseFromJwt.email,
    });
  });

  it('should throws if AccountsService.transfer throws', async () => {
    const exception = new Error('any-error');

    const transfer: TransferDto = {
      receiverEmail: faker.internet.email(),
      value: faker.datatype.float(),
    };

    service.transfer.mockRejectedValueOnce(exception);

    expect(controller.transfer(fakerUseFromJwt, transfer)).rejects.toEqual(
      exception,
    );
  });
});
