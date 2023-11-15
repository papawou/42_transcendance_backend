import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthRequest, JwtAuthGuard } from './auth/jwt-auth.guard';
import { isDef } from './technical/isDef';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: AuthRequest) {
    return req.user;
  }
}