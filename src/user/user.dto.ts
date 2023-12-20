import { ApiProperty } from "@nestjs/swagger"
import { GameType } from "@prisma/client"
import { Type } from "class-transformer"
import { IsBoolean, IsDateString, IsDefined, IsEnum, IsNotEmptyObject, IsNumber, IsString, Length, ValidateNested } from "class-validator"

export class UserDTO {
    @IsNumber()
    id!: number
    @IsString()
    name!: string
    @IsString()
    pic!: string
    @IsNumber()
    elo!: number
}

export class UserWithStatusDTO extends UserDTO {
    @ApiProperty({ enum: ['SEARCH', 'INGAME', 'OFFLINE', "ONLINE", undefined] })
    status!: "SEARCH" | "INGAME" | "OFFLINE" | "ONLINE" | undefined
}

export class UserExpandedDTO extends UserDTO {
    @ValidateNested({ each: true })
    @Type(() => UserDTO)
    friends!: UserWithStatusDTO[]

    @ValidateNested({ each: true })
    @Type(() => UserDTO)
    blocked!: UserDTO[]

    @ValidateNested({ each: true })
    @Type(() => UserDTO)
    pending!: UserDTO[]

    @ValidateNested({ each: true })
    @Type(() => UserDTO)
    pendingOf!: UserDTO[]

    @IsBoolean()
    tfaValid!: boolean
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

    @IsNumber()
    elo!: number

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
    @IsNumber()
    elo!: number
}


export class CancelFriendRequestDTO {
    @IsNumber()
    userId!: number
}

export class ChangeUsernameDTO {
    @IsString()
    @Length(1, 20)
    username!: string
}

export class FriendDTO {
    @IsNumber()
    friendId!: number
}