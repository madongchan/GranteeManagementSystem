-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "rep" TEXT,
    "affiliation" TEXT,
    "sido" TEXT,
    "sigungu" TEXT,
    "ageBand" TEXT,
    "scaleBand" TEXT,
    "consents" JSONB NOT NULL,
    "createdAt" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targets" JSONB NOT NULL,
    "sectors" JSONB NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "capacity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "displayNo" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "applicant" JSONB NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "motive" TEXT NOT NULL,
    "requestedBudget" INTEGER,
    "docScore" INTEGER,
    "interviewScore" INTEGER,
    "reviewResult" TEXT NOT NULL DEFAULT '',
    "reviewOpinion" TEXT NOT NULL DEFAULT '',
    "mentoring" TEXT NOT NULL DEFAULT '',
    "execRate" INTEGER,
    "inspection" TEXT NOT NULL DEFAULT '',
    "issue" TEXT NOT NULL DEFAULT '',
    "reportStatus" TEXT NOT NULL DEFAULT 'none',
    "reportRejectReason" TEXT NOT NULL DEFAULT '',
    "reportSummary" TEXT NOT NULL DEFAULT '',
    "performance" TEXT NOT NULL DEFAULT '',
    "scores" JSONB NOT NULL,
    "classificationManual" TEXT,
    "followupSupport" TEXT NOT NULL DEFAULT '',
    "followupLinkage" TEXT NOT NULL DEFAULT '',
    "nextContact" TEXT NOT NULL DEFAULT '',
    "manager" TEXT NOT NULL DEFAULT '',
    "kpis" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "settlement" JSONB NOT NULL,
    "attachments" JSONB NOT NULL,
    "resultFiles" JSONB NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_displayNo_key" ON "Application"("displayNo");

-- CreateIndex
CREATE INDEX "Application_accountId_idx" ON "Application"("accountId");

-- CreateIndex
CREATE INDEX "Application_callId_idx" ON "Application"("callId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
