/*
  Warnings:

  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `player1Id` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player1Name` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player1Score` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player2Id` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player2Name` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player2Score` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `loses` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `wins` on the `User` table. All the data in the column will be lost.
  - Added the required column `idUserA` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUserB` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerAscore` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerBscore` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('RANKED', 'CASUAL');

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_player1Id_fkey";

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
DROP COLUMN "player1Id",
DROP COLUMN "player1Name",
DROP COLUMN "player1Score",
DROP COLUMN "player2Id",
DROP COLUMN "player2Name",
DROP COLUMN "player2Score",
ADD COLUMN     "idUserA" INTEGER NOT NULL,
ADD COLUMN     "idUserB" INTEGER NOT NULL,
ADD COLUMN     "playerAscore" INTEGER NOT NULL,
ADD COLUMN     "playerBscore" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "GameType" NOT NULL,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Game_id_seq";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "loses",
DROP COLUMN "rank",
DROP COLUMN "wins";

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_idUserA_fkey" FOREIGN KEY ("idUserA") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_idUserB_fkey" FOREIGN KEY ("idUserB") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
