export type UserJWTPayload = {
    name: string,
    sub: number
}

export type UserGame = {
    gameId?: string,
    search: boolean
}