import { faker } from '@faker-js/faker';
import { User } from 'src/users/entities/user.entity';

export const makeFakeUser = (): User => ({
  id: faker.datatype.uuid(),
  createdAt: new Date(),
  updatedAt: new Date(),
  name: faker.name.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(10),
});
