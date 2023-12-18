import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { TfaController } from './tfa.controller';
import { TfaService } from './tfa.service';

@Module({
  imports: [AuthModule],
  controllers: [TfaController],
  providers: [TfaService],
})
export class TfaModule { }