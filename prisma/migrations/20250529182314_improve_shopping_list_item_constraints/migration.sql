/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `shopping_list_item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "shopping_list_item" ALTER COLUMN "amount" SET DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "shopping_list_item_userId_name_key" ON "shopping_list_item"("userId", "name");
