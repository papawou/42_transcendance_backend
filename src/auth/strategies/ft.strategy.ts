/*import { PassportStrategy } from "@nestjs/passport";

import { Strategy } from "passport-42";

import { Injectable } from "@nestjs/common";
import { validateHeaderName } from "http";
import { profile } from "console";
import { doesNotMatch } from "assert";

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, 'ft') {
    constructor() {
        super({
            clientID: process.env.FT_CLIENT_ID, // KR: to put in env
            clientSecret: process.env.FT_CLIENT_SECRET, // KR: to put in env
            callbackURL: process.env.AUTH_CALLBACK, // KR: to put in env
            scope: []
        });
    }
    async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
        const { username, image }: { username: string, image: { link?: string} } = profile
        const user = {
            username: username,
            image: image.link,
            accessToken,
        }
        return (user);
    }

}
*/