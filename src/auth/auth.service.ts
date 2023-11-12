import { UserJWTPayload } from '@/shared/shared';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import prisma from 'src/database/prismaClient';
import { isDef } from 'src/technical/isDef';

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

    async login(user: User) {
        const payload: UserJWTPayload = { name: user.name, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
