import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { TwoFactorService } from './two-factor.service';
import { authenticator } from 'otplib';
import { AuthGuard } from '@nestjs/passport'; // Import the necessary auth guard for protecting routes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
    async getUsers(){
    const users = await prisma.user.findMany();
    return users;
  }

  @Post('twofactor/enable')
  @UseGuards(AuthGuard('jwt')) // Use an appropriate authentication guard
  async enableTwoFactor(@Req() req, @Body('token') token: string) {
    const userId = req.user.id; // Extract user ID from the JWT payload
    const secret = await this.twoFactorService.enableTwoFactor(userId);
    // Generate QR code for the user to scan with an authenticator app
    const otpAuthUrl = authenticator.keyuri(req.user.email, '42_transcendence', secret);
    const qrCodeImageUrl = await this.twoFactorService.generateQRCode(otpAuthUrl);
    return { otpAuthUrl, qrCodeImageUrl };
  }

  @Post('twofactor/disable')
  @UseGuards(AuthGuard('jwt'))
  async disableTwoFactor(@Req() req) {
    const userId = req.user.id;
    await this.twoFactorService.disableTwoFactor(userId);
  }

  @Post('twofactor/verify')
  @UseGuards(AuthGuard('jwt'))
  async verifyTwoFactor(@Req() req, @Body('token') token: string) {
    const userId = req.user.id;
    const isValid = await this.twoFactorService.verifyTwoFactor(userId, token);
    if (isValid) {
      return { message: 'Verification successful' };
    } else {
      return { message: 'Invalid code' };
    }
  }
}