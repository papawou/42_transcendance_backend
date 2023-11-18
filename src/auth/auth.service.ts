import { UserJWTPayload } from '@/shared/shared';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import prisma from 'src/database/prismaClient';
import { isDef } from 'src/technical/isDef';
import * as otplib from 'otplib';
import speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private readonly httpService: HttpService) { }

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


    async enableTwoFactorAuth(user: User) {
        const secret = speakeasy.generateSecret({
          length: 20,
          name: 'YourApp', // Replace with your app name
        });
    
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorSecret: secret.base32 },
        });
    
        return secret;
      }

      async disableTwoFactorAuth(user: User) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorSecret: null },
        });
    
        return '2FA has been disabled';
      }
    
      async validateTwoFactorCode(user: User, twoFactorCode: string) {
        const isValid = speakeasy.totp.verify({
          secret: user.twoFactorSecret!,
          encoding: 'base32',
          token: twoFactorCode,
          window: 1,
        });
        return isValid;
      }
    }