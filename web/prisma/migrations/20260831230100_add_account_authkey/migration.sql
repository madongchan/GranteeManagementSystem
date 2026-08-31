-- AlterTable
ALTER TABLE "Account" ADD COLUMN "authKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_authKey_key" ON "Account"("authKey");
