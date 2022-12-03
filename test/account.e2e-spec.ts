import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getToken } from './utils/auth';
import { AppModule } from 'src/app.module';
import { accountSeed, userSeed } from '../src/utils/tests/seeds';

describe('AccountController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  it('should create an account', async () => {
    const req = request(app.getHttpServer());

    const createdUser = await userSeed();

    const token = await getToken(req, {
      email: createdUser.email,
      password: createdUser.plainPassword,
    });

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', 'Bearer ' + token)
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        balance: 0,
        userId: createdUser.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should make a deposit', async () => {
    const req = request(app.getHttpServer());

    const createdUser = await userSeed();

    await accountSeed(createdUser.id);

    const token = await getToken(req, {
      email: createdUser.email,
      password: createdUser.plainPassword,
    });

    const depositValue = 100;

    await request(app.getHttpServer())
      .post('/accounts/deposit')
      .set('Authorization', 'Bearer ' + token)
      .send({ value: depositValue })
      .expect(204);

    const response = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        accountHistory: [
          expect.objectContaining({
            accountId: expect.any(String),
            balance: expect.any(Number),
            createdAt: expect.any(String),
            description: 'Successful deposit',
            id: expect.any(String),
            value: depositValue,
          }),
        ],
        balance: expect.any(Number),
        createdAt: expect.any(String),
        id: expect.any(String),
        updatedAt: expect.any(String),
        userId: createdUser.id,
      }),
    );
  });

  it('should make a withdraw', async () => {
    const req = request(app.getHttpServer());

    const createdUser = await userSeed();

    const createdAccount = await accountSeed(createdUser.id);

    const token = await getToken(req, {
      email: createdUser.email,
      password: createdUser.plainPassword,
    });

    const withdrawValue = createdAccount.balance;

    await request(app.getHttpServer())
      .post('/accounts/withdraw')
      .set('Authorization', 'Bearer ' + token)
      .send({ value: withdrawValue })
      .expect(204);

    const response = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        accountHistory: [
          expect.objectContaining({
            accountId: expect.any(String),
            balance: 0,
            createdAt: expect.any(String),
            description: 'Successful withdraw',
            id: expect.any(String),
            value: -withdrawValue,
          }),
        ],
        balance: 0,
        createdAt: expect.any(String),
        id: expect.any(String),
        updatedAt: expect.any(String),
        userId: createdUser.id,
      }),
    );
  });

  it('should make a transfer', async () => {
    const req = request(app.getHttpServer());

    const createdUserOne = await userSeed();

    const createdAccountOne = await accountSeed(createdUserOne.id);

    const createdUserTwo = await userSeed();

    const createdAccountTwo = await accountSeed(createdUserTwo.id);

    const tokenOne = await getToken(req, {
      email: createdUserOne.email,
      password: createdUserOne.plainPassword,
    });

    const tokenTwo = await getToken(req, {
      email: createdUserTwo.email,
      password: createdUserTwo.plainPassword,
    });

    const transferValue = createdAccountOne.balance;

    await request(app.getHttpServer())
      .post('/accounts/transfer')
      .set('Authorization', 'Bearer ' + tokenOne)
      .send({ value: transferValue, receiverEmail: createdUserTwo.email })
      .expect(204);

    const responseOne = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', 'Bearer ' + tokenOne)
      .expect(200);

    const responseTwo = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', 'Bearer ' + tokenTwo)
      .expect(200);

    expect(responseOne.body).toEqual(
      expect.objectContaining({
        accountHistory: [
          expect.objectContaining({
            accountId: expect.any(String),
            balance: 0,
            createdAt: expect.any(String),
            description: `Transfer sent to account ${createdAccountTwo.id}`,
            id: expect.any(String),
            value: -transferValue,
          }),
        ],
        balance: 0,
        createdAt: expect.any(String),
        id: expect.any(String),
        updatedAt: expect.any(String),
        userId: createdUserOne.id,
      }),
    );

    expect(responseTwo.body).toEqual(
      expect.objectContaining({
        accountHistory: [
          expect.objectContaining({
            accountId: expect.any(String),
            balance: expect.any(Number),
            createdAt: expect.any(String),
            description: `Transfer received from account ${createdAccountOne.id}`,
            id: expect.any(String),
            value: transferValue,
          }),
        ],
        balance: expect.any(Number),
        createdAt: expect.any(String),
        id: expect.any(String),
        updatedAt: expect.any(String),
        userId: createdUserTwo.id,
      }),
    );
  });
});
