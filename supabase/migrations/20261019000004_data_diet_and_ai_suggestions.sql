-- ==============================================================================
-- Data diet + AI suggested actions
--  1. Shrink wa_messages (drop raw_payload), stop realtime row-streaming load
--  2. Remove public (anon) read access to customer chats
--  3. Replace redundant indexes with one covering index
--  4. Link laybys / promises to wa_contacts (the table the Evolution flow fills)
--  5. ai_suggestions: AI proposes DB actions, admin approves
--  6. prune_whatsapp_data(): retention job called by /api/cron/prune
-- Safe to re-run.
-- ==============================================================================

-- 1. ------------------------------------------------------------------ SHRINK
-- raw_payload held the full Baileys JSON (thumbnails, keys, context info). The
-- extracted text lives in `content`, so the raw blob is pure bloat.
ALTER TABLE public.wa_messages DROP COLUMN IF EXISTS raw_payload;

-- REPLICA IDENTITY FULL writes the whole old row to WAL on every UPDATE and
-- makes realtime heavy. The admin UI now polls, so realtime is not needed.
ALTER TABLE public.wa_contacts REPLICA IDENTITY DEFAULT;
ALTER TABLE public.wa_messages REPLICA IDENTITY DEFAULT;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication_tables
               WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wa_contacts') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.wa_contacts;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_publication_tables
               WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wa_messages') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.wa_messages;
    END IF;
END $$;

-- 2. ---------------------------------------------------------------- SECURITY
-- These policies let anyone holding the (public) anon key read every chat.
-- The admin UI reads through authenticated server routes using the service role.
DROP POLICY IF EXISTS "Dashboard read access on wa_contacts" ON public.wa_contacts;
DROP POLICY IF EXISTS "Dashboard read access on wa_messages" ON public.wa_messages;

-- 3. ----------------------------------------------------------------- INDEXES
-- remote_jid and evolution_message_id are UNIQUE (already indexed). The others
-- are redundant or low-selectivity and cost write CPU on every message.
DROP INDEX IF EXISTS public.idx_wa_contacts_remote_jid;
DROP INDEX IF EXISTS public.idx_wa_messages_evolution_id;
DROP INDEX IF EXISTS public.idx_wa_messages_ai_processed;
DROP INDEX IF EXISTS public.idx_wa_messages_created_at;
DROP INDEX IF EXISTS public.idx_wa_messages_contact_id;
CREATE INDEX IF NOT EXISTS idx_wa_messages_contact_created
    ON public.wa_messages (contact_id, created_at DESC);

-- 4. ------------------------------------------------------------ LINK TO WA_CONTACTS
-- layby_agreements.contact_id / promises.contact_id point at the legacy
-- whatsapp_contacts table, so AI/Evolution contacts could never be linked.
ALTER TABLE public.layby_agreements
    ADD COLUMN IF NOT EXISTS wa_contact_id UUID REFERENCES public.wa_contacts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS customer_phone TEXT;

ALTER TABLE public.promises
    ADD COLUMN IF NOT EXISTS wa_contact_id UUID REFERENCES public.wa_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_layby_wa_contact ON public.layby_agreements (wa_contact_id);
CREATE INDEX IF NOT EXISTS idx_promises_wa_contact ON public.promises (wa_contact_id);

-- 5. ------------------------------------------------------------ AI SUGGESTIONS
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.wa_contacts(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES public.wa_messages(id) ON DELETE SET NULL,
    kind TEXT NOT NULL CHECK (kind IN ('PAYMENT_CONFIRMED', 'LAYBY_REQUEST', 'PROMISE', 'ORDER')),
    title TEXT NOT NULL,
    detail TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPLIED', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status_created
    ON public.ai_suggestions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_contact_kind
    ON public.ai_suggestions (contact_id, kind) WHERE status = 'PENDING';

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on ai_suggestions" ON public.ai_suggestions;
CREATE POLICY "Service role full access on ai_suggestions"
    ON public.ai_suggestions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. ----------------------------------------------------------------- RETENTION
-- Chats of IRRELEVANT / SPAM contacts: keep `keep_days` (default 14).
-- Everything else: keep 120 days. Contact summaries / scores are never deleted
-- for real leads. Legacy webhook rows and resolved suggestions are trimmed too.
CREATE OR REPLACE FUNCTION public.prune_whatsapp_data(keep_days INTEGER DEFAULT 14)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    n_noise_msgs   BIGINT := 0;
    n_old_msgs     BIGINT := 0;
    n_contacts     BIGINT := 0;
    n_raw_events   BIGINT := 0;
    n_suggestions  BIGINT := 0;
BEGIN
    DELETE FROM public.wa_messages m
    USING public.wa_contacts c
    WHERE m.contact_id = c.id
      AND c.lead_status IN ('IRRELEVANT', 'SPAM')
      AND m.created_at < now() - make_interval(days => keep_days);
    GET DIAGNOSTICS n_noise_msgs = ROW_COUNT;

    DELETE FROM public.wa_messages WHERE created_at < now() - interval '120 days';
    GET DIAGNOSTICS n_old_msgs = ROW_COUNT;

    DELETE FROM public.wa_contacts c
    WHERE c.lead_status IN ('IRRELEVANT', 'SPAM')
      AND c.last_message_at < now() - make_interval(days => keep_days)
      AND NOT EXISTS (SELECT 1 FROM public.wa_messages m WHERE m.contact_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM public.layby_agreements l WHERE l.wa_contact_id = c.id);
    GET DIAGNOSTICS n_contacts = ROW_COUNT;

    IF to_regclass('public.whatsapp_raw_events') IS NOT NULL THEN
        DELETE FROM public.whatsapp_raw_events WHERE received_at < now() - interval '7 days';
        GET DIAGNOSTICS n_raw_events = ROW_COUNT;
    END IF;

    DELETE FROM public.ai_suggestions
    WHERE status <> 'PENDING' AND resolved_at < now() - interval '60 days';
    GET DIAGNOSTICS n_suggestions = ROW_COUNT;

    RETURN jsonb_build_object(
        'noise_messages_deleted', n_noise_msgs,
        'old_messages_deleted', n_old_msgs,
        'contacts_deleted', n_contacts,
        'raw_events_deleted', n_raw_events,
        'suggestions_deleted', n_suggestions
    );
END;
$$;

REVOKE ALL ON FUNCTION public.prune_whatsapp_data(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_whatsapp_data(INTEGER) TO service_role;
