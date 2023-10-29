-- CreateTable
CREATE TABLE "_pending" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_pending_AB_unique" ON "_pending"("A", "B");

-- CreateIndex
CREATE INDEX "_pending_B_index" ON "_pending"("B");

-- AddForeignKey
ALTER TABLE "_pending" ADD CONSTRAINT "_pending_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_pending" ADD CONSTRAINT "_pending_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
