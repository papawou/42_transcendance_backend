-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "secretKey" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
