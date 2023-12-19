import { UserJWTPayload } from '@/shared/shared';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { isDef } from '@/technical/isDef';
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import prisma from 'src/database/prismaClient';
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async validateUser(name: string): Promise<User | null> {
        const user = await prisma.user.findFirst({
            where: { name }
        });

        if (!isDef(user)) {
            return null;
        }
        return user;
    }

    login(user: User) {
        const payload: UserJWTPayload = { name: user.name, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    //2fa
    async tfaEnable(userId: number) {
        const otpSecret = authenticator.generateSecret();

        try {
            const user = await prisma.user.update({
                where: { id: userId, tfaValid: false },
                data: { tfaSecret: otpSecret, tfaValid: false },
            });

            const otpAuthURI = authenticator.keyuri(user.name, 'transcendance', otpSecret);
            const otpAuthQR = await qrcode.toDataURL(otpAuthURI);
            return otpAuthQR
        }
        catch {
            return undefined
        }
    }

    async tfaActivate(userId: number, otp: string) {
        const user = await prisma.user.findUnique({ where: { id: userId, tfaValid: false } })
        if (!isDef(user) || !isDef(user.tfaSecret)) {
            return undefined;
        }

        if (!this.tfaCheck(otp, user.tfaSecret)) {
            return undefined;
        }
        try {
            await prisma.user.update({
                where: { id: user.id, tfaValid: false, tfaSecret: user.tfaSecret },
                data: { tfaValid: true }
            })
            return true;
        }
        catch {
            return undefined;
        }
    }

    async tfaDisable(userId: number) {
        try {
            await prisma.user.update({
                where: { id: userId, tfaValid: true },
                data: { tfaSecret: null, tfaValid: false },
            });
            return true;
        }
        catch {
            return undefined;
        }
    }

    async hasTfa(userId: number) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!isDef(user)) {
            return undefined
        }

        return user.tfaValid;
    }

    async tfaVerify(userId: number, otp: string) {
        const user = await prisma.user.findUnique({ where: { id: userId, tfaValid: true } })
        if (!isDef(user) || !isDef(user.tfaSecret)) {
            return undefined;
        }
        if (!this.tfaCheck(otp, user.tfaSecret)) {
            return undefined
        }
        return user;
    }

    tfaCheck(otp: string, tfaSecret: string) {
        return authenticator.verify({ token: otp, secret: tfaSecret })
    }
}
