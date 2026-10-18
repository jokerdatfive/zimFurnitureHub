'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WaContact } from '@/lib/db/types';
import { supabaseClient } from '@/lib/db/supabase-client';
import { KpiCards } from './components/kpi-cards';
import { LeadPipeline } from './components/lead-pipeline';
import { ChatInspector } from './components/chat-inspector';
import { PairingModal } from './components/pairing-modal';
import { MessageSquareText, Sparkles, RefreshCw, Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
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

  // 1. Fetch Evolution API & HF Space connection status
  const checkStatus = useCallback(async () => {
    setIsRefreshingStatus(true);
    try {
      const res = await fetch('/api/evolution/status');
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
  }, []);

  useEffect(() => {
    loadDashboardData();
    checkStatus();

    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData, checkStatus]);

  // 3. Supabase Realtime Subscriptions for wa_contacts
  useEffect(() => {
    const channel = supabaseClient
      .channel('realtime:wa_contacts_dashboard')
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
  }, []);

  const qualifiedCount = contacts.filter(
    (c) => c.lead_status === 'QUALIFIED_LEAD' || c.lead_score >= 55
  ).length;

  const hotLeadsCount = contacts.filter(
    (c) => c.lead_status === 'HOT_LEAD' || (c.extracted_metadata?.urgency === 'HIGH' && c.lead_score >= 70)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Return to Main Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                KK Furnitures WhatsApp AI Platform
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                $0 STACK
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Evolution API v2 &bull; Hugging Face Space &bull; Supabase Realtime &bull; Vercel AI SDK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadDashboardData();
              checkStatus();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsPairModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pair WhatsApp</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
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
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                Inbound Furniture Lead Stream & AI Scoring
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Live updates enabled via Supabase WebSocket
            </span>
          </div>

          <LeadPipeline
            contacts={contacts}
            selectedContactId={selectedContact?.id || null}
            onSelectContact={(contact) => setSelectedContact(contact)}
          />
        </div>
      </main>

      {/* Slide-Over Chat Inspector */}
      {selectedContact && (
        <ChatInspector
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onContactUpdated={loadDashboardData}
        />
      )}

      {/* Self-Service Pairing Modal */}
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
