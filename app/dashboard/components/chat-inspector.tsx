'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WaContact, WaMessage } from '@/lib/db/types';
import { useVisiblePolling } from '@/hooks/use-visible-polling';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Flame,
  Clock,
  DollarSign,
  Briefcase,
  ExternalLink,
  MessageCircle,
  Bot,
  User,
} from 'lucide-react';

interface ChatInspectorProps {
  contact: WaContact | null;
  onClose: () => void;
  onContactUpdated?: () => void;
}

export function ChatInspector({
  contact,
  onClose,
  onContactUpdated,
}: ChatInspectorProps) {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'reasoning'>('chat');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load this thread on open, then refresh every 15s while the tab is visible
  const contactId = contact?.id;
  const loadThread = useCallback(async () => {
    if (!contactId) return;
    try {
      const res = await fetch(`/api/admin/contacts?contactId=${encodeURIComponent(contactId)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.messages)) {
        setMessages((prev) => {
          const next = json.messages as WaMessage[];
          const grew = next.length !== prev.length;
          if (grew) setTimeout(scrollToBottom, 100);
          return grew || next.some((m, i) => m.ai_processed !== prev[i]?.ai_processed) ? next : prev;
        });
      }
    } catch {}
    setLoadingMessages(false);
  }, [contactId]);

  useEffect(() => {
    setMessages([]);
    setLoadingMessages(Boolean(contactId));
  }, [contactId]);

  useVisiblePolling(loadThread, 15_000, Boolean(contactId));

  if (!contact) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      const res = await fetch('/api/evolution/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          phoneNumber: contact.phone_number,
          message: textToSend,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send WhatsApp message');
      }

      void loadThread();
      if (onContactUpdated) onContactUpdated();
    } catch (err: any) {
      alert(`Send Error: ${err.message}`);
      setReplyText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const meta = contact.extracted_metadata || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Slide-Over Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow">
              {contact.push_name ? contact.push_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">
                  {contact.push_name || 'Anonymous Contact'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SCORE: {contact.lead_score}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                +{contact.phone_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${contact.phone_number}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open WhatsApp Web directly"
              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-xl transition"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === 'chat'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Live Chat Thread ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('reasoning')}
            className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === 'reasoning'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Reasoning & BANT Breakdown
          </button>
        </div>

        {/* Tab 1: Live Chat Thread */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-40 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No messages logged yet for this contact.
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.from_me;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                          isOutbound
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content || '[Media Message]'}</p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            isOutbound ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isOutbound && <span>✓✓</span>}
                        </div>
                      </div>

                      {msg.intent && !isOutbound && (
                        <span className="mt-1 text-[10px] text-indigo-400/90 font-medium px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/30">
                          Intent: {msg.intent} {msg.urgency ? `• Urgency: ${msg.urgency}` : ''}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Outbound Reply Input */}
            <form
              onSubmit={handleSendReply}
              className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Reply as KK Furnitures sales rep..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
                className="flex-1 px-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: AI Reasoning & BANT Breakdown */}
        {activeTab === 'reasoning' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
            {/* Score Overview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">Lead Qualification Score</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {contact.lead_score} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    contact.lead_score >= 80
                      ? 'bg-rose-500'
                      : contact.lead_score >= 55
                      ? 'bg-emerald-500'
                      : contact.lead_score >= 30
                      ? 'bg-amber-500'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${contact.lead_score}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-slate-500">
                <span>0 (Spam)</span>
                <span>55 (Qualified)</span>
                <span>100 (Immediate Cash/Layby)</span>
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Bot className="w-4 h-4" />
                AI Executive Summary
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {contact.ai_summary || 'No AI summary generated yet. Send an inbound message to evaluate.'}
              </p>
            </div>

            {/* Action Required Banner */}
            {meta.action_required && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-rose-400">
                  <Flame className="w-4 h-4" /> Recommended Action for KK Furnitures Rep
                </div>
                <p className="text-xs leading-relaxed">{meta.action_required}</p>
              </div>
            )}

            {/* Retail Order & Layby Intelligence */}
            {(meta.is_layby || meta.is_pending_order || meta.is_payment_promise || meta.payment_method) && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Retail Transaction Detection
                  </span>
                  {meta.is_layby && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                      Layby Agreement
                    </span>
                  )}
                  {meta.is_pending_order && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      Pending Order
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {meta.agreed_price && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total Price:</span>
                      <span className="font-bold text-white font-mono">${meta.agreed_price}</span>
                    </div>
                  )}
                  {meta.deposit_amount && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Deposit Offered:</span>
                      <span className="font-bold text-emerald-400 font-mono">${meta.deposit_amount}</span>
                    </div>
                  )}
                  {meta.payment_method && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Payment Method:</span>
                      <span className="font-medium text-white">{meta.payment_method}</span>
                    </div>
                  )}
                  {meta.delivery_location && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Delivery To:</span>
                      <span className="font-medium text-white">{meta.delivery_location}</span>
                    </div>
                  )}
                </div>

                {meta.is_layby && (
                  <div className="pt-1">
                    <a
                      href="/admin/layby"
                      className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 underline font-medium"
                    >
                      View & Manage in Layby Agreement Board &rarr;
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* BANT Framework Matrix */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Extracted BANT Metadata
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Budget / Layby
                  </span>
                  <div className="mt-1 font-semibold text-white">
                    {meta.budget || <span className="text-slate-600 font-normal">Not stated</span>}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" /> Delivery Timeline
                  </span>
                  <div className="mt-1 font-semibold text-white">
                    {meta.timeline || <span className="text-slate-600 font-normal">Flexible / Not stated</span>}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Furniture Interest
                  </span>
                  <div className="mt-1 font-semibold text-white">
                    {meta.product_interest || <span className="text-slate-600 font-normal">General catalog inquiry</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action */}
            <div className="pt-2">
              <a
                href={`https://wa.me/${contact.phone_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-950/50"
              >
                <ExternalLink className="w-4 h-4" /> Open in WhatsApp Web / Desktop
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
