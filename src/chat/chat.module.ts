import { Module } from '@nestjs/common';
//import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [UserModule, AuthModule],
  controllers: [],
  providers: [ChatGateway,ChatService],
})
export class ChatModule {}