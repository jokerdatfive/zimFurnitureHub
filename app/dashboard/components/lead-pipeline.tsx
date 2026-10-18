'use client';

import { useState, useMemo } from 'react';
import type { WaContact, LeadStatus } from '@/lib/db/types';
import Link from 'next/link';
import {
  Search,
  Filter,
  Flame,
  CheckCircle2,
  Boxes,
  ReceiptText,
  Handshake,
  MessageCircle,
  ExternalLink,
  DollarSign,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  User,
} from 'lucide-react';

interface LeadPipelineProps {
  contacts: WaContact[];
  selectedContactId: string | null;
  onSelectContact: (contact: WaContact) => void;
}

type SegmentFilter = 'ALL' | 'HOT' | 'STOCK' | 'LAYBY' | 'PROMISES' | 'SUPPORT';

export function LeadPipeline({
  contacts,
  selectedContactId,
  onSelectContact,
}: LeadPipelineProps) {
  const [activeSegment, setActiveSegment] = useState<SegmentFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Segment Analytics Counts
  const counts = useMemo(() => {
    let hot = 0;
    let stock = 0;
    let layby = 0;
    let promises = 0;
    let support = 0;

    contacts.forEach((c) => {
      const meta = c.extracted_metadata || {};
      if (c.lead_status === 'HOT_LEAD' || c.lead_score >= 75) hot++;
      if (meta.product_interest || meta.is_pending_order) stock++;
      if (meta.is_layby) layby++;
      if (meta.is_payment_promise) promises++;
      if (c.lead_status === 'SUPPORT') support++;
    });

    return { all: contacts.length, hot, stock, layby, promises, support };
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const meta = contact.extracted_metadata || {};

      // Segment check
      if (activeSegment === 'HOT') {
        if (contact.lead_status !== 'HOT_LEAD' && contact.lead_score < 75) return false;
      } else if (activeSegment === 'STOCK') {
        if (!meta.product_interest && !meta.is_pending_order) return false;
      } else if (activeSegment === 'LAYBY') {
        if (!meta.is_layby) return false;
      } else if (activeSegment === 'PROMISES') {
        if (!meta.is_payment_promise) return false;
      } else if (activeSegment === 'SUPPORT') {
        if (contact.lead_status !== 'SUPPORT') return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (contact.push_name || '').toLowerCase();
        const phone = contact.phone_number.toLowerCase();
        const summary = (contact.ai_summary || '').toLowerCase();
        const product = (meta.product_interest || '').toLowerCase();
        const location = (meta.delivery_location || '').toLowerCase();

        return (
          name.includes(q) ||
          phone.includes(q) ||
          summary.includes(q) ||
          product.includes(q) ||
          location.includes(q)
        );
      }

      return true;
    });
  }, [contacts, activeSegment, searchQuery]);

  const getStatusBadge = (status: LeadStatus, score: number) => {
    if (status === 'HOT_LEAD' || score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Hot Lead
        </span>
      );
    }
    if (status === 'QUALIFIED_LEAD' || score >= 55) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Qualified
        </span>
      );
    }
    if (status === 'SUPPORT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30">
          Support
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
        New Inquiry
      </span>
    );
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Data Analytics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Hot Leads</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{counts.hot}</span>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Ready to buy</span>
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Boxes className="w-4 h-4 text-emerald-500" />
            <span>Stock Inquiries</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{counts.stock}</span>
            <Link href="/admin/stock" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
              Stock <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ReceiptText className="w-4 h-4 text-purple-500" />
            <span>Layby Requests</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{counts.layby}</span>
            <Link href="/admin/layby" className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5">
              Laybys <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Handshake className="w-4 h-4 text-amber-500" />
            <span>Payment Promises</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{counts.promises}</span>
            <Link href="/admin/promises" className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5">
              Promises <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Interactive Segment Filters & Search */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
        {/* Horizontal scrollable segment pills (mobile-first) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveSegment('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSegment === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            All Leads ({counts.all})
          </button>

          <button
            onClick={() => setActiveSegment('HOT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSegment === 'HOT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Hot Leads ({counts.hot})
          </button>

          <button
            onClick={() => setActiveSegment('STOCK')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSegment === 'STOCK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            Stock / Furniture ({counts.stock})
          </button>

          <button
            onClick={() => setActiveSegment('LAYBY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSegment === 'LAYBY'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            Layby Plans ({counts.layby})
          </button>

          <button
            onClick={() => setActiveSegment('PROMISES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSegment === 'PROMISES'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            Promises ({counts.promises})
          </button>

          <button
            onClick={() => setActiveSegment('SUPPORT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSegment === 'SUPPORT'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-500/10 text-sky-800 dark:text-sky-300 hover:bg-sky-500/20'
            }`}
          >
            Support ({counts.support})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, furniture piece, or suburb..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>
      </div>

      {/* 3. Mobile-First Qualified Leads Cards (Clean, High-Contrast, Action-Oriented) */}
      {filteredContacts.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <div className="inline-flex p-3 rounded-2xl bg-secondary text-muted-foreground mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">No Qualified Leads in This Segment</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? 'No leads matched your search query. Try clearing your search.'
              : 'New WhatsApp customer inquiries will be automatically scored, segmented, and linked to stock here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredContacts.map((contact) => {
            const isSelected = contact.id === selectedContactId;
            const meta = contact.extracted_metadata || {};
            const cleanPhone = contact.phone_number.replace(/\D/g, '');

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`bg-card border text-card-foreground rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {/* Header: Customer Profile & AI Score */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                        {contact.push_name ? contact.push_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground leading-tight">
                          {contact.push_name || 'Prospect'}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          +{contact.phone_number}
                        </p>
                      </div>
                    </div>

                    {/* AI Score Badge */}
                    <div
                      className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg border font-mono font-black text-xs shrink-0 ${
                        contact.lead_score >= 80
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : contact.lead_score >= 55
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-secondary text-foreground border-border'
                      }`}
                    >
                      <span className="text-[10px] text-muted-foreground font-sans font-semibold">Score</span>
                      <span>{contact.lead_score}</span>
                    </div>
                  </div>

                  {/* Status & Timing */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(contact.lead_status, contact.lead_score)}
                      {meta.urgency === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(contact.last_message_at)}
                    </span>
                  </div>

                  {/* AI 1-Line Summary */}
                  <div className="mt-3 bg-secondary/40 border border-border/80 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary mb-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>AI Intelligence Summary</span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {contact.ai_summary || 'Customer initiated contact on WhatsApp. Tap to qualify.'}
                    </p>
                  </div>

                  {/* Retail Criteria Chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {meta.product_interest && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        🛋️ {meta.product_interest}
                      </span>
                    )}

                    {meta.budget && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        💰 Budget: {meta.budget}
                      </span>
                    )}

                    {meta.payment_method && meta.payment_method !== 'Not_Specified' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        💳 {meta.payment_method}
                      </span>
                    )}

                    {meta.delivery_location && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border">
                        <MapPin className="w-3 h-3" /> {meta.delivery_location}
                      </span>
                    )}

                    {meta.is_layby && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        Layby Plan
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  {/* Direct WhatsApp Mobile Launcher */}
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Lead Stock Action Modal Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectContact(contact);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
                  >
                    <span>View Actions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
