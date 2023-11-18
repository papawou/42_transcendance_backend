/*
  Warnings:

  - You are about to drop the column `idUserA` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `idUserB` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playerAscore` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playerBscore` on the `Game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_idUserA_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_idUserB_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "idUserA",
DROP COLUMN "idUserB",
DROP COLUMN "playerAscore",
DROP COLUMN "playerBscore";

-- CreateTable
CREATE TABLE "PlayerGame" (
    "gameId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "PlayerGame_pkey" PRIMARY KEY ("gameId","userId")
);

-- AddForeignKey
ALTER TABLE "PlayerGame" ADD CONSTRAINT "PlayerGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGame" ADD CONSTRAINT "PlayerGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
