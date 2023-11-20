export type UserJWTPayload = {
    name: string,
    sub: number,
    isTwoFactAuth?: boolean
}