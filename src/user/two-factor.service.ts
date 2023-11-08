import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { User } from '@prisma/client';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  async enableTwoFactor(userId: number): Promise<string> {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: {
          create: {
            secret,
            enabled: true,
          },
        },
      },
    });
    return secret;
  }

  async disableTwoFactor(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null },
    });
  }

  async verifyTwoFactor(userId: number, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });
  
    if (!user || !user.twoFactorSecret || !user.twoFactorSecret.secret) {
      return false;
    }
  
    return authenticator.verify({ token, secret: user.twoFactorSecret.secret });
  }

  async generateQRCodeUrlForUser(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: { select: { secret: true } } },
    }); 
  
    if (!user || !user.twoFactorSecret) {
      throw new Error(`User with ID ${userId} not found.`);
    }
  
    // Generate the OTP Auth URL
    const otpAuthUrl = authenticator.keyuri('unique_user_identifier', '42_transcendence', user.twoFactorSecret.secret);
  
    return otpAuthUrl;
  }  

  async generateQRCode(otpAuthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl, { errorCorrectionLevel: 'H' });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return 'default-qr-code-url';
    }
  }
}
