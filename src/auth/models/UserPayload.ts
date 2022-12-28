export interface UserPayload {
  sub: string;
  email: string;
  name: string;
  phone: string;
  isPhoneNumberConfirmed: boolean;
  iat?: number;
  exp?: number;
}
