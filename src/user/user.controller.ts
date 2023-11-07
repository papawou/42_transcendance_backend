import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
