import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { WsJwtStrategy } from './ws-jwt.strategy';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
    imports: [
        PassportModule,
        HttpModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '30d' },
            }),
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, WsJwtStrategy],
    exports: [JwtModule]
})
export class AuthModule { }
