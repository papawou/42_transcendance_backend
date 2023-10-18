import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
    async getUsers(){
    const users = await prisma.user.findMany();
    return users;
  }
}