import { IsNumber, IsString } from "class-validator"

export class UserDTO {
    @IsNumber()
    id!: number
    @IsString()
    name!: string
    @IsString()
    ft_id!: string
    @IsString()
    pic!: string
}
