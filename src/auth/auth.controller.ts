import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthRequest } from './models/AuthRequest';
import { IsPublic } from './decorators/is-public.decorator';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginRequestBody } from './models/LoginRequestBody';

@Controller()
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginRequestBody })
  @ApiOperation({
    summary: 'Signin',
    description: 'Get the user token to use all other routes',
  })
  @ApiUnauthorizedResponse({
    description: 'Email address or password provided is incorrect',
  })
  @ApiOkResponse({ description: 'Success' })
  async login(@Request() req: AuthRequest) {
    return this.authService.login(req.user);
  }
}
