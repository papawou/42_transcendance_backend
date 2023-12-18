import { IsNotEmpty, IsString } from "class-validator";

export class TfaDTO {
    @IsString()
    @IsNotEmpty()
    otp!: string;
}