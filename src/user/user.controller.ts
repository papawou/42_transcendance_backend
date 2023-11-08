import { Controller, Delete, Get, Req, Body, UseGuards, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client'
import { TwoFactorService } from './two-factor.service';
import { authenticator } from 'otplib';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

const prisma = new PrismaClient()

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly twoFactorService: TwoFactorService // Add the TwoFactorService
  ) {}

  @Post('twofactor/enable')
  @UseGuards(AuthGuard('jwt')) // Use an appropriate authentication guard
  async enableTwoFactor(@Req() req: Request, @Body('token') token: string) {
    const userId = req.user.id; // Extract user ID from the JWT payload
    const secret = await this.twoFactorService.enableTwoFactor(userId);
    // Generate QR code for the user to scan with an authenticator app
    const otpAuthUrl = authenticator.keyuri(req.user.email, '42_transcendence', secret);
    const qrCodeImageUrl = await this.twoFactorService.generateQRCode(otpAuthUrl);
    return { otpAuthUrl, qrCodeImageUrl };
  }

  @Post('twofactor/disable')
  @UseGuards(AuthGuard('jwt'))
  async disableTwoFactor(@Req() req: Request) {
    const userId = req.user.id;
    await this.twoFactorService.disableTwoFactor(userId);
  }

  @Get()
    async getUsers(){
    const users = (await prisma.user.findMany());
    return users;
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
    @Post('generate-qr-code')
    async generateQRCode(@Req() req) {
      const userId = req.user.id; // Get the user ID
      const otpAuthUrl = await this.twoFactorService.generateQRCodeUrlForUser(userId);
      return { otpAuthUrl };
    }
}