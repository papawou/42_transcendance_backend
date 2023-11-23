export type UserJWTPayload = {
    name: string,
    sub: number,
    isTwoFactorAuth?: boolean
}