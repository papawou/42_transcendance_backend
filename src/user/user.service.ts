import { Injectable } from '@nestjs/common';
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

@Injectable()
export class UserService {
    
    addFriend = async (id1: number, id2: number) => {
        if (id1 === id2) {
            throw new Error("");
        }

        const updatedUser = await prisma.user.update({
            where: { id: id1 },
            include: { friends: true },
            data: {
                friends: {
                connect: { id: id2 },
                },
            },
        });
        const updatedUser2 = await prisma.user.update({
            where: { id: id2 },
            include: { friends: true },
            data: {
                friends: {
                connect: { id: id1 },
                },
            },
        });
    }

    deleteFriend = async (id1: number, id2: number) => {
        const updatedUser = await prisma.user.update({
            where: { id: id1 },
            include: { friends: true },
            data: {
                friends: {
                disconnect: { id: id2 },
                },
            },
        });
        const updatedUser2 = await prisma.user.update({
            where: { id: id2 },
            include: { friends: true },
            data: {
                friends: {
                disconnect: { id: id1 },
                },
            },
        });
    }
}
