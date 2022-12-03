import { PrismaClient } from '@prisma/client';
import { makeFakeUser } from '../faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function userSeed() {
  const fakeUser = makeFakeUser();

  const hashPassword = await bcrypt.hash(fakeUser.password, 10);

  const user = await prisma.user.create({
    data: { ...fakeUser, password: hashPassword },
  });

  return { ...user, plainPassword: fakeUser.password };
}
