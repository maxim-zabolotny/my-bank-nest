import { faker } from '@faker-js/faker';
import { AccountHistory } from 'src/accounts/entities/accountHistory.entity';

export const makeFakeAccountHistory = (): AccountHistory => ({
  id: faker.datatype.uuid(),
  balance: faker.datatype.float(),
  accountId: faker.datatype.uuid(),
  description: faker.datatype.string(),
  createdAt: faker.datatype.datetime(),
  value: faker.datatype.float(),
});
