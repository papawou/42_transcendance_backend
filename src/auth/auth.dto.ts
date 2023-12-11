import { IsNotEmpty } from 'class-validator';

export class LoginDTO {
  @IsNotEmpty()
  name!: string;
}

export class EnableTwoFactorDTO extends LoginDTO {
  @IsNotEmpty()
  userId!: number;

  @IsNotEmpty()
  secretKey!: string;
}

export class ValidateTwoFactorDTO extends LoginDTO {
  @IsNotEmpty()
  userId!: number;

  @IsNotEmpty()
  twoFactorCode!: string;
}

export class DisableTwoFactorDTO extends LoginDTO {
  @IsNotEmpty()
  userId!: number;
}