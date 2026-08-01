/*
  Warnings:

  - You are about to drop the column `details` on the `ActivityLog` table. All the data in the column will be lost.
  - Changed the type of `action` on the `ActivityLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('LOGIN', 'LOGOUT', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'PRODUCT_RESTORED', 'STOCK_RECEIVED', 'STOCK_ADJUSTED', 'STOCK_REMOVED', 'SALE_CREATED', 'SALE_CANCELLED', 'BUSINESS_DAY_OPENED', 'BUSINESS_DAY_CLOSED', 'USER_CREATED', 'USER_UPDATED', 'USER_DISABLED');

-- CreateEnum
CREATE TYPE "ActivityEntity" AS ENUM ('PRODUCT', 'SALE', 'USER', 'BUSINESS_DAY');

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_businessDayId_fkey";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "details",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" "ActivityEntity",
ALTER COLUMN "businessDayId" DROP NOT NULL,
DROP COLUMN "action",
ADD COLUMN     "action" "ActivityAction" NOT NULL;

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_businessDayId_fkey" FOREIGN KEY ("businessDayId") REFERENCES "BusinessDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
