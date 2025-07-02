/*
  Warnings:

  - A unique constraint covering the columns `[providerID]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_providerID_key" ON "User"("providerID");
