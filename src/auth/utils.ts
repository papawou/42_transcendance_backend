import { UserJWTPayload } from "@/shared/shared";
import { UserJWT } from "./jwt.strategy";
import { isDef } from "@/technical/isDef";

export const jwtValidate = (payload: UserJWTPayload | undefined): UserJWT | null => {
    if (!isDef(payload)) {
        return null;
    }
    return { userId: payload.sub, name: payload.name };
}