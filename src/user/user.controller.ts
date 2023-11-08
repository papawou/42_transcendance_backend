import { Controller, Get, Delete, Post, Param, UseGuards, Req, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { TwoFactorService } from './two-factor.service';
import { authenticator } from 'otplib';
import { AuthGuard } from '@nestjs/passport'; // Import the necessary auth guard for protecting routes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
    async getUsers(){
    const users = (await prisma.user.findMany());
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

  @Get(':id/friends')
    async getFriends(@Param('id') userId: string) {
    const uid = Number(userId)
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { friends: true }
    });

    if (!user) {
      throw new Error(`Utilisateur avec l'ID ${userId} non trouvé.`);
    }
    return user.friends;
  }

  @Post(':id/add-friend/:friendId')
    async addFriend(
    @Param('id') userId: string,
    @Param('friendId') friendId: string,
  ) {
    const id1 = Number(userId);
    const id2 = Number(friendId);

    const updatedUser = await this.userService.addFriend(id1, id2);

    return updatedUser;
  }

  @Post(':id/delete-friend/:friendId')
    async deleteFriend(
      @Param('id') userId: string,
      @Param('friendId') friendId: string,
    ) {
      const id1 = Number(userId);
      const id2 = Number(friendId)

      const updatedUser = await this.userService.deleteFriend(id1, id2);

      return updatedUser;
    }
  }
}
