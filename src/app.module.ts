import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './database/prisma.module';
import { PrismaService } from './database/prisma.service';
import { TwoFactorService } from './user/two-factor.service';
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";

ConfigModule.forRoot(); // retreive .env variables

@Module({
  imports: [
    UserModule, 
    PrismaModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService, TwoFactorService],
})

export class AppModule {}
