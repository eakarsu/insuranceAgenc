-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ADJUSTER', 'AGENT', 'CSR');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PERSONAL', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE', 'FORMER');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('FAMILY', 'BUSINESS', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID', 'APPLICATION', 'POLICY', 'ENDORSEMENT', 'CLAIM', 'CORRESPONDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'NON_RENEWED');

-- CreateEnum
CREATE TYPE "LineOfBusiness" AS ENUM ('PERSONAL_AUTO', 'HOMEOWNERS', 'RENTERS', 'UMBRELLA', 'LIFE', 'HEALTH', 'COMMERCIAL_AUTO', 'COMMERCIAL_PROPERTY', 'GENERAL_LIABILITY', 'WORKERS_COMP', 'PROFESSIONAL_LIABILITY', 'CYBER', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('DIRECT', 'AGENCY', 'PREMIUM_FINANCE');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'QUOTED', 'PROPOSED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'BOUND');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'IN_REVIEW', 'APPROVED', 'DENIED', 'SETTLED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'EARNED', 'PAID', 'REVERSED', 'CHARGEDBACK');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('NEW_BUSINESS', 'RENEWAL', 'ENDORSEMENT', 'OVERRIDE', 'BONUS', 'CONTINGENCY');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('EMAIL', 'SMS', 'MAIL', 'RENEWAL_REMINDER', 'CROSS_SELL', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CLIENT_CREATED', 'CLIENT_UPDATED', 'POLICY_CREATED', 'POLICY_RENEWED', 'POLICY_CANCELLED', 'QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'CLAIM_REPORTED', 'CLAIM_UPDATED', 'CLAIM_CLOSED', 'DOCUMENT_UPLOADED', 'EMAIL_SENT', 'CALL_LOGGED', 'NOTE_ADDED', 'TASK_COMPLETED', 'AI_ANALYSIS_RUN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adjusterLicenseNumber" TEXT,
    "adjusterLicenseStates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "adjusterLicenseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "type" "ClientType" NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECT',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "ssn" TEXT,
    "businessName" TEXT,
    "businessType" TEXT,
    "ein" TEXT,
    "yearsInBusiness" INTEGER,
    "numberOfEmployees" INTEGER,
    "annualRevenue" DECIMAL(65,30),
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "source" TEXT,
    "referredBy" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,
    "householdId" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "followUpDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "policyId" TEXT,
    "claimId" TEXT,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "description" TEXT,
    "aiAnalysis" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "commissionRates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lineOfBusiness" "LineOfBusiness" NOT NULL,
    "type" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "cancelDate" TIMESTAMP(3),
    "premium" DECIMAL(65,30) NOT NULL,
    "downPayment" DECIMAL(65,30),
    "installments" INTEGER,
    "billingMethod" "BillingMethod",
    "coverageSummary" JSONB,
    "deductibles" JSONB,
    "limits" JSONB,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewedFromId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "quoteId" TEXT,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endorsement" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "endorsementNumber" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "premiumChange" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "lineOfBusiness" "LineOfBusiness" NOT NULL,
    "type" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "riskInfo" JSONB,
    "premium" DECIMAL(65,30),
    "fees" DECIMAL(65,30),
    "taxes" DECIMAL(65,30),
    "totalPremium" DECIMAL(65,30),
    "carrierQuotes" JSONB,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "carrierId" TEXT,
    "agentId" TEXT NOT NULL,
    "isRenewal" BOOLEAN NOT NULL DEFAULT false,
    "renewalPolicyId" TEXT,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteFollowUp" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'REPORTED',
    "type" TEXT NOT NULL,
    "dateOfLoss" TIMESTAMP(3) NOT NULL,
    "dateReported" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "lossLocation" TEXT,
    "estimatedLoss" DECIMAL(65,30),
    "deductible" DECIMAL(65,30),
    "reserveAmount" DECIMAL(65,30),
    "paidAmount" DECIMAL(65,30),
    "adjusterName" TEXT,
    "adjusterPhone" TEXT,
    "adjusterEmail" TEXT,
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "aiClassification" TEXT,
    "aiRiskScore" DOUBLE PRECISION,
    "aiFlags" JSONB,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "intakeEventId" TEXT,
    "intakePayloadHash" TEXT,
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "jurisdiction" TEXT,
    "coverageSnapshot" JSONB,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "retainedUntil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP + interval '7 years',
    "assignedAdjusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "policyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimCommunication" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "contactName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "paidDate" TIMESTAMP(3),
    "checkNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeTransferId" TEXT,
    "paymentMethod" TEXT,
    "recipientName" TEXT,
    "recipientAccountId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimCaseEvent" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "ClaimStatus",
    "toStatus" "ClaimStatus",
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "externalEventId" TEXT,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "previousHash" TEXT NOT NULL,
    "eventHash" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimCaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimEvidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimReserveEntry" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "previousAmount" DECIMAL(65,30) NOT NULL,
    "newAmount" DECIMAL(65,30) NOT NULL,
    "deltaAmount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimReserveEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimAdjudication" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "approvedAmount" DECIMAL(65,30),
    "jurisdiction" TEXT NOT NULL,
    "coverageBasis" JSONB NOT NULL,
    "evidenceIds" JSONB NOT NULL,
    "rationale" TEXT NOT NULL,
    "adjusterId" TEXT NOT NULL,
    "adjusterLicenseNumber" TEXT NOT NULL,
    "attestation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimAdjudication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimAppeal" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimAppealDecision" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "approvedAmount" DECIMAL(65,30),
    "rationale" TEXT NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "reviewerLicenseNumber" TEXT NOT NULL,
    "attestation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimAppealDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimSubrogation" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "responsibleParty" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "expectedRecovery" DECIMAL(65,30) NOT NULL,
    "openedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimSubrogation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimRecoveryEntry" (
    "id" TEXT NOT NULL,
    "subrogationId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "externalTransactionId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimRecoveryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimFinancialEntry" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "externalTransactionId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimFinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimIntegrationEvent" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "responseRef" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimIntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "CommissionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "rate" DECIMAL(65,30),
    "basePremium" DECIMAL(65,30),
    "statementId" TEXT,
    "statementDate" TIMESTAMP(3),
    "earnedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "policyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSplit" (
    "id" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT,
    "content" TEXT,
    "template" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER,
    "openCount" INTEGER,
    "clickCount" INTEGER,
    "responseCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referringClientId" TEXT NOT NULL,
    "referredClientId" TEXT,
    "referredName" TEXT,
    "referredEmail" TEXT,
    "referredPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "rewardGiven" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "policyId" TEXT,
    "quoteId" TEXT,
    "claimId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidence" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalPrediction" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "retentionScore" DECIMAL(65,30) NOT NULL,
    "riskFactors" JSONB,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenewalPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossSellRecommendation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "recommendedProduct" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "reasoning" TEXT,
    "currentPolicies" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrossSellRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAuth" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "description" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "paymentLinkUrl" TEXT,
    "paymentLinkExpiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "policyId" TEXT,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureAudit" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnderwritingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lineOfBusiness" "LineOfBusiness" NOT NULL,
    "category" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "riskPoints" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnderwritingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnderwritingResult" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "decision" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnderwritingResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "state" TEXT,
    "lineOfBusiness" "LineOfBusiness",
    "requirement" TEXT NOT NULL,
    "frequency" TEXT,
    "dueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checkedAt" TIMESTAMP(3),
    "checkedBy" TEXT,
    "notes" TEXT,
    "evidence" TEXT,
    "nextDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateTable" (
    "id" TEXT NOT NULL,
    "lineOfBusiness" "LineOfBusiness" NOT NULL,
    "baseRate" DECIMAL(65,30) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateFactor" (
    "id" TEXT NOT NULL,
    "rateTableId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "flatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "gracePeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "complaintNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clientId" TEXT,
    "aiClassification" TEXT,
    "aiSentiment" TEXT,
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintNote" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimFraudAssessment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fraudRiskScore" INTEGER NOT NULL,
    "fraudRiskLevel" TEXT NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "modelUsed" TEXT,
    "triggeredEscalation" BOOLEAN NOT NULL DEFAULT false,
    "escalationId" TEXT,
    "assessedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimFraudAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "callSid" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "transcription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResult" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "userId" TEXT,
    "model" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "rawText" TEXT,
    "error" TEXT,
    "durationMs" INTEGER,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnderwritingNarrative" (
    "id" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "rationaleBullets" JSONB NOT NULL,
    "eoExposure" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnderwritingNarrative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LossRunIngestion" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileBytes" INTEGER NOT NULL,
    "extractedClaims" JSONB NOT NULL,
    "summary" TEXT,
    "patterns" JSONB,
    "premiumImpactPct" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "errorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LossRunIngestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalRiskScore" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "daysToRenewal" INTEGER NOT NULL,
    "retentionScore" DOUBLE PRECISION NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "strategies" JSONB NOT NULL,
    "outreachDrafted" BOOLEAN NOT NULL DEFAULT false,
    "outreachContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalRiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheckResult" (
    "id" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "complianceScore" DOUBLE PRECISION,
    "violations" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FNOLDraft" (
    "id" TEXT NOT NULL,
    "callSid" TEXT,
    "callerPhone" TEXT,
    "policyNumber" TEXT,
    "lossDate" TIMESTAMP(3),
    "lossType" TEXT,
    "description" TEXT,
    "injuriesReported" BOOLEAN NOT NULL DEFAULT false,
    "policeReportNumber" TEXT,
    "estimatedDamage" DOUBLE PRECISION,
    "missingFields" JSONB,
    "confirmationNumber" TEXT NOT NULL,
    "promotedClaimId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FNOLDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Client_agentId_idx" ON "Client"("agentId");

-- CreateIndex
CREATE INDEX "Client_householdId_idx" ON "Client"("householdId");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Contact_clientId_idx" ON "Contact"("clientId");

-- CreateIndex
CREATE INDEX "LifeEvent_clientId_idx" ON "LifeEvent"("clientId");

-- CreateIndex
CREATE INDEX "LifeEvent_eventDate_idx" ON "LifeEvent"("eventDate");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "Document_policyId_idx" ON "Document"("policyId");

-- CreateIndex
CREATE INDEX "Document_claimId_idx" ON "Document"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_code_key" ON "Carrier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_policyNumber_key" ON "Policy"("policyNumber");

-- CreateIndex
CREATE INDEX "Policy_clientId_idx" ON "Policy"("clientId");

-- CreateIndex
CREATE INDEX "Policy_carrierId_idx" ON "Policy"("carrierId");

-- CreateIndex
CREATE INDEX "Policy_agentId_idx" ON "Policy"("agentId");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Policy_expirationDate_idx" ON "Policy"("expirationDate");

-- CreateIndex
CREATE INDEX "Endorsement_policyId_idx" ON "Endorsement"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");

-- CreateIndex
CREATE INDEX "Quote_agentId_idx" ON "Quote"("agentId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_quoteId_key" ON "Proposal"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteFollowUp_quoteId_idx" ON "QuoteFollowUp"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteFollowUp_scheduledAt_idx" ON "QuoteFollowUp"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimNumber_key" ON "Claim"("claimNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_intakeEventId_key" ON "Claim"("intakeEventId");

-- CreateIndex
CREATE INDEX "Claim_policyId_idx" ON "Claim"("policyId");

-- CreateIndex
CREATE INDEX "Claim_clientId_idx" ON "Claim"("clientId");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_aiRiskScore_idx" ON "Claim"("aiRiskScore");

-- CreateIndex
CREATE INDEX "Claim_assignedAdjusterId_idx" ON "Claim"("assignedAdjusterId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_sourceSystem_sourceRecordId_key" ON "Claim"("sourceSystem", "sourceRecordId");

-- CreateIndex
CREATE INDEX "ClaimCommunication_claimId_idx" ON "ClaimCommunication"("claimId");

-- CreateIndex
CREATE INDEX "Settlement_claimId_idx" ON "Settlement"("claimId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimCaseEvent_externalEventId_key" ON "ClaimCaseEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimCaseEvent_claimId_occurredAt_idx" ON "ClaimCaseEvent"("claimId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimCaseEvent_claimId_sequence_key" ON "ClaimCaseEvent"("claimId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimEvidence_externalEventId_key" ON "ClaimEvidence"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimEvidence_claimId_createdAt_idx" ON "ClaimEvidence"("claimId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimEvidence_sourceSystem_sourceRecordId_key" ON "ClaimEvidence"("sourceSystem", "sourceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimReserveEntry_externalEventId_key" ON "ClaimReserveEntry"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimReserveEntry_claimId_createdAt_idx" ON "ClaimReserveEntry"("claimId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimAdjudication_externalEventId_key" ON "ClaimAdjudication"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimAdjudication_claimId_createdAt_idx" ON "ClaimAdjudication"("claimId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimAppeal_externalEventId_key" ON "ClaimAppeal"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimAppeal_claimId_createdAt_idx" ON "ClaimAppeal"("claimId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimAppealDecision_appealId_key" ON "ClaimAppealDecision"("appealId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimAppealDecision_externalEventId_key" ON "ClaimAppealDecision"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimSubrogation_externalEventId_key" ON "ClaimSubrogation"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimSubrogation_claimId_createdAt_idx" ON "ClaimSubrogation"("claimId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimRecoveryEntry_externalEventId_key" ON "ClaimRecoveryEntry"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimRecoveryEntry_subrogationId_createdAt_idx" ON "ClaimRecoveryEntry"("subrogationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimRecoveryEntry_sourceSystem_externalTransactionId_key" ON "ClaimRecoveryEntry"("sourceSystem", "externalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimFinancialEntry_externalEventId_key" ON "ClaimFinancialEntry"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimFinancialEntry_claimId_kind_createdAt_idx" ON "ClaimFinancialEntry"("claimId", "kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimFinancialEntry_sourceSystem_externalTransactionId_key" ON "ClaimFinancialEntry"("sourceSystem", "externalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimIntegrationEvent_externalEventId_key" ON "ClaimIntegrationEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "ClaimIntegrationEvent_claimId_occurredAt_idx" ON "ClaimIntegrationEvent"("claimId", "occurredAt");

-- CreateIndex
CREATE INDEX "Commission_policyId_idx" ON "Commission"("policyId");

-- CreateIndex
CREATE INDEX "Commission_agentId_idx" ON "Commission"("agentId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_earnedDate_idx" ON "Commission"("earnedDate");

-- CreateIndex
CREATE INDEX "CommissionSplit_commissionId_idx" ON "CommissionSplit"("commissionId");

-- CreateIndex
CREATE INDEX "CommissionSplit_producerId_idx" ON "CommissionSplit"("producerId");

-- CreateIndex
CREATE INDEX "Campaign_createdById_idx" ON "Campaign"("createdById");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignRecipient_clientId_idx" ON "CampaignRecipient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_campaignId_clientId_key" ON "CampaignRecipient"("campaignId", "clientId");

-- CreateIndex
CREATE INDEX "Referral_referringClientId_idx" ON "Referral"("referringClientId");

-- CreateIndex
CREATE INDEX "Referral_referredClientId_idx" ON "Referral"("referredClientId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_clientId_idx" ON "Activity"("clientId");

-- CreateIndex
CREATE INDEX "Activity_policyId_idx" ON "Activity"("policyId");

-- CreateIndex
CREATE INDEX "Activity_quoteId_idx" ON "Activity"("quoteId");

-- CreateIndex
CREATE INDEX "Activity_claimId_idx" ON "Activity"("claimId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "EmailTemplate_type_idx" ON "EmailTemplate"("type");

-- CreateIndex
CREATE INDEX "EmailTemplate_status_idx" ON "EmailTemplate"("status");

-- CreateIndex
CREATE INDEX "AIAnalysis_entityType_entityId_idx" ON "AIAnalysis"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RenewalPrediction_policyId_idx" ON "RenewalPrediction"("policyId");

-- CreateIndex
CREATE INDEX "RenewalPrediction_renewalDate_idx" ON "RenewalPrediction"("renewalDate");

-- CreateIndex
CREATE INDEX "CrossSellRecommendation_clientId_idx" ON "CrossSellRecommendation"("clientId");

-- CreateIndex
CREATE INDEX "CrossSellRecommendation_status_idx" ON "CrossSellRecommendation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAuth_clientId_key" ON "CustomerAuth"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAuth_email_key" ON "CustomerAuth"("email");

-- CreateIndex
CREATE INDEX "CustomerAuth_email_idx" ON "CustomerAuth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

-- CreateIndex
CREATE INDEX "Payment_policyId_idx" ON "Payment"("policyId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_stripeSessionId_idx" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "SignatureAudit_proposalId_idx" ON "SignatureAudit"("proposalId");

-- CreateIndex
CREATE INDEX "UnderwritingRule_lineOfBusiness_idx" ON "UnderwritingRule"("lineOfBusiness");

-- CreateIndex
CREATE INDEX "UnderwritingRule_isActive_idx" ON "UnderwritingRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UnderwritingResult_quoteId_key" ON "UnderwritingResult"("quoteId");

-- CreateIndex
CREATE INDEX "UnderwritingResult_decision_idx" ON "UnderwritingResult"("decision");

-- CreateIndex
CREATE INDEX "ComplianceRule_category_idx" ON "ComplianceRule"("category");

-- CreateIndex
CREATE INDEX "ComplianceRule_state_idx" ON "ComplianceRule"("state");

-- CreateIndex
CREATE INDEX "ComplianceRule_isActive_idx" ON "ComplianceRule"("isActive");

-- CreateIndex
CREATE INDEX "ComplianceCheck_ruleId_idx" ON "ComplianceCheck"("ruleId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_status_idx" ON "ComplianceCheck"("status");

-- CreateIndex
CREATE INDEX "ComplianceCheck_nextDueDate_idx" ON "ComplianceCheck"("nextDueDate");

-- CreateIndex
CREATE INDEX "JobLog_jobName_idx" ON "JobLog"("jobName");

-- CreateIndex
CREATE INDEX "JobLog_status_idx" ON "JobLog"("status");

-- CreateIndex
CREATE INDEX "JobLog_createdAt_idx" ON "JobLog"("createdAt");

-- CreateIndex
CREATE INDEX "RateTable_lineOfBusiness_idx" ON "RateTable"("lineOfBusiness");

-- CreateIndex
CREATE INDEX "RateTable_isActive_idx" ON "RateTable"("isActive");

-- CreateIndex
CREATE INDEX "RateFactor_rateTableId_idx" ON "RateFactor"("rateTableId");

-- CreateIndex
CREATE INDEX "RateFactor_category_idx" ON "RateFactor"("category");

-- CreateIndex
CREATE INDEX "PaymentSchedule_policyId_idx" ON "PaymentSchedule"("policyId");

-- CreateIndex
CREATE INDEX "PaymentSchedule_clientId_idx" ON "PaymentSchedule"("clientId");

-- CreateIndex
CREATE INDEX "PaymentSchedule_dueDate_idx" ON "PaymentSchedule"("dueDate");

-- CreateIndex
CREATE INDEX "PaymentSchedule_status_idx" ON "PaymentSchedule"("status");

-- CreateIndex
CREATE INDEX "Escalation_status_idx" ON "Escalation"("status");

-- CreateIndex
CREATE INDEX "Escalation_priority_idx" ON "Escalation"("priority");

-- CreateIndex
CREATE INDEX "Escalation_assignedTo_idx" ON "Escalation"("assignedTo");

-- CreateIndex
CREATE INDEX "Escalation_slaDeadline_idx" ON "Escalation"("slaDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_complaintNumber_key" ON "Complaint"("complaintNumber");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_clientId_idx" ON "Complaint"("clientId");

-- CreateIndex
CREATE INDEX "Complaint_slaDeadline_idx" ON "Complaint"("slaDeadline");

-- CreateIndex
CREATE INDEX "ComplaintNote_complaintId_idx" ON "ComplaintNote"("complaintId");

-- CreateIndex
CREATE INDEX "ClaimFraudAssessment_claimId_idx" ON "ClaimFraudAssessment"("claimId");

-- CreateIndex
CREATE INDEX "ClaimFraudAssessment_fraudRiskScore_idx" ON "ClaimFraudAssessment"("fraudRiskScore");

-- CreateIndex
CREATE INDEX "ClaimFraudAssessment_recommendedAction_idx" ON "ClaimFraudAssessment"("recommendedAction");

-- CreateIndex
CREATE INDEX "ClaimFraudAssessment_createdAt_idx" ON "ClaimFraudAssessment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_callSid_key" ON "CallLog"("callSid");

-- CreateIndex
CREATE INDEX "CallLog_callSid_idx" ON "CallLog"("callSid");

-- CreateIndex
CREATE INDEX "CallLog_from_idx" ON "CallLog"("from");

-- CreateIndex
CREATE INDEX "CallLog_to_idx" ON "CallLog"("to");

-- CreateIndex
CREATE INDEX "AiResult_feature_createdAt_idx" ON "AiResult"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiResult_refType_refId_idx" ON "AiResult"("refType", "refId");

-- CreateIndex
CREATE INDEX "AiResult_userId_idx" ON "AiResult"("userId");

-- CreateIndex
CREATE INDEX "UnderwritingNarrative_refType_refId_idx" ON "UnderwritingNarrative"("refType", "refId");

-- CreateIndex
CREATE INDEX "LossRunIngestion_quoteId_idx" ON "LossRunIngestion"("quoteId");

-- CreateIndex
CREATE INDEX "RenewalRiskScore_policyId_createdAt_idx" ON "RenewalRiskScore"("policyId", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceCheckResult_refType_refId_createdAt_idx" ON "ComplianceCheckResult"("refType", "refId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FNOLDraft_confirmationNumber_key" ON "FNOLDraft"("confirmationNumber");

-- CreateIndex
CREATE INDEX "FNOLDraft_callSid_idx" ON "FNOLDraft"("callSid");

-- CreateIndex
CREATE INDEX "FNOLDraft_callerPhone_idx" ON "FNOLDraft"("callerPhone");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteFollowUp" ADD CONSTRAINT "QuoteFollowUp_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimCommunication" ADD CONSTRAINT "ClaimCommunication_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimCaseEvent" ADD CONSTRAINT "ClaimCaseEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimReserveEntry" ADD CONSTRAINT "ClaimReserveEntry_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimAdjudication" ADD CONSTRAINT "ClaimAdjudication_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimAppeal" ADD CONSTRAINT "ClaimAppeal_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimAppealDecision" ADD CONSTRAINT "ClaimAppealDecision_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "ClaimAppeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimSubrogation" ADD CONSTRAINT "ClaimSubrogation_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRecoveryEntry" ADD CONSTRAINT "ClaimRecoveryEntry_subrogationId_fkey" FOREIGN KEY ("subrogationId") REFERENCES "ClaimSubrogation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimFinancialEntry" ADD CONSTRAINT "ClaimFinancialEntry_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimIntegrationEvent" ADD CONSTRAINT "ClaimIntegrationEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSplit" ADD CONSTRAINT "CommissionSplit_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referringClientId_fkey" FOREIGN KEY ("referringClientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredClientId_fkey" FOREIGN KEY ("referredClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossSellRecommendation" ADD CONSTRAINT "CrossSellRecommendation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAuth" ADD CONSTRAINT "CustomerAuth_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAudit" ADD CONSTRAINT "SignatureAudit_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnderwritingResult" ADD CONSTRAINT "UnderwritingResult_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateFactor" ADD CONSTRAINT "RateFactor_rateTableId_fkey" FOREIGN KEY ("rateTableId") REFERENCES "RateTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintNote" ADD CONSTRAINT "ComplaintNote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimFraudAssessment" ADD CONSTRAINT "ClaimFraudAssessment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Governed claim records are evidentiary records and are append-only.
CREATE OR REPLACE FUNCTION reject_governed_claim_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% rows are append-only', TG_TABLE_NAME USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "ClaimCaseEvent_immutable" BEFORE UPDATE OR DELETE ON "ClaimCaseEvent" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimEvidence_immutable" BEFORE UPDATE OR DELETE ON "ClaimEvidence" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimReserveEntry_immutable" BEFORE UPDATE OR DELETE ON "ClaimReserveEntry" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimAdjudication_immutable" BEFORE UPDATE OR DELETE ON "ClaimAdjudication" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimAppeal_immutable" BEFORE UPDATE OR DELETE ON "ClaimAppeal" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimAppealDecision_immutable" BEFORE UPDATE OR DELETE ON "ClaimAppealDecision" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimSubrogation_immutable" BEFORE UPDATE OR DELETE ON "ClaimSubrogation" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimRecoveryEntry_immutable" BEFORE UPDATE OR DELETE ON "ClaimRecoveryEntry" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimFinancialEntry_immutable" BEFORE UPDATE OR DELETE ON "ClaimFinancialEntry" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();
CREATE TRIGGER "ClaimIntegrationEvent_immutable" BEFORE UPDATE OR DELETE ON "ClaimIntegrationEvent" FOR EACH ROW EXECUTE FUNCTION reject_governed_claim_mutation();

CREATE OR REPLACE FUNCTION validate_claim_event_link()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  last_sequence integer;
  last_hash text;
BEGIN
  SELECT "sequence", "eventHash" INTO last_sequence, last_hash
  FROM "ClaimCaseEvent" WHERE "claimId" = NEW."claimId"
  ORDER BY "sequence" DESC LIMIT 1 FOR UPDATE;
  IF last_sequence IS NULL THEN
    IF NEW."sequence" <> 1 OR NEW."previousHash" <> 'GENESIS' THEN
      RAISE EXCEPTION 'first claim event must begin at GENESIS' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW."sequence" <> last_sequence + 1 OR NEW."previousHash" <> last_hash THEN
    RAISE EXCEPTION 'claim event chain is not contiguous' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ClaimCaseEvent_chain" BEFORE INSERT ON "ClaimCaseEvent" FOR EACH ROW EXECUTE FUNCTION validate_claim_event_link();

CREATE OR REPLACE FUNCTION enforce_governed_claim_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."intakeEventId" IS NOT NULL THEN
    IF NEW."intakeEventId" IS DISTINCT FROM OLD."intakeEventId"
       OR NEW."intakePayloadHash" IS DISTINCT FROM OLD."intakePayloadHash"
       OR NEW."sourceSystem" IS DISTINCT FROM OLD."sourceSystem"
       OR NEW."sourceRecordId" IS DISTINCT FROM OLD."sourceRecordId"
       OR NEW."coverageSnapshot" IS DISTINCT FROM OLD."coverageSnapshot"
       OR NEW."policyId" IS DISTINCT FROM OLD."policyId"
       OR NEW."clientId" IS DISTINCT FROM OLD."clientId"
       OR NEW."dateOfLoss" IS DISTINCT FROM OLD."dateOfLoss"
       OR NEW."jurisdiction" IS DISTINCT FROM OLD."jurisdiction" THEN
      RAISE EXCEPTION 'governed claim provenance and coverage snapshot are immutable' USING ERRCODE = '55000';
    END IF;
    IF (NEW."status", NEW."reserveAmount", NEW."paidAmount", NEW."assignedAdjusterId", NEW."closedAt", NEW."closedReason")
       IS DISTINCT FROM
       (OLD."status", OLD."reserveAmount", OLD."paidAmount", OLD."assignedAdjusterId", OLD."closedAt", OLD."closedReason")
       AND NEW."workflowVersion" <> OLD."workflowVersion" + 1 THEN
      RAISE EXCEPTION 'governed claim transition requires the next workflow version' USING ERRCODE = '40001';
    END IF;
    IF NEW."workflowVersion" < OLD."workflowVersion" OR NEW."workflowVersion" > OLD."workflowVersion" + 1 THEN
      RAISE EXCEPTION 'invalid governed claim workflow version' USING ERRCODE = '40001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Claim_governed_update" BEFORE UPDATE ON "Claim" FOR EACH ROW EXECUTE FUNCTION enforce_governed_claim_update();

CREATE OR REPLACE FUNCTION enforce_claim_retention()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."intakeEventId" IS NOT NULL AND (OLD."legalHold" OR CURRENT_TIMESTAMP < OLD."retainedUntil") THEN
    RAISE EXCEPTION 'claim is retained and cannot be deleted' USING ERRCODE = '55000';
  END IF;
  RETURN OLD;
END;
$$;
CREATE TRIGGER "Claim_retained" BEFORE DELETE ON "Claim" FOR EACH ROW EXECUTE FUNCTION enforce_claim_retention();
