import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from './user.module';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateTwoFactorSecret(userId: number, secret: string): Promise<User> {
    // Find the user by their ID
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update the user's two-factor secret
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
  }

  async isTwoFactorEnabled(userId: number): Promise<boolean> {
    // Find the user by their ID
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return !!existingUser.twoFactorSecret;
  }
}

