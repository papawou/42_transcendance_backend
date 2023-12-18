import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { WsJwtStrategy } from './ws-jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { TfaService } from '../tfa/tfa.service';
import { UserModule } from '@/user/user.module';

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
        }),
        forwardRef(() => UserModule)
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, WsJwtStrategy, TfaService],
    exports: [JwtModule]
})
export class AuthModule { }
