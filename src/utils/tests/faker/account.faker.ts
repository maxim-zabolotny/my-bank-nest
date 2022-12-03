import { faker } from '@faker-js/faker';
import { Account } from 'src/accounts/entities/account.entity';

export const makeFakeAccount = (): Account => ({
  id: faker.datatype.uuid(),
  balance: faker.datatype.float({ min: 0 }),
  createdAt: faker.datatype.datetime(),
  updatedAt: faker.datatype.datetime(),
  userId: faker.datatype.uuid(),
});
