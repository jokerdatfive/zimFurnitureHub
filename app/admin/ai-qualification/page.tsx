'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WaContact } from '@/lib/db/types';
import { supabaseClient } from '@/lib/db/supabase-client';
import { KpiCards } from '@/app/dashboard/components/kpi-cards';
import { LeadPipeline } from '@/app/dashboard/components/lead-pipeline';
import { LeadActionModal } from '@/app/dashboard/components/lead-action-modal';
import { PairingModal } from '@/app/dashboard/components/pairing-modal';
import { Sparkles, RefreshCw, QrCode, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AiQualificationPage() {
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [totalMessagesCount, setTotalMessagesCount] = useState<number>(0);
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

  // 1. Fetch Evolution API & Gateway connection status
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
      setConnectionStatus({
        connected: false,
        state: 'close',
        spaceReachable: false,
      });
    } finally {
      setIsRefreshingStatus(false);
    }
  }, []);

  // 2. Fetch Initial Contacts & Message Counts
  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Prioritize reliable server API route
      const res = await fetch('/api/admin/contacts', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.contacts)) {
          setContacts(json.contacts as WaContact[]);
          if (typeof json.totalMessagesCount === 'number') {
            setTotalMessagesCount(json.totalMessagesCount);
          }
          return;
        }
      }

      // 2. Fallback to direct client query
      const { data: contactsData, error: contactsError } = await supabaseClient
        .from('wa_contacts')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (!contactsError && contactsData) {
        setContacts(contactsData as WaContact[]);
      }

      const { count, error: countError } = await supabaseClient
        .from('wa_messages')
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) {
        setTotalMessagesCount(count);
      }
    } catch (err) {
      console.warn('Could not query contacts:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    checkStatus();

    // Poll status and dashboard data regularly for instant updates
    const interval = setInterval(() => {
      checkStatus();
      loadDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadDashboardData, checkStatus]);

  // 3. Supabase Realtime Subscriptions for wa_contacts
  useEffect(() => {
    try {
      const channel = supabaseClient
        .channel('realtime:wa_contacts_ai_qualification')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'wa_contacts' },
          (payload) => {
            const newContact = payload.new as WaContact;
            setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== newContact.id)]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'wa_contacts' },
          (payload) => {
            const updatedContact = payload.new as WaContact;
            setContacts((prev) =>
              prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
            );
            setSelectedContact((current) =>
              current?.id === updatedContact.id ? updatedContact : current
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'wa_messages' },
          () => {
            setTotalMessagesCount((prev) => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabaseClient.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime channel error:', err);
    }
  }, []);

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
            Real-time AI qualification, BANT scoring, live chat inspector, and WhatsApp gateway pairing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadDashboardData();
              checkStatus();
            }}
            disabled={isRefreshingStatus}
            className="gap-2"
          >
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

      {/* AI Lead Pipeline Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Inbound Furniture Lead Stream & AI Scoring
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Live updates synchronized via Supabase WebSocket
          </span>
        </div>

        <LeadPipeline
          contacts={contacts}
          selectedContactId={selectedContact?.id || null}
          onSelectContact={(contact) => setSelectedContact(contact)}
        />
      </div>

      {/* Lead Action & Stock Integration Modal */}
      {selectedContact && (
        <LeadActionModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}

      {/* Dual QR Code & 8-Digit Pairing Modal */}
      <PairingModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onSuccess={() => {
          checkStatus();
        }}
      />
    </div>
  );
}
