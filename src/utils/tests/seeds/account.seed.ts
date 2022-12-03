import { PrismaClient } from '@prisma/client';
import { makeFakeAccount } from '../faker';

const prisma = new PrismaClient();

export async function accountSeed(userId: string) {
  const fakeAccount = makeFakeAccount();

  const account = await prisma.account.create({
    data: { ...fakeAccount, userId },
  });

  return account;
}
