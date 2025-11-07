-- DropForeignKey
ALTER TABLE "public"."Lancamento" DROP CONSTRAINT "Lancamento_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Lancamento" ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
