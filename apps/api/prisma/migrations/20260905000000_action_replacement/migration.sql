ALTER TABLE "CorrectiveAction" ADD COLUMN "replacesActionId" UUID;
CREATE UNIQUE INDEX "CorrectiveAction_replacesActionId_key" ON "CorrectiveAction"("replacesActionId");
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_replacesActionId_fkey"
  FOREIGN KEY ("replacesActionId") REFERENCES "CorrectiveAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
