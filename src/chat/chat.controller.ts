import { Controller, Get} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
   constructor(private readonly chatService: ChatService) {}

  @Get('roomNames')
  public async GetAllRoomNames() {
    const roomNames: string[] = this.chatService.getAllRoomNames();

    return { rooms: roomNames }
  }
}