"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const prismaClient_1 = require("./prismaClient");
async function bootstrap() {
    const data = await prismaClient_1.default.post.findMany();
    console.log(data);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    await app.listen(3000);
}
;
bootstrap();
//# sourceMappingURL=main.js.map