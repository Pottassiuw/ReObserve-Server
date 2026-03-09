-- DropForeignKey
ALTER TABLE "public"."Lancamento" DROP CONSTRAINT "Lancamento_periodoId_fkey";

-- AlterTable
ALTER TABLE "public"."Lancamento" ALTER COLUMN "periodoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Lancamento" ADD CONSTRAINT "Lancamento_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "public"."Periodo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
