-- ==============================================================================
-- Module 2: WhatsApp AI Lead Qualification & Analytics Platform Migration
-- Location: C:\Users\Joseph Nzvere\Documents\KK furnitures\zimFurnitureHub
-- ==============================================================================

-- 1. ISOLATE EVOLUTION API INTERNAL TABLES
-- Evolution API v2 connects with `?schema=evolution` to prevent table pollution
CREATE SCHEMA IF NOT EXISTS evolution;
GRANT ALL ON SCHEMA evolution TO postgres, service_role;

-- 2. CREATE ENUMS
DO $$ BEGIN
    CREATE TYPE lead_status_enum AS ENUM (
        'NEW',
        'QUALIFIED_LEAD',
        'HOT_LEAD',
        'SUPPORT',
        'SPAM',
        'IRRELEVANT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level_enum AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CREATE TABLE: wa_contacts
CREATE TABLE IF NOT EXISTS public.wa_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remote_jid TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    push_name TEXT,
    lead_status lead_status_enum NOT NULL DEFAULT 'NEW',
    lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    ai_summary TEXT,
    extracted_metadata JSONB NOT NULL DEFAULT '{
        "budget": null,
        "product_interest": null,
        "urgency": null,
        "location": null,
        "timeline": null,
        "action_required": null
    }'::jsonb,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast dashboard sorting and filtering
CREATE INDEX IF NOT EXISTS idx_wa_contacts_remote_jid ON public.wa_contacts (remote_jid);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_lead_status ON public.wa_contacts (lead_status);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_lead_score ON public.wa_contacts (lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_last_message_at ON public.wa_contacts (last_message_at DESC);

-- 4. CREATE TABLE: wa_messages
CREATE TABLE IF NOT EXISTS public.wa_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evolution_message_id TEXT NOT NULL UNIQUE,
    contact_id UUID NOT NULL REFERENCES public.wa_contacts(id) ON DELETE CASCADE,
    from_me BOOLEAN NOT NULL DEFAULT false,
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    raw_payload JSONB,
    ai_processed BOOLEAN NOT NULL DEFAULT false,
    intent TEXT,
    urgency urgency_level_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for chat thread queries and chronological streams
CREATE INDEX IF NOT EXISTS idx_wa_messages_contact_id ON public.wa_messages (contact_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_evolution_id ON public.wa_messages (evolution_message_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_created_at ON public.wa_messages (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_ai_processed ON public.wa_messages (ai_processed);

-- 5. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_wa_contacts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_wa_contacts_timestamp ON public.wa_contacts;
CREATE TRIGGER trigger_update_wa_contacts_timestamp
    BEFORE UPDATE ON public.wa_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_wa_contacts_timestamp();

-- 6. ENABLE SUPABASE REALTIME STREAMING
ALTER TABLE public.wa_contacts REPLICA IDENTITY FULL;
ALTER TABLE public.wa_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'wa_contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_contacts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'wa_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_messages;
    END IF;
END $$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;

-- Allow full access to backend service role (Webhooks & AI Agent)
DROP POLICY IF EXISTS "Service role full access on wa_contacts" ON public.wa_contacts;
CREATE POLICY "Service role full access on wa_contacts" 
    ON public.wa_contacts 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on wa_messages" ON public.wa_messages;
CREATE POLICY "Service role full access on wa_messages" 
    ON public.wa_messages 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Allow authenticated users and anon read access for dashboard
DROP POLICY IF EXISTS "Dashboard read access on wa_contacts" ON public.wa_contacts;
CREATE POLICY "Dashboard read access on wa_contacts" 
    ON public.wa_contacts 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Dashboard read access on wa_messages" ON public.wa_messages;
CREATE POLICY "Dashboard read access on wa_messages" 
    ON public.wa_messages 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);
