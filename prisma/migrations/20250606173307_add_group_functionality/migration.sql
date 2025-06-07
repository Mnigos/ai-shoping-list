/*
  Warnings:

  - You are about to drop the column `userId` on the `shopping_list_item` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[groupId,name]` on the table `shopping_list_item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[personalGroupId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `shopping_list_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `shopping_list_item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "shopping_list_item" DROP CONSTRAINT "shopping_list_item_userId_fkey";

-- DropIndex
DROP INDEX "shopping_list_item_userId_idx";

-- DropIndex
DROP INDEX "shopping_list_item_userId_name_key";

-- AlterTable
ALTER TABLE "shopping_list_item" DROP COLUMN "userId",
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "personalGroupId" TEXT;

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_inviteCode_key" ON "group"("inviteCode");

-- CreateIndex
CREATE INDEX "group_inviteCode_idx" ON "group"("inviteCode");

-- CreateIndex
CREATE INDEX "group_member_groupId_idx" ON "group_member"("groupId");

-- CreateIndex
CREATE INDEX "group_member_userId_idx" ON "group_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_userId_groupId_key" ON "group_member"("userId", "groupId");

-- CreateIndex
CREATE INDEX "shopping_list_item_groupId_idx" ON "shopping_list_item"("groupId");

-- CreateIndex
CREATE INDEX "shopping_list_item_createdById_idx" ON "shopping_list_item"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_list_item_groupId_name_key" ON "shopping_list_item"("groupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_personalGroupId_key" ON "user"("personalGroupId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_personalGroupId_fkey" FOREIGN KEY ("personalGroupId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_item" ADD CONSTRAINT "shopping_list_item_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_item" ADD CONSTRAINT "shopping_list_item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
