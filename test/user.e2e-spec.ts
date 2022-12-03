import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { makeFakeUser } from 'src/utils/tests/faker';
import { PrismaService } from 'src/prisma/prisma.service';
import { userSeed } from 'src/utils/tests/seeds/user.seed';
import { getToken } from './utils/auth';
import { AppModule } from 'src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('should create an user', () => {
    const { name, email, password } = makeFakeUser();

    return request(app.getHttpServer())
      .post('/users')
      .send({ name, email, password })
      .expect(201)
      .expect({ name, email });
  });

  it('should return 400 with any wrong property', async () => {
    const { name, email, password } = makeFakeUser();

    await request(app.getHttpServer())
      .post('/users')
      .send({ name })
      .expect(400);

    await request(app.getHttpServer())
      .post('/users')
      .send({ email })
      .expect(400);

    await request(app.getHttpServer())
      .post('/users')
      .send({ password })
      .expect(400);
  });

  it('/users/profile (GET)', async () => {
    const req = request(app.getHttpServer());

    const createdUser = await userSeed();
    const token = await getToken(req, {
      email: createdUser.email,
      password: createdUser.plainPassword,
    });

    const response = await req
      .get('/users/profile')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      }),
    );
  });

  it('/users (PATCH)', async () => {
    const req = request(app.getHttpServer());

    const createdUser = await userSeed();
    const token = await getToken(req, {
      email: createdUser.email,
      password: createdUser.plainPassword,
    });

    const { email: newEmail, name: newName } = makeFakeUser();

    const response = await req
      .patch(`/users/${createdUser.id}`)
      .send({
        name: newName,
        email: newEmail,
      })
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: newName,
        email: newEmail,
      }),
    );
  });
});
