-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "promoCode" TEXT,
ADD COLUMN     "shippingSpeed" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "taxRate" DECIMAL(6,4) NOT NULL DEFAULT 0;


-- Orders placed before per-state tax were all charged the flat 8% estimate.
UPDATE "Order" SET "taxRate" = 0.08 WHERE "tax" > 0;
