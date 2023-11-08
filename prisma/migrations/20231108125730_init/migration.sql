/*
  Warnings:

  - You are about to drop the `TwoFactor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TwoFactor" DROP CONSTRAINT "TwoFactor_userId_fkey";

-- DropTable
DROP TABLE "TwoFactor";

-- CreateTable
CREATE TABLE "twoFactorSecret" (
    "id" SERIAL NOT NULL,
    "secret" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "twoFactorSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "twoFactorSecret_userId_key" ON "twoFactorSecret"("userId");

-- AddForeignKey
ALTER TABLE "twoFactorSecret" ADD CONSTRAINT "twoFactorSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
