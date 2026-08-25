-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'JEFE_CALIDAD', 'ANALISTA', 'OPERARIO');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('EN_PROCESO', 'EN_OBSERVACION', 'CERRADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('FISICOQUIMICO', 'ORGANOLEPTICO');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'VENCIDA', 'CANCELADA', 'REPROGRAMADA');

-- CreateEnum
CREATE TYPE "ParameterType" AS ENUM ('FISICOQUIMICO', 'SENSORIAL');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('CONFORME', 'NO_CONFORME', 'ANULADO');

-- CreateEnum
CREATE TYPE "NCStatus" AS ENUM ('ABIERTA', 'EN_ANALISIS', 'EN_TRATAMIENTO', 'EN_VERIFICACION', 'CERRADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "NCSeverity" AS ENUM ('LEVE', 'MODERADA', 'CRITICA');

-- CreateEnum
CREATE TYPE "NCOrigin" AS ENUM ('AUTOMATICA_FISICOQUIMICA', 'AUTOMATICA_SENSORIAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CORRECCION', 'CORRECTIVA', 'PREVENTIVA');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDIENTE', 'EN_EJECUCION', 'EJECUTADA', 'VERIFICADA', 'NO_EFICAZ');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STATE_CHANGE', 'LOGIN', 'LOGOUT', 'EXPORT');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIVO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "DataOrigin" AS ENUM ('REAL', 'DEMO');

-- CreateTable
CREATE TABLE "Area" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "areaId" UUID,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(3),
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrapeVariety" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GrapeVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiscoType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PiscoType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessStage" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProcessStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parameter" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "type" "ParameterType" NOT NULL,
    "testMethod" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Parameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standard" (
    "id" UUID NOT NULL,
    "parameterId" UUID NOT NULL,
    "piscoTypeId" UUID,
    "stageId" UUID,
    "minValue" DECIMAL(16,6),
    "maxValue" DECIMAL(16,6),
    "targetValue" DECIMAL(16,6),
    "referenceNorm" TEXT,
    "defaultSeverity" "NCSeverity" NOT NULL,
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Standard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensoryThreshold" (
    "id" UUID NOT NULL,
    "piscoTypeId" UUID,
    "minAverage" DECIMAL(3,2) NOT NULL,
    "defaultSeverity" "NCSeverity" NOT NULL,
    "referenceNorm" TEXT,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SensoryThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensoryAttribute" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SensoryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL,
    "lastCalibrationRef" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "piscoTypeId" UUID NOT NULL,
    "currentStageId" UUID NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'EN_PROCESO',
    "startDate" DATE NOT NULL,
    "closeDate" DATE,
    "rejectedAt" TIMESTAMPTZ(3),
    "rejectedById" UUID,
    "rejectionReason" TEXT,
    "volumeLiters" DECIMAL(14,3) NOT NULL,
    "harvestOrigin" TEXT,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "dataOrigin" "DataOrigin" NOT NULL DEFAULT 'REAL',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchGrapeVariety" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "varietyId" UUID NOT NULL,
    "percentage" DECIMAL(5,2),

    CONSTRAINT "BatchGrapeVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchStage" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "stageId" UUID NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3),
    "responsibleId" UUID NOT NULL,
    "observations" TEXT,

    CONSTRAINT "BatchStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "batchId" UUID NOT NULL,
    "stageId" UUID NOT NULL,
    "type" "InspectionType" NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PROGRAMADA',
    "scheduledDate" TIMESTAMPTZ(3) NOT NULL,
    "executedAt" TIMESTAMPTZ(3),
    "responsibleId" UUID NOT NULL,
    "equipmentId" UUID,
    "rescheduledFromId" UUID,
    "changeReason" TEXT,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "dataOrigin" "DataOrigin" NOT NULL DEFAULT 'REAL',

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionParameter" (
    "id" UUID NOT NULL,
    "inspectionId" UUID NOT NULL,
    "parameterId" UUID NOT NULL,

    CONSTRAINT "InspectionParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplate" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "piscoTypeId" UUID NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,

    CONSTRAINT "InspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplateItem" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "stageId" UUID NOT NULL,
    "type" "InspectionType" NOT NULL,
    "offsetDaysFromBatchStart" INTEGER NOT NULL,
    "scheduledLocalTime" TIME(0) NOT NULL,
    "responsibleRole" "Role" NOT NULL,
    "equipmentId" UUID,

    CONSTRAINT "InspectionTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplateParameter" (
    "id" UUID NOT NULL,
    "templateItemId" UUID NOT NULL,
    "parameterId" UUID NOT NULL,

    CONSTRAINT "InspectionTemplateParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysChemResult" (
    "id" UUID NOT NULL,
    "inspectionId" UUID NOT NULL,
    "parameterId" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "value" DECIMAL(16,6) NOT NULL,
    "status" "ResultStatus" NOT NULL,
    "observation" TEXT,
    "equipmentId" UUID NOT NULL,
    "calibrationRef" TEXT,
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,
    "dataOrigin" "DataOrigin" NOT NULL DEFAULT 'REAL',
    "annulledById" UUID,
    "annulledAt" TIMESTAMPTZ(3),
    "annulReason" TEXT,
    "replacesId" UUID,

    CONSTRAINT "PhysChemResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorySession" (
    "id" UUID NOT NULL,
    "inspectionId" UUID NOT NULL,
    "sessionDate" DATE NOT NULL,
    "overallAverage" DECIMAL(3,2) NOT NULL,
    "sensoryThresholdId" UUID NOT NULL,
    "appliedThreshold" DECIMAL(3,2) NOT NULL,
    "status" "ResultStatus" NOT NULL,
    "defectsFound" TEXT,
    "notes" TEXT,
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,
    "dataOrigin" "DataOrigin" NOT NULL DEFAULT 'REAL',
    "annulledById" UUID,
    "annulledAt" TIMESTAMPTZ(3),
    "annulReason" TEXT,
    "replacesId" UUID,

    CONSTRAINT "SensorySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensoryPanelist" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID,
    "externalName" TEXT,

    CONSTRAINT "SensoryPanelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensoryScore" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "panelistId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "descriptor" TEXT,

    CONSTRAINT "SensoryScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonConformity" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "batchId" UUID NOT NULL,
    "stageId" UUID,
    "inspectionId" UUID,
    "physChemResultId" UUID,
    "sensorySessionId" UUID,
    "origin" "NCOrigin" NOT NULL,
    "severity" "NCSeverity" NOT NULL,
    "status" "NCStatus" NOT NULL DEFAULT 'ABIERTA',
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "detectedAt" TIMESTAMPTZ(3) NOT NULL,
    "detectedById" UUID NOT NULL,
    "assignedToId" UUID,
    "assignedAreaId" UUID,
    "attentionStartedAt" TIMESTAMPTZ(3),
    "closedAt" TIMESTAMPTZ(3),
    "closedById" UUID,
    "closeComment" TEXT,
    "annulledAt" TIMESTAMPTZ(3),
    "annulledById" UUID,
    "annulReason" TEXT,
    "dataOrigin" "DataOrigin" NOT NULL DEFAULT 'REAL',

    CONSTRAINT "NonConformity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" UUID NOT NULL,
    "nonConformityId" UUID NOT NULL,
    "type" "ActionType" NOT NULL,
    "description" TEXT NOT NULL,
    "responsibleId" UUID NOT NULL,
    "committedDate" DATE NOT NULL,
    "executedAt" TIMESTAMPTZ(3),
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "isEffective" BOOLEAN,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMPTZ(3),
    "verificationComment" TEXT,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_code_key" ON "Area"("code");

-- CreateIndex
CREATE INDEX "Area_isActive_idx" ON "Area"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_areaId_idx" ON "User"("areaId");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_revokedAt_idx" ON "RefreshToken"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "GrapeVariety_code_key" ON "GrapeVariety"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PiscoType_code_key" ON "PiscoType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessStage_code_key" ON "ProcessStage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessStage_sequence_key" ON "ProcessStage"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Parameter_code_key" ON "Parameter"("code");

-- CreateIndex
CREATE INDEX "Standard_parameterId_validFrom_validTo_idx" ON "Standard"("parameterId", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "Standard_piscoTypeId_idx" ON "Standard"("piscoTypeId");

-- CreateIndex
CREATE INDEX "Standard_stageId_idx" ON "Standard"("stageId");

-- CreateIndex
CREATE INDEX "SensoryThreshold_piscoTypeId_validFrom_validTo_idx" ON "SensoryThreshold"("piscoTypeId", "validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "SensoryAttribute_code_key" ON "SensoryAttribute"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SensoryAttribute_sequence_key" ON "SensoryAttribute"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_code_key" ON "Batch"("code");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE INDEX "Batch_currentStageId_idx" ON "Batch"("currentStageId");

-- CreateIndex
CREATE INDEX "Batch_startDate_idx" ON "Batch"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "BatchGrapeVariety_batchId_varietyId_key" ON "BatchGrapeVariety"("batchId", "varietyId");

-- CreateIndex
CREATE INDEX "BatchStage_startedAt_idx" ON "BatchStage"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BatchStage_batchId_stageId_key" ON "BatchStage"("batchId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_code_key" ON "Inspection"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_rescheduledFromId_key" ON "Inspection"("rescheduledFromId");

-- CreateIndex
CREATE INDEX "Inspection_batchId_idx" ON "Inspection"("batchId");

-- CreateIndex
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");

-- CreateIndex
CREATE INDEX "Inspection_scheduledDate_idx" ON "Inspection"("scheduledDate");

-- CreateIndex
CREATE INDEX "Inspection_responsibleId_idx" ON "Inspection"("responsibleId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionParameter_inspectionId_parameterId_key" ON "InspectionParameter"("inspectionId", "parameterId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionTemplate_code_key" ON "InspectionTemplate"("code");

-- CreateIndex
CREATE INDEX "InspectionTemplate_piscoTypeId_validFrom_validTo_idx" ON "InspectionTemplate"("piscoTypeId", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "InspectionTemplateItem_templateId_idx" ON "InspectionTemplateItem"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionTemplateParameter_templateItemId_parameterId_key" ON "InspectionTemplateParameter"("templateItemId", "parameterId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysChemResult_replacesId_key" ON "PhysChemResult"("replacesId");

-- CreateIndex
CREATE INDEX "PhysChemResult_inspectionId_idx" ON "PhysChemResult"("inspectionId");

-- CreateIndex
CREATE INDEX "PhysChemResult_parameterId_idx" ON "PhysChemResult"("parameterId");

-- CreateIndex
CREATE INDEX "PhysChemResult_recordedAt_idx" ON "PhysChemResult"("recordedAt");

-- CreateIndex
CREATE INDEX "PhysChemResult_status_idx" ON "PhysChemResult"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SensorySession_replacesId_key" ON "SensorySession"("replacesId");

-- CreateIndex
CREATE INDEX "SensorySession_inspectionId_idx" ON "SensorySession"("inspectionId");

-- CreateIndex
CREATE INDEX "SensorySession_recordedAt_idx" ON "SensorySession"("recordedAt");

-- CreateIndex
CREATE INDEX "SensorySession_status_idx" ON "SensorySession"("status");

-- CreateIndex
CREATE INDEX "SensoryPanelist_sessionId_idx" ON "SensoryPanelist"("sessionId");

-- CreateIndex
CREATE INDEX "SensoryPanelist_userId_idx" ON "SensoryPanelist"("userId");

-- CreateIndex
CREATE INDEX "SensoryScore_sessionId_idx" ON "SensoryScore"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SensoryScore_panelistId_attributeId_key" ON "SensoryScore"("panelistId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "NonConformity_code_key" ON "NonConformity"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NonConformity_physChemResultId_key" ON "NonConformity"("physChemResultId");

-- CreateIndex
CREATE UNIQUE INDEX "NonConformity_sensorySessionId_key" ON "NonConformity"("sensorySessionId");

-- CreateIndex
CREATE INDEX "NonConformity_batchId_idx" ON "NonConformity"("batchId");

-- CreateIndex
CREATE INDEX "NonConformity_status_idx" ON "NonConformity"("status");

-- CreateIndex
CREATE INDEX "NonConformity_severity_idx" ON "NonConformity"("severity");

-- CreateIndex
CREATE INDEX "NonConformity_detectedAt_idx" ON "NonConformity"("detectedAt");

-- CreateIndex
CREATE INDEX "CorrectiveAction_nonConformityId_idx" ON "CorrectiveAction"("nonConformityId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_responsibleId_idx" ON "CorrectiveAction"("responsibleId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_committedDate_idx" ON "CorrectiveAction"("committedDate");

-- CreateIndex
CREATE INDEX "CorrectiveAction_status_idx" ON "CorrectiveAction"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_piscoTypeId_fkey" FOREIGN KEY ("piscoTypeId") REFERENCES "PiscoType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProcessStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensoryThreshold" ADD CONSTRAINT "SensoryThreshold_piscoTypeId_fkey" FOREIGN KEY ("piscoTypeId") REFERENCES "PiscoType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_piscoTypeId_fkey" FOREIGN KEY ("piscoTypeId") REFERENCES "PiscoType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "ProcessStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchGrapeVariety" ADD CONSTRAINT "BatchGrapeVariety_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchGrapeVariety" ADD CONSTRAINT "BatchGrapeVariety_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "GrapeVariety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStage" ADD CONSTRAINT "BatchStage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStage" ADD CONSTRAINT "BatchStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProcessStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchStage" ADD CONSTRAINT "BatchStage_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProcessStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionParameter" ADD CONSTRAINT "InspectionParameter_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionParameter" ADD CONSTRAINT "InspectionParameter_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplate" ADD CONSTRAINT "InspectionTemplate_piscoTypeId_fkey" FOREIGN KEY ("piscoTypeId") REFERENCES "PiscoType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplate" ADD CONSTRAINT "InspectionTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateItem" ADD CONSTRAINT "InspectionTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateItem" ADD CONSTRAINT "InspectionTemplateItem_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProcessStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateItem" ADD CONSTRAINT "InspectionTemplateItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateParameter" ADD CONSTRAINT "InspectionTemplateParameter_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "InspectionTemplateItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplateParameter" ADD CONSTRAINT "InspectionTemplateParameter_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysChemResult" ADD CONSTRAINT "PhysChemResult_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysChemResult" ADD CONSTRAINT "PhysChemResult_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysChemResult" ADD CONSTRAINT "PhysChemResult_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysChemResult" ADD CONSTRAINT "PhysChemResult_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysChemResult" ADD CONSTRAINT "PhysChemResult_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysChemResult" ADD CONSTRAINT "PhysChemResult_annulledById_fkey" FOREIGN KEY ("annulledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysChemResult" ADD CONSTRAINT "PhysChemResult_replacesId_fkey" FOREIGN KEY ("replacesId") REFERENCES "PhysChemResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorySession" ADD CONSTRAINT "SensorySession_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorySession" ADD CONSTRAINT "SensorySession_sensoryThresholdId_fkey" FOREIGN KEY ("sensoryThresholdId") REFERENCES "SensoryThreshold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorySession" ADD CONSTRAINT "SensorySession_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorySession" ADD CONSTRAINT "SensorySession_annulledById_fkey" FOREIGN KEY ("annulledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorySession" ADD CONSTRAINT "SensorySession_replacesId_fkey" FOREIGN KEY ("replacesId") REFERENCES "SensorySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensoryPanelist" ADD CONSTRAINT "SensoryPanelist_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SensorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensoryPanelist" ADD CONSTRAINT "SensoryPanelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensoryScore" ADD CONSTRAINT "SensoryScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SensorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensoryScore" ADD CONSTRAINT "SensoryScore_panelistId_fkey" FOREIGN KEY ("panelistId") REFERENCES "SensoryPanelist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensoryScore" ADD CONSTRAINT "SensoryScore_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "SensoryAttribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProcessStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_physChemResultId_fkey" FOREIGN KEY ("physChemResultId") REFERENCES "PhysChemResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_sensorySessionId_fkey" FOREIGN KEY ("sensorySessionId") REFERENCES "SensorySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_detectedById_fkey" FOREIGN KEY ("detectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_assignedAreaId_fkey" FOREIGN KEY ("assignedAreaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_annulledById_fkey" FOREIGN KEY ("annulledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DomainIntegrity
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Parameter"
ADD CONSTRAINT "Parameter_decimals_check"
CHECK ("decimals" BETWEEN 0 AND 10);

ALTER TABLE "Standard"
ADD CONSTRAINT "Standard_validity_check"
CHECK ("validTo" IS NULL OR "validFrom" <= "validTo"),
ADD CONSTRAINT "Standard_limits_check"
CHECK (
  ("minValue" IS NULL OR "maxValue" IS NULL OR "minValue" <= "maxValue")
  AND ("targetValue" IS NULL OR "minValue" IS NULL OR "minValue" <= "targetValue")
  AND ("targetValue" IS NULL OR "maxValue" IS NULL OR "targetValue" <= "maxValue")
),
ADD CONSTRAINT "Standard_no_overlapping_validity"
EXCLUDE USING gist (
  "parameterId" WITH =,
  COALESCE("piscoTypeId", '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
  COALESCE("stageId", '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
  daterange("validFrom", COALESCE("validTo", 'infinity'::date), '[]') WITH &&
) WHERE ("isActive");

ALTER TABLE "SensoryThreshold"
ADD CONSTRAINT "SensoryThreshold_average_check"
CHECK ("minAverage" BETWEEN 1 AND 5),
ADD CONSTRAINT "SensoryThreshold_validity_check"
CHECK ("validTo" IS NULL OR "validFrom" <= "validTo"),
ADD CONSTRAINT "SensoryThreshold_no_overlapping_validity"
EXCLUDE USING gist (
  COALESCE("piscoTypeId", '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
  daterange("validFrom", COALESCE("validTo", 'infinity'::date), '[]') WITH &&
) WHERE ("isActive");

ALTER TABLE "Batch"
ADD CONSTRAINT "Batch_volume_check"
CHECK ("volumeLiters" > 0),
ADD CONSTRAINT "Batch_close_date_check"
CHECK (
  ("status" = 'CERRADO' AND "closeDate" IS NOT NULL AND "closeDate" >= "startDate")
  OR ("status" <> 'CERRADO' AND "closeDate" IS NULL)
),
ADD CONSTRAINT "Batch_rejection_metadata_check"
CHECK (
  (
    "status" = 'RECHAZADO'
    AND "rejectedAt" IS NOT NULL
    AND "rejectedById" IS NOT NULL
    AND NULLIF(BTRIM("rejectionReason"), '') IS NOT NULL
  )
  OR (
    "status" <> 'RECHAZADO'
    AND "rejectedAt" IS NULL
    AND "rejectedById" IS NULL
    AND "rejectionReason" IS NULL
  )
);

ALTER TABLE "BatchGrapeVariety"
ADD CONSTRAINT "BatchGrapeVariety_percentage_check"
CHECK ("percentage" IS NULL OR "percentage" > 0 AND "percentage" <= 100);

ALTER TABLE "BatchStage"
ADD CONSTRAINT "BatchStage_time_order_check"
CHECK ("finishedAt" IS NULL OR "finishedAt" >= "startedAt");

CREATE UNIQUE INDEX "BatchStage_one_open_per_batch_key"
ON "BatchStage"("batchId")
WHERE "finishedAt" IS NULL;

ALTER TABLE "InspectionTemplate"
ADD CONSTRAINT "InspectionTemplate_validity_check"
CHECK ("validTo" IS NULL OR "validFrom" <= "validTo"),
ADD CONSTRAINT "InspectionTemplate_no_overlapping_validity"
EXCLUDE USING gist (
  "piscoTypeId" WITH =,
  daterange("validFrom", COALESCE("validTo", 'infinity'::date), '[]') WITH &&
) WHERE ("isActive");

ALTER TABLE "InspectionTemplateItem"
ADD CONSTRAINT "InspectionTemplateItem_offset_check"
CHECK ("offsetDaysFromBatchStart" >= 0);

ALTER TABLE "PhysChemResult"
ADD CONSTRAINT "PhysChemResult_not_self_replacing_check"
CHECK ("replacesId" IS NULL OR "replacesId" <> "id"),
ADD CONSTRAINT "PhysChemResult_annulment_check"
CHECK (
  (
    "status" = 'ANULADO'
    AND "annulledById" IS NOT NULL
    AND "annulledAt" IS NOT NULL
    AND NULLIF(BTRIM("annulReason"), '') IS NOT NULL
  )
  OR (
    "status" <> 'ANULADO'
    AND "annulledById" IS NULL
    AND "annulledAt" IS NULL
    AND "annulReason" IS NULL
  )
);

CREATE UNIQUE INDEX "PhysChemResult_one_final_per_parameter_key"
ON "PhysChemResult"("inspectionId", "parameterId")
WHERE "status" <> 'ANULADO';

ALTER TABLE "SensorySession"
ADD CONSTRAINT "SensorySession_values_check"
CHECK ("overallAverage" BETWEEN 1 AND 5 AND "appliedThreshold" BETWEEN 1 AND 5),
ADD CONSTRAINT "SensorySession_not_self_replacing_check"
CHECK ("replacesId" IS NULL OR "replacesId" <> "id"),
ADD CONSTRAINT "SensorySession_annulment_check"
CHECK (
  (
    "status" = 'ANULADO'
    AND "annulledById" IS NOT NULL
    AND "annulledAt" IS NOT NULL
    AND NULLIF(BTRIM("annulReason"), '') IS NOT NULL
  )
  OR (
    "status" <> 'ANULADO'
    AND "annulledById" IS NULL
    AND "annulledAt" IS NULL
    AND "annulReason" IS NULL
  )
);

CREATE UNIQUE INDEX "SensorySession_one_final_per_inspection_key"
ON "SensorySession"("inspectionId")
WHERE "status" <> 'ANULADO';

ALTER TABLE "SensoryPanelist"
ADD CONSTRAINT "SensoryPanelist_identity_check"
CHECK (
  ("userId" IS NOT NULL AND "externalName" IS NULL)
  OR ("userId" IS NULL AND NULLIF(BTRIM("externalName"), '') IS NOT NULL)
);

ALTER TABLE "SensoryScore"
ADD CONSTRAINT "SensoryScore_score_check"
CHECK ("score" BETWEEN 1 AND 5);

ALTER TABLE "NonConformity"
ADD CONSTRAINT "NonConformity_origin_check"
CHECK (
  (
    "origin" = 'AUTOMATICA_FISICOQUIMICA'
    AND "physChemResultId" IS NOT NULL
    AND "sensorySessionId" IS NULL
    AND "inspectionId" IS NOT NULL
  )
  OR (
    "origin" = 'AUTOMATICA_SENSORIAL'
    AND "physChemResultId" IS NULL
    AND "sensorySessionId" IS NOT NULL
    AND "inspectionId" IS NOT NULL
  )
  OR (
    "origin" = 'MANUAL'
    AND "physChemResultId" IS NULL
    AND "sensorySessionId" IS NULL
  )
),
ADD CONSTRAINT "NonConformity_time_order_check"
CHECK (
  ("attentionStartedAt" IS NULL OR "attentionStartedAt" >= "detectedAt")
  AND ("closedAt" IS NULL OR "closedAt" >= "detectedAt")
  AND ("annulledAt" IS NULL OR "annulledAt" >= "detectedAt")
),
ADD CONSTRAINT "NonConformity_closure_check"
CHECK (
  (
    "status" = 'CERRADA'
    AND "closedAt" IS NOT NULL
    AND "closedById" IS NOT NULL
    AND NULLIF(BTRIM("closeComment"), '') IS NOT NULL
  )
  OR (
    "status" <> 'CERRADA'
    AND "closedAt" IS NULL
    AND "closedById" IS NULL
    AND "closeComment" IS NULL
  )
),
ADD CONSTRAINT "NonConformity_annulment_check"
CHECK (
  (
    "status" = 'ANULADA'
    AND "origin" <> 'MANUAL'
    AND "annulledAt" IS NOT NULL
    AND "annulledById" IS NOT NULL
    AND NULLIF(BTRIM("annulReason"), '') IS NOT NULL
  )
  OR (
    "status" <> 'ANULADA'
    AND "annulledAt" IS NULL
    AND "annulledById" IS NULL
    AND "annulReason" IS NULL
  )
);

ALTER TABLE "CorrectiveAction"
ADD CONSTRAINT "CorrectiveAction_verifier_check"
CHECK ("verifiedById" IS NULL OR "verifiedById" <> "responsibleId"),
ADD CONSTRAINT "CorrectiveAction_execution_check"
CHECK (
  "status" IN ('PENDIENTE', 'EN_EJECUCION')
  OR "executedAt" IS NOT NULL
),
ADD CONSTRAINT "CorrectiveAction_verification_check"
CHECK (
  (
    "status" = 'VERIFICADA'
    AND "isEffective" = true
    AND "verifiedById" IS NOT NULL
    AND "verifiedAt" IS NOT NULL
  )
  OR (
    "status" = 'NO_EFICAZ'
    AND "isEffective" = false
    AND "verifiedById" IS NOT NULL
    AND "verifiedAt" IS NOT NULL
  )
  OR (
    "status" NOT IN ('VERIFICADA', 'NO_EFICAZ')
    AND "isEffective" IS NULL
    AND "verifiedById" IS NULL
    AND "verifiedAt" IS NULL
    AND "verificationComment" IS NULL
  )
);

-- ImmutableRecords
CREATE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE FUNCTION enforce_phys_chem_result_immutability()
RETURNS trigger AS $$
BEGIN
  IF ROW(
    NEW."inspectionId", NEW."parameterId", NEW."standardId", NEW."value",
    NEW."equipmentId", NEW."calibrationRef", NEW."recordedById", NEW."recordedAt",
    NEW."dataOrigin", NEW."replacesId"
  ) IS DISTINCT FROM ROW(
    OLD."inspectionId", OLD."parameterId", OLD."standardId", OLD."value",
    OLD."equipmentId", OLD."calibrationRef", OLD."recordedById", OLD."recordedAt",
    OLD."dataOrigin", OLD."replacesId"
  ) THEN
    RAISE EXCEPTION 'PhysChemResult technical fields are immutable';
  END IF;

  IF OLD."status" = 'ANULADO' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'An annulled PhysChemResult is immutable';
  END IF;

  IF NEW."status" <> OLD."status" AND NEW."status" <> 'ANULADO' THEN
    RAISE EXCEPTION 'PhysChemResult can only transition to ANULADO';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PhysChemResult_immutable"
BEFORE UPDATE ON "PhysChemResult"
FOR EACH ROW EXECUTE FUNCTION enforce_phys_chem_result_immutability();

CREATE FUNCTION enforce_sensory_session_immutability()
RETURNS trigger AS $$
BEGIN
  IF ROW(
    NEW."inspectionId", NEW."sessionDate", NEW."overallAverage",
    NEW."sensoryThresholdId", NEW."appliedThreshold", NEW."defectsFound", NEW."notes",
    NEW."recordedById", NEW."recordedAt", NEW."dataOrigin", NEW."replacesId"
  ) IS DISTINCT FROM ROW(
    OLD."inspectionId", OLD."sessionDate", OLD."overallAverage",
    OLD."sensoryThresholdId", OLD."appliedThreshold", OLD."defectsFound", OLD."notes",
    OLD."recordedById", OLD."recordedAt", OLD."dataOrigin", OLD."replacesId"
  ) THEN
    RAISE EXCEPTION 'SensorySession final fields are immutable';
  END IF;

  IF OLD."status" = 'ANULADO' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'An annulled SensorySession is immutable';
  END IF;

  IF NEW."status" <> OLD."status" AND NEW."status" <> 'ANULADO' THEN
    RAISE EXCEPTION 'SensorySession can only transition to ANULADO';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SensorySession_immutable"
BEFORE UPDATE ON "SensorySession"
FOR EACH ROW EXECUTE FUNCTION enforce_sensory_session_immutability();
