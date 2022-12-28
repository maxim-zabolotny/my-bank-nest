import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './entities/user.entity';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { makeFakeUser } from '../utils/tests/faker';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let fakeUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, UsersService],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: () => jest.fn(),
          update: () => jest.fn(),
          create: () => jest.fn(),
        },
      })
      .compile();

    prisma = module.get(PrismaService);
    service = module.get<UsersService>(UsersService);
    fakeUser = makeFakeUser();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call findUnique with correct values', () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(fakeUser);

    expect(service.findOne(fakeUser.id)).resolves.toBe(fakeUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: fakeUser.id },
    });
  });

  it('should throws if findUnique throws', () => {
    const exception = new Error('any-error');
    jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(exception);

    expect(service.findOne(fakeUser.id)).rejects.toEqual(exception);
  });

  it('should call findUnique with correct values', () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(fakeUser);

    expect(service.findByEmail(fakeUser.email)).resolves.toBe(fakeUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: fakeUser.email },
    });
  });

  it('should throws if findUnique throws', () => {
    const exception = new Error('any-error');
    jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(exception);

    expect(service.findByEmail(fakeUser.email)).rejects.toEqual(exception);
  });

  it('should call update with correct values', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(fakeUser);
    jest.spyOn(prisma.user, 'update').mockResolvedValue(fakeUser);

    const response = await service.update(fakeUser.id, {
      name: 'update-name',
      email: 'update-email',
    });

    expect(response).toBe(fakeUser);
    expect(prisma.user.update).toHaveBeenCalledWith({
      data: { name: 'update-name', email: 'update-email' },
      where: { id: fakeUser.id },
    });
  });

  it('should throw if user not found', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.user, 'update').mockResolvedValue(fakeUser);

    const response = service.update(fakeUser.id, {
      name: 'update-name',
      email: 'update-email',
    });

    expect(response).rejects.toEqual(
      new NotFoundException('User was not found'),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should create an user with success', async () => {
    const res1 = jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    const res2 = jest.spyOn(prisma.user, 'create').mockResolvedValue(fakeUser);
    const res3 = jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValueOnce('hash-password' as unknown as never);

    const response = await service.create({
      email: fakeUser.email,
      name: fakeUser.name,
      password: fakeUser.password,
      phone: fakeUser.phone,
    });

    expect(response).toEqual({
      email: fakeUser.email,
      name: fakeUser.name,
      password: undefined,
      phone: fakeUser.phone,
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: fakeUser.email,
        name: fakeUser.name,
        password: 'hash-password',
        phone: fakeUser.phone,
      },
    });
  });

  it('should throw if user already exists', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(fakeUser);
    jest.spyOn(prisma.user, 'create').mockResolvedValue(fakeUser);

    const response = service.create({
      email: fakeUser.email,
      name: fakeUser.name,
      password: fakeUser.password,
      phone: fakeUser.phone,
    });

    expect(response).rejects.toEqual(
      new UnprocessableEntityException(`User already exists`),
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
