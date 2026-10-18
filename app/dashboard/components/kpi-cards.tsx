'use client';

import {
  MessageSquare,
  Sparkles,
  Flame,
  QrCode,
  RotateCcw,
} from 'lucide-react';

interface KpiCardsProps {
  totalMessages: number;
  qualifiedCount: number;
  hotLeadsCount: number;
  connectionStatus: {
    connected: boolean;
    state: string;
    spaceReachable: boolean;
    latencyMs?: number;
  };
  onOpenPairModal: () => void;
  onRefreshStatus: () => void;
  isRefreshing?: boolean;
}

export function KpiCards({
  totalMessages,
  qualifiedCount,
  hotLeadsCount,
  connectionStatus,
  onOpenPairModal,
  onRefreshStatus,
  isRefreshing = false,
}: KpiCardsProps) {
  const isConnected = connectionStatus.connected && connectionStatus.state === 'open';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Inbound Messages */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Inbound Messages</span>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
            {totalMessages.toLocaleString()}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Logged & Streamed</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Supabase Realtime synchronized
        </p>
      </div>

      {/* 2. Qualified Leads */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qualified Furniture Leads</span>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
            {qualifiedCount.toLocaleString()}
          </span>
          <span className="text-xs text-primary font-medium">Score &ge; 55</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Evaluated via Vercel AI SDK
        </p>
      </div>

      {/* 3. Hot Leads Requiring Action */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-rose-500/30 shadow-sm bg-gradient-to-b from-rose-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Hot Leads (Urgent)</span>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
            {hotLeadsCount.toLocaleString()}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
            Immediate Action
          </span>
        </div>
        <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400/80">
          High purchase intent / immediate order
        </p>
      </div>

      {/* 4. WhatsApp Instance Connection Status */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp Gateway</span>
            <button
              onClick={onRefreshStatus}
              title="Refresh connection status"
              className="text-muted-foreground hover:text-foreground transition p-1 rounded-md hover:bg-secondary"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              )}
            </span>
            <span className={`text-base font-semibold ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isConnected ? 'WhatsApp Connected' : 'Pairing Required'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Gateway: {connectionStatus.spaceReachable ? 'Online' : 'Reconnecting'}</span>
            {connectionStatus.latencyMs ? <span>({connectionStatus.latencyMs}ms)</span> : null}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <button
            onClick={onOpenPairModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 rounded-xl transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            {isConnected ? 'Re-Pair WhatsApp' : 'Link / Pair WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
