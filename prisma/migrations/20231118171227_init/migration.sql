/*
  Warnings:

  - You are about to drop the column `Loses` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Rank` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Wins` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "Loses",
DROP COLUMN "Rank",
DROP COLUMN "Wins",
ADD COLUMN     "loses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;
