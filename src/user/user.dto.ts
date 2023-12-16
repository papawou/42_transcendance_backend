import { Game, GameType } from "@prisma/client"
import { Type } from "class-transformer"
import { IsDateString, IsDefined, IsEnum, IsInt, IsNotEmptyObject, IsNumber, IsString, ValidateNested } from "class-validator"

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

export class GameDTO {
    @IsString()
    id!: string
    @IsEnum(GameType)
    type!: GameType

    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => UserDTO)
    winner!: UserDTO

    @IsDefined()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => UserDTO)
    loser!: UserDTO

    @IsNumber()
    winnerScore!: number
    @IsNumber()
    loserScore!: number

    @IsDateString()
    createdAt!: string
}

export class UserHistoryDTO {
    @IsNumber()
    id!: number

    @IsNumber()
    rank!: number

    @ValidateNested({ each: true })
    @Type(() => GameDTO)
    wins!: GameDTO[]

    @ValidateNested({ each: true })
    @Type(() => GameDTO)
    loses!: GameDTO[]
}

export class LeaderboardUserDTO {
    @IsNumber()
    id!: number
    @IsString()
    name!: string
    @IsNumber()
    rank!: number
}
