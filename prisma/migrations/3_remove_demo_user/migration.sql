-- The shared demo account is retired. Remove it (addresses and cart cascade) unless it
-- already has orders, which must keep their owner.
DELETE FROM "User" u WHERE u."isDemo" = true AND NOT EXISTS (SELECT 1 FROM "Order" o WHERE o."userId" = u."id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isDemo";

