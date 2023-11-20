import { UserJWTPayload } from '@/shared/shared';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import prisma from 'src/database/prismaClient';
import { isDef } from 'src/technical/isDef';
import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';
import { UserService } from 'src/user/user.service';
import { Writable } from 'stream';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private readonly httpService: HttpService,
        private userService: UserService)
        { }

    async validateUser(name: string): Promise<User | null> {
        const user = await prisma.user.findFirst({
            where: { name }
        });

        if (!isDef(user)) {
            return null;
        }
        return user;
    }

    async login(user: User) {
        const payload: UserJWTPayload = { name: user.name, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async generateToken(payload: any, options: any = {}) {
        return this.jwtService.sign(payload, options);
      }
    
      //  Generate a secret and an url
      async generateTwoFactAuthSecret(user: any): Promise<any> {
        const secret = authenticator.generateSecret();
        await this.userService.updateSecret(user.id, secret);
    
        const otpauthUrl = authenticator.keyuri(user.id.toString(), 'ft_transcendence', secret);
    
        return otpauthUrl;
      }
    
      //  Url to qr code
      async pipeQrCodeStream(stream: Writable, otpauthUrl: string) {
        return toFileStream(stream, otpauthUrl);
      }
    
      //  Verify qr code scan
      async verifyTwoFactAuth(code: string, user: any) {
        const secret = await this.userService.getSecret(user.id);
        if (secret) {
          return authenticator.verify({ token: code, secret });
        }
        return false;
      }
    
      async turnOnTfa(user: any) {
        await this.userService.turnOnTfa(user.id);
      }
}