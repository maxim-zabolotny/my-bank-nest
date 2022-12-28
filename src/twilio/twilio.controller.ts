import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/models/UserFromJwt';
import { ApiSecurity } from '@nestjs/swagger';
import { CheckVerificationCodeDtoDto } from './dtos/CheckVerificationCodeDto.dto';

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @ApiSecurity('bearer')
  @Post('initiate-verification')
  // @UseGuards(JwtAuthGuard)
  async initiatePhoneNumberVerification(
    @CurrentUser() currentUser: UserFromJwt,
  ) {
    if (currentUser.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number already confirmed');
    }
    await this.twilioService.initiatePhoneNumberVerification('+380994122325');
  }

  @ApiSecurity('bearer')
  @Post('check-verification-code')
  async checkVerificationCode(
    @CurrentUser() currentUser: UserFromJwt,
    @Body() verificationData: CheckVerificationCodeDtoDto,
  ) {
    if (currentUser.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number already confirmed');
    }
    await this.twilioService.confirmPhoneNumber(
      currentUser.id,
      currentUser.phone,
      verificationData.code,
    );
  }
}
