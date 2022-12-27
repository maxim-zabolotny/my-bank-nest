import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateUserDto } from './dto/create-user.dto';
import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: DeepMockProxy<UsersService>;
  let fakeUser: CreateUserDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    })
      .overrideProvider(UsersService)
      .useValue(mockDeep<UsersService>())
      .compile();

    service = module.get(UsersService);
    controller = module.get<UsersController>(UsersController);
    fakeUser = {
      name: faker.name.fullName(),
      email: faker.internet.email(),
      password: faker.random.alphaNumeric(),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call UsersService.create with correct values', async () => {
    service.create.mockResolvedValueOnce(fakeUser);
    await controller.create(fakeUser);

    expect(service.create).toHaveBeenCalledWith(fakeUser);
  });

  it('should throws if UsersService.create throws', async () => {
    const exception = new Error('any-error');

    service.create.mockRejectedValueOnce(exception);

    expect(controller.create(fakeUser)).rejects.toEqual(exception);
  });

  it('should call UsersService.findOne with correct values', async () => {
    const fakeResult = {
      ...fakeUser,
      id: faker.datatype.uuid(),
      createdAt: new Date(),
      updatedAt: null,
    };

    service.findOne.mockResolvedValueOnce(fakeResult);

    const response = await controller.profile({
      email: fakeUser.email,
      id: fakeResult.id,
      name: fakeUser.name,
    });

    expect(service.findOne).toHaveBeenCalledWith(fakeResult.id);
    expect(response).toEqual({ ...fakeResult, password: undefined });
  });

  it('should throws if UsersService.findOne throws', async () => {
    const exception = new Error('any-error');

    service.findOne.mockRejectedValueOnce(exception);

    expect(
      controller.profile({
        id: faker.datatype.uuid(),
        email: faker.internet.email(),
        name: faker.name.fullName(),
      }),
    ).rejects.toEqual(exception);
  });

  it('should throw if UsersService.findOne return null', async () => {
    service.findOne.mockResolvedValueOnce(null);

    expect(
      controller.profile({
        id: faker.datatype.uuid(),
        email: faker.internet.email(),
        name: faker.name.fullName(),
      }),
    ).rejects.toEqual(new NotFoundException(`User was not found`));
  });

  it('should call UsersService.update with correct values', async () => {
    const fakeResult = {
      ...fakeUser,
      id: faker.datatype.uuid(),
      createdAt: new Date(),
      updatedAt: null,
    };

    service.update.mockResolvedValueOnce(fakeResult);

    const response = await controller.update(fakeResult.id, {
      name: fakeResult.name,
      email: fakeResult.email,
    });

    expect(service.update).toHaveBeenCalledWith(fakeResult.id, {
      name: fakeResult.name,
      email: fakeResult.email,
    });

    expect(response).toEqual({ ...fakeResult, password: undefined });
  });

  it('should throws if UsersService.update throws', async () => {
    const exception = new NotFoundException('User not found');

    service.update.mockRejectedValueOnce(exception);

    expect(
      controller.update(faker.datatype.uuid(), {
        name: fakeUser.name,
        email: fakeUser.email,
      }),
    ).rejects.toEqual(exception);
  });
});
