import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const alreadyExists = await this.findByEmail(createUserDto.email);

    if (alreadyExists)
      throw new UnprocessableEntityException(`User already exists`);

    const hashPassword = await bcrypt.hash(createUserDto.password, 10);

    await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashPassword,
      },
    });

    return { ...createUserDto, password: undefined };
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (!user) throw new NotFoundException('User was not found');

    return this.prisma.user.update({
      data: {
        name: updateUserDto.name,
        email: updateUserDto.email,
      },
      where: { id },
    });
  }
}
