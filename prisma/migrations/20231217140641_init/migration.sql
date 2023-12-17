/*
  Warnings:

  - You are about to drop the column `secretKey` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorEnabled` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "secretKey",
DROP COLUMN "twoFactorEnabled";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "secretKey" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
