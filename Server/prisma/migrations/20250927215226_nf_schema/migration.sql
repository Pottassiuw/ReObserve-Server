-- DropIndex
DROP INDEX "public"."Usuario_grupoId_key";

-- AlterTable
ALTER TABLE "public"."NotaFiscal" ADD COLUMN     "xmlPath" TEXT,
ALTER COLUMN "nome_emitente" DROP NOT NULL,
ALTER COLUMN "descricao" DROP NOT NULL;
