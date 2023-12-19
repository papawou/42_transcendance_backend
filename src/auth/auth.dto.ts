import { IsNotEmpty, IsString } from "class-validator";

export class LoginDTO {
  @IsNotEmpty()
  name!: string;
}

export class FtCallbackDTO {
  @IsString()
  code!: string;
}
