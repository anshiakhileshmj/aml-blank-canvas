-- Add missing columns to transactions table for enhanced relay API data
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS client_ip TEXT,
ADD COLUMN IF NOT EXISTS geo_data JSONB,
ADD COLUMN IF NOT EXISTS raw_tx_data TEXT,
ADD COLUMN IF NOT EXISTS gas_price NUMERIC,
ADD COLUMN IF NOT EXISTS gas_limit NUMERIC,
ADD COLUMN IF NOT EXISTS transaction_size INTEGER,
ADD COLUMN IF NOT EXISTS is_contract_interaction BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add index for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_transactions_client_ip ON public.transactions(client_ip);
CREATE INDEX IF NOT EXISTS idx_transactions_geo_data ON public.transactions USING GIN(geo_data);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency_key ON public.transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transactions_is_contract ON public.transactions(is_contract_interaction);

-- Add constraint to prevent duplicate idempotency keys per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_idempotency 
ON public.transactions(user_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;