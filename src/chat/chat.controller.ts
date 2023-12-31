import { Controller, Get, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ChatService, RoomDto, RoomReturnDto, PrivateMsgsDto } from './chat.service';
import { AuthRequest, JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { UserJWT } from '@/auth/jwt.strategy';
import { isDef } from '@/technical/isDef';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('userRooms')
  @UseGuards(JwtAuthGuard)
  public async getRoomsFromUser(
    @Req() req: AuthRequest,
  ) {
    const user: UserJWT = req.user;
    const rooms: RoomDto[] = this.chatService.getAllRoomsFromUser(user.userId);

    const roomReturns = rooms.map(room => this.chatService.getReturnRoom(room));
    return { rooms: roomReturns };
  }

  @Get('userPMs')
  @UseGuards(JwtAuthGuard)
  public async getPMsFromUser(
    @Req() req: AuthRequest,
  ) {
    const user: UserJWT = req.user;

    const privateMsgs: PrivateMsgsDto[] | undefined = this.chatService.getUserPrivateMsgs(user.userId);

    return { privateMsgs: privateMsgs || [] };
  }

  @Get('blockedUsers')
  @UseGuards(JwtAuthGuard)
  public async getBlockedUsers(
    @Req() req: AuthRequest,
  ) {
    const user = req.user;

    const blockedUsers = await this.chatService.getUserBlockedUsers(user.userId);

    if (!isDef(blockedUsers)) {
      throw new NotFoundException()
    }
    return blockedUsers;
  }

  @Get('roomNames')
  public async GetAllPublicRooms() {
    const roomNames: string[] = this.chatService.getAllPublicRooms();

    return { rooms: roomNames }
  }
}