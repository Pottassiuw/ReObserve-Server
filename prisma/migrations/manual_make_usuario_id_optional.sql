-- Make usuarioId optional in Lancamento table
-- This migration allows empresas to create lancamentos without a specific usuario

-- First, update the foreign key constraint to allow NULL
ALTER TABLE "Lancamento" DROP CONSTRAINT "Lancamento_usuarioId_fkey";

-- Make the column nullable
ALTER TABLE "Lancamento" ALTER COLUMN "usuarioId" DROP NOT NULL;

-- Add the foreign key constraint back with proper NULL handling
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_usuarioId_fkey" 
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;