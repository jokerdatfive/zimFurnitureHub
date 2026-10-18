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
      <div className="relative overflow-hidden p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Inbound Messages</span>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono">
            {totalMessages.toLocaleString()}
          </span>
          <span className="text-xs text-blue-400/80 font-medium">Logged & Streamed</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Supabase Realtime synchronized
        </p>
      </div>

      {/* 2. Qualified Leads */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Qualified Furniture Leads</span>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono">
            {qualifiedCount.toLocaleString()}
          </span>
          <span className="text-xs text-indigo-400/80 font-medium">Score &ge; 55</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Evaluated via Vercel AI SDK
        </p>
      </div>

      {/* 3. Hot Leads Requiring Action */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-slate-900/70 border border-rose-500/20 shadow-lg backdrop-blur-md bg-gradient-to-b from-rose-950/20 to-slate-900/70">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-rose-300">Hot Leads (Urgent)</span>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-rose-400 font-mono">
            {hotLeadsCount.toLocaleString()}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium">
            Immediate Action
          </span>
        </div>
        <p className="mt-1 text-xs text-rose-400/70">
          High purchase intent / immediate order
        </p>
      </div>

      {/* 4. WhatsApp Instance Connection Status */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Evolution Gateway</span>
            <button
              onClick={onRefreshStatus}
              title="Refresh connection status"
              className="text-slate-500 hover:text-white transition p-1 rounded-md"
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
            <span className={`text-base font-semibold ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isConnected ? 'WhatsApp Connected' : 'Pairing Required'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            <span>HF Space: {connectionStatus.spaceReachable ? 'Running' : 'Sleeping/Booting'}</span>
            {connectionStatus.latencyMs ? <span>({connectionStatus.latencyMs}ms)</span> : null}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={onOpenPairModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-600/40 rounded-xl transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            {isConnected ? 'Re-Pair WhatsApp' : 'Get 8-Digit Pairing Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
