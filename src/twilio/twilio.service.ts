import { BadRequestException, Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import * as process from 'process';
import { UsersService } from '../users/users.service';

@Injectable()
export class TwilioService {
  private twilioClient: Twilio;
  constructor(private readonly userService: UsersService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async initiatePhoneNumberVerification(phoneNumber: string) {
    const serviceSid = process.env.TWILIO_VERIFICATION_SERVICE_SID;

    return this.twilioClient.verify
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });
  }

  async confirmPhoneNumber(
    userId: string,
    phoneNumber: string,
    verificationCode: string,
  ) {
    const serviceSid = process.env.TWILIO_VERIFICATION_SERVICE_SID;

    const result = await this.twilioClient.verify
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code: verificationCode });

    if (!result.valid || result.status !== 'approved') {
      throw new BadRequestException('Wrong code provided');
    }

    await this.userService.markPhoneNumberAsConfirmed(userId);
  }
}
