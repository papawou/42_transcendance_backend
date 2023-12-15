import { UserJWTPayload } from '@/shared/shared';
import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import prisma from 'src/database/prismaClient';
import { isDef } from 'src/technical/isDef';
import speakeasy from 'speakeasy';
import { EnableTwoFactorDTO, ValidateTwoFactorDTO, DisableTwoFactorDTO} from "./auth.dto";

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

    async login(user: Pick<User, "name"|"id">) {
        const payload: UserJWTPayload = { name: user.name, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async enableTwoFactor(enableTwoFactorDTO: EnableTwoFactorDTO) {
        const { userId, secretKey } = enableTwoFactorDTO;
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                secretKey: secretKey,
            },
        });
        return { message: '2FA enabled successfully' };
    }

    async validateTwoFactor(validateTwoFactorDTO: ValidateTwoFactorDTO) {
        const { userId, twoFactorCode } = validateTwoFactorDTO;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorEnabled || !user.secretKey) {
            throw new UnauthorizedException('2FA not enabled for this user');
        }
        const verified = speakeasy.totp.verify({
            secret: user.secretKey,
            encoding: 'base32',
            token: twoFactorCode,
        });
        if (!verified) {
            throw new UnauthorizedException('Invalid 2FA code');
        }
        return { message: '2FA validated successfully' };
    }

    async disableTwoFactor(disableTwoFactorDTO: DisableTwoFactorDTO) {
        const { userId } = disableTwoFactorDTO;
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                secretKey: null,
            },
        });
        return { message: '2FA disabled successfully' };
    }
}