import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ChatService, RoomDto, RoomReturnDto, PrivateMsgsDto } from './chat.service';
import { AuthRequest, JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('userRooms')
  @UseGuards(JwtAuthGuard)
  public async getRoomsFromUser(
    @Req() req: AuthRequest,
  ) {
    const user: any = req.user;

    const rooms: RoomDto[] = this.chatService.getAllRoomsFromUser(user.id);

    const roomReturns = new Array<RoomReturnDto>;
    rooms.forEach((room) => roomReturns.push(this.chatService.getReturnRoom(room)));

    return { rooms: roomReturns };

  }

  @Get('userPMs')
  @UseGuards(JwtAuthGuard)
  public async getPMsFromUser(
    @Req() req: AuthRequest,
  ) {
    const user: any = req.user;

    const privateMsgs: PrivateMsgsDto[] | undefined = this.chatService.getUserPrivateMsgs(user.id);

    return { privateMsgs: privateMsgs || [] };
  }

  @Get('roomNames')
  public async GetAllPublicRooms() {
    const roomNames: string[] = this.chatService.getAllPublicRooms();

    return { rooms: roomNames }
  }
}