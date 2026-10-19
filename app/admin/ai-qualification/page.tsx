'use client';

import { useState, useCallback } from 'react';
import type { WaContact } from '@/lib/db/types';
import { KpiCards } from '@/app/dashboard/components/kpi-cards';
import { LeadPipeline } from '@/app/dashboard/components/lead-pipeline';
import { LeadActionModal } from '@/app/dashboard/components/lead-action-modal';
import { PairingModal } from '@/app/dashboard/components/pairing-modal';
import { Sparkles, RefreshCw, QrCode, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVisiblePolling } from '@/hooks/use-visible-polling';
import { SuggestionsPanel, type SuggestionRow, type ActiveLayby } from './suggestions-panel';

const DATA_POLL_MS = 30_000;
const STATUS_POLL_MS = 60_000;

export default function AiQualificationPage() {
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [totalMessagesCount, setTotalMessagesCount] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [activeLaybys, setActiveLaybys] = useState<ActiveLayby[]>([]);
  const [suggestionsHint, setSuggestionsHint] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<WaContact | null>(null);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    state: string;
    spaceReachable: boolean;
    latencyMs?: number;
  }>({
    connected: false,
    state: 'connecting',
    spaceReachable: true,
  });

  // Evolution API & gateway connection status
  const checkStatus = useCallback(async () => {
    setIsRefreshingStatus(true);
    try {
      const res = await fetch('/api/evolution/status', { cache: 'no-store' });
      const data = await res.json();
      setConnectionStatus({
        connected: Boolean(data.connected),
        state: data.state || 'close',
        spaceReachable: Boolean(data.spaceReachable),
        latencyMs: data.latencyMs,
      });
    } catch {
      setConnectionStatus({ connected: false, state: 'close', spaceReachable: false });
    } finally {
      setIsRefreshingStatus(false);
    }
  }, []);

  // Contacts + message count (server route, admin-only)
  const loadDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.contacts)) {
        setContacts(json.contacts as WaContact[]);
        if (typeof json.totalMessagesCount === 'number') setTotalMessagesCount(json.totalMessagesCount);
        // keep an open lead modal in sync with fresh AI data
        setSelectedContact((current) =>
          current ? (json.contacts as WaContact[]).find((c) => c.id === current.id) ?? current : current
        );
      }
    } catch (err) {
      console.warn('Could not query contacts:', err);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/suggestions', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setSuggestions((json.suggestions || []) as SuggestionRow[]);
      setActiveLaybys((json.laybys || []) as ActiveLayby[]);
      setSuggestionsHint(
        json.success === false
          ? 'AI suggestions are unavailable: run the latest Supabase migration (20261019000004) to enable them.'
          : null
      );
    } catch (err) {
      console.warn('Could not load suggestions:', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    void loadDashboardData();
    void loadSuggestions();
    void checkStatus();
  }, [loadDashboardData, loadSuggestions, checkStatus]);

  // Poll only while the tab is visible (replaces realtime + 10s polling)
  useVisiblePolling(() => {
    void loadDashboardData();
    void loadSuggestions();
  }, DATA_POLL_MS);
  useVisiblePolling(checkStatus, STATUS_POLL_MS);

  const qualifiedCount = contacts.filter(
    (c) => c.lead_status === 'QUALIFIED_LEAD' || c.lead_score >= 55
  ).length;

  const hotLeadsCount = contacts.filter(
    (c) => c.lead_status === 'HOT_LEAD' || (c.extracted_metadata?.urgency === 'HIGH' && c.lead_score >= 70)
  ).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3 text-foreground">
            <Sparkles className="h-7 w-7 text-primary" />
            AI Lead Qualification & WhatsApp Gateway
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI lead scoring, suggested database actions, live chat inspector, and WhatsApp gateway pairing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isRefreshingStatus} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsPairModalOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <QrCode className="h-4 w-4" />
            <span>Pair WhatsApp</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KpiCards
        totalMessages={totalMessagesCount}
        qualifiedCount={qualifiedCount}
        hotLeadsCount={hotLeadsCount}
        connectionStatus={connectionStatus}
        onOpenPairModal={() => setIsPairModalOpen(true)}
        onRefreshStatus={checkStatus}
        isRefreshing={isRefreshingStatus}
      />

      {/* AI suggested database actions (admin approves) */}
      <SuggestionsPanel
        suggestions={suggestions}
        laybys={activeLaybys}
        hint={suggestionsHint}
        onChanged={() => {
          void loadSuggestions();
          void loadDashboardData();
        }}
      />

      {/* AI Lead Pipeline Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Inbound Furniture Lead Stream & AI Scoring</h2>
          </div>
          <span className="text-xs text-muted-foreground">Auto-refreshes every 30 seconds</span>
        </div>

        <LeadPipeline
          contacts={contacts}
          selectedContactId={selectedContact?.id || null}
          onSelectContact={(contact) => setSelectedContact(contact)}
        />
      </div>

      {/* Lead Action & Stock Integration Modal */}
      {selectedContact && <LeadActionModal contact={selectedContact} onClose={() => setSelectedContact(null)} />}

      {/* Dual QR Code & 8-Digit Pairing Modal */}
      <PairingModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onSuccess={() => {
          void checkStatus();
        }}
      />
    </div>
  );
}
