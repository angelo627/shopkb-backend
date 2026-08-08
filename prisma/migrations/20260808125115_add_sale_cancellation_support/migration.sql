/*
  Warnings:

  - Added the required column `updatedAt` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "MovementReason" ADD VALUE 'SALE_CANCELLED';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "saleId" TEXT;

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
