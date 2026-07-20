/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `costPrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'INACTIVE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "minimumStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sku" TEXT NOT NULL,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
