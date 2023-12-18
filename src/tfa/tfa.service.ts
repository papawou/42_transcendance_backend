import { isDef } from '@/technical/isDef';
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import prisma from 'src/database/prismaClient';

@Injectable()
export class TfaService {

  async enable(userId: number) {
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

  async activate(userId: number, otp: string) {
    const user = await prisma.user.findUnique({ where: { id: userId, tfaValid: false } })
    if (!isDef(user) || !isDef(user.tfaSecret)) {
      return undefined;
    }

    if (!this.check(otp, user.tfaSecret)) {
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

  async disable(userId: number) {
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

  async verify(userId: number, otp: string) {
    const user = await prisma.user.findUnique({ where: { id: userId, tfaValid: true } })
    if (!isDef(user) || !isDef(user.tfaSecret)) {
      return undefined;
    }
    return this.check(otp, user.tfaSecret)
  }

  check(otp: string, tfaSecret: string) {
    console.log(otp, tfaSecret)
    return authenticator.verify({ token: otp, secret: tfaSecret })
  }
}