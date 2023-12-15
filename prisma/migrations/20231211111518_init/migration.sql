-- AlterTable
ALTER TABLE "User" ADD COLUMN     "secretKey" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
