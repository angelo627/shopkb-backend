-- DropIndex
DROP INDEX "Sale_status_idx";

-- CreateIndex
CREATE INDEX "Sale_createdAt_status_idx" ON "Sale"("createdAt", "status");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_movementType_reason_idx" ON "StockMovement"("createdAt", "movementType", "reason");
