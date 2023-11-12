import { IsNotEmpty } from "class-validator";

export class LoginDTO {
    @IsNotEmpty()
    name!: string;
}