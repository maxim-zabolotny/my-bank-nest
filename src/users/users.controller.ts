import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserFromJwt } from 'src/auth/models/UserFromJwt';
import { User } from './entities/user.entity';
@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @IsPublic()
  @Post()
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: User,
  })
  @ApiUnprocessableEntityResponse({ description: 'User already exists' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOperation({
    summary: 'Create an user',
    description: 'Pass the user data to create a new user',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiSecurity('bearer')
  @Get('profile')
  @ApiResponse({
    status: 200,
    description: 'Profile details of the current user',
    type: User,
  })
  @ApiNotFoundResponse({ description: 'User not exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorired' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOperation({
    summary: 'Profile details of the current user',
    description:
      'Get the profile details of the current user without pass params, only the token',
  })
  async profile(@CurrentUser() currentUser: UserFromJwt) {
    const user = await this.usersService.findOne(currentUser.id);

    if (!user) throw new NotFoundException(`User was not found`);

    return { ...user, password: undefined };
  }

  @ApiSecurity('bearer')
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: User,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiNotFoundResponse({ description: 'User not exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorired' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOperation({
    summary: 'Update an user profile',
    description: 'Update the user data',
  })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);

    return { ...user, password: undefined };
  }
}
