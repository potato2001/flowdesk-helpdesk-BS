CREATE TYPE "Role" AS ENUM ('REQUESTER', 'AGENT', 'MANAGER', 'ADMIN');
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "CommentVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "ActivityType" AS ENUM ('TICKET_CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNEE_CHANGED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'SLA_BREACHED', 'TICKET_RESOLVED');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'REQUESTER',
  "department" VARCHAR(120),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tickets" (
  "id" UUID NOT NULL,
  "number" SERIAL NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "description" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
  "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "requesterId" UUID NOT NULL,
  "assigneeId" UUID,
  "responseDueAt" TIMESTAMPTZ(3) NOT NULL,
  "resolutionDueAt" TIMESTAMPTZ(3) NOT NULL,
  "firstRespondedAt" TIMESTAMPTZ(3),
  "resolvedAt" TIMESTAMPTZ(3),
  "responseSlaBreached" BOOLEAN NOT NULL DEFAULT false,
  "resolutionSlaBreached" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "visibility" "CommentVisibility" NOT NULL DEFAULT 'PUBLIC',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attachments" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "commentId" UUID,
  "uploadedById" UUID NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "storageKey" VARCHAR(500) NOT NULL,
  "mimeType" VARCHAR(150) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activities" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "actorId" UUID,
  "type" "ActivityType" NOT NULL,
  "summary" VARCHAR(500) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sla_policies" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "priority" "TicketPriority" NOT NULL,
  "responseMinutes" INTEGER NOT NULL,
  "resolutionMinutes" INTEGER NOT NULL,
  "businessHoursOnly" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");
CREATE UNIQUE INDEX "tickets_number_key" ON "tickets"("number");
CREATE INDEX "tickets_status_priority_idx" ON "tickets"("status", "priority");
CREATE INDEX "tickets_assigneeId_status_idx" ON "tickets"("assigneeId", "status");
CREATE INDEX "tickets_requesterId_createdAt_idx" ON "tickets"("requesterId", "createdAt");
CREATE INDEX "tickets_responseDueAt_idx" ON "tickets"("responseDueAt");
CREATE INDEX "tickets_resolutionDueAt_idx" ON "tickets"("resolutionDueAt");
CREATE INDEX "comments_ticketId_createdAt_idx" ON "comments"("ticketId", "createdAt");
CREATE UNIQUE INDEX "attachments_storageKey_key" ON "attachments"("storageKey");
CREATE INDEX "attachments_ticketId_createdAt_idx" ON "attachments"("ticketId", "createdAt");
CREATE INDEX "activities_ticketId_createdAt_idx" ON "activities"("ticketId", "createdAt");
CREATE UNIQUE INDEX "sla_policies_priority_key" ON "sla_policies"("priority");

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "sla_policies" ("id", "name", "priority", "responseMinutes", "resolutionMinutes", "businessHoursOnly", "updatedAt") VALUES
  ('10000000-0000-4000-8000-000000000001', 'SLA ưu tiên thấp', 'LOW', 480, 2400, true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000002', 'SLA ưu tiên trung bình', 'MEDIUM', 240, 960, true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000003', 'SLA ưu tiên cao', 'HIGH', 60, 480, true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000004', 'SLA khẩn cấp', 'URGENT', 15, 120, true, CURRENT_TIMESTAMP);
