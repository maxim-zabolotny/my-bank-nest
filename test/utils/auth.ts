import { SuperTest, Test } from 'supertest';

interface CredentialsDto {
  email: string;
  password: string;
}

export async function getToken(
  req: SuperTest<Test>,
  { email, password }: CredentialsDto,
): Promise<string> {
  const response = await req.post('/login').send({ email, password });

  return response.body.accessToken;
}
