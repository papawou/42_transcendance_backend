import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class TfaDTO {
  @IsNumber()
  @IsNotEmpty()
  userId!: number

  @IsString()
  @IsNotEmpty()
  otp!: string
}

export class FtCallbackDTO {
  @IsString()
  code!: string;
}

export class AccessTokenDTO {
  @IsString()
  access_token!: string
}


export class TfaRedirectDTO {
  @IsNumber()
  userId!: number
}
