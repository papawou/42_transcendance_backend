import { IsNotEmpty } from "class-validator";

export class LoginDTO {
    @IsNotEmpty()
    name!: string;
}

export class TwoFactorAuthDTO {
    @IsNotEmpty()
    twoFactorCode!: string;
    code!: string;
    name!: string;
  }