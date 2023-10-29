import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { authenticator } from 'otplib';

@Injectable()
export class TwoFactorService {
  constructor(private userService: UserService) {}

  async enableTwoFactor(userId: number) {
    const secret = authenticator.generateSecret();
    await this.userService.updateTwoFactorSecret(userId, secret);
    return secret;
  }

  async disableTwoFactor(userId: number) {
    await this.userService.updateTwoFactorSecret(userId, null);
  }

  async verifyTwoFactor(userId: number, token: string) {
    const user = await this.userService.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return false;
    }
    return authenticator.verify({ secret: user.twoFactorSecret, token });
  }
}
