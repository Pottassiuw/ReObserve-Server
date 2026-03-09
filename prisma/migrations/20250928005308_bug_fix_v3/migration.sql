-- DropForeignKey
ALTER TABLE "public"."Usuario" DROP CONSTRAINT "Usuario_grupoId_fkey";

-- AlterTable
ALTER TABLE "public"."Usuario" ALTER COLUMN "grupoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "public"."Grupo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
