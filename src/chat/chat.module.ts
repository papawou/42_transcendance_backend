import { Module } from '@nestjs/common';
//import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [],
  providers: [ChatGateway,ChatService],
})
export class ChatModule {}