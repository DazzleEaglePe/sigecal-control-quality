-- Revoca los JWT previos al cambiar credenciales o permisos sin borrar históricos.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
