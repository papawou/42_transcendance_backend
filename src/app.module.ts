import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './database/prisma.module';
import { PrismaService } from './database/prisma.service';
import { TwoFactorService } from './user/two-factor.service';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, TwoFactorService],
})

export class AppModule {}
