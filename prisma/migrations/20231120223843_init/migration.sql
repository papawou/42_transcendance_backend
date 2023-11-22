/*
  Warnings:

  - Added the required column `player1Name` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2Name` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "player1Name" TEXT NOT NULL,
ADD COLUMN     "player2Name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorAuth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;
