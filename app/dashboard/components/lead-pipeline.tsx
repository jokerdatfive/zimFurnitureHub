'use client';

import { useState } from 'react';
import type { WaContact, LeadStatus } from '@/lib/db/types';
import {
  Search,
  Filter,
  DollarSign,
  Clock,
  Briefcase,
  Flame,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  User,
} from 'lucide-react';

interface LeadPipelineProps {
  contacts: WaContact[];
  selectedContactId: string | null;
  onSelectContact: (contact: WaContact) => void;
}

export function LeadPipeline({
  contacts,
  selectedContactId,
  onSelectContact,
}: LeadPipelineProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | LeadStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering logic
  const filteredContacts = contacts.filter((contact) => {
    if (activeFilter !== 'ALL' && contact.lead_status !== activeFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (contact.push_name || '').toLowerCase();
      const phone = contact.phone_number.toLowerCase();
      const summary = (contact.ai_summary || '').toLowerCase();
      const product = (contact.extracted_metadata?.product_interest || '').toLowerCase();

      return name.includes(q) || phone.includes(q) || summary.includes(q) || product.includes(q);
    }

    return true;
  });

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'HOT_LEAD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Flame className="w-3 h-3 text-rose-400" /> Hot Lead
          </span>
        );
      case 'QUALIFIED_LEAD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Qualified
          </span>
        );
      case 'SUPPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <HelpCircle className="w-3 h-3 text-sky-400" /> Support
          </span>
        );
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
            New
          </span>
        );
      case 'SPAM':
      case 'IRRELEVANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/40 text-red-400 border border-red-800/40">
            Spam
          </span>
        );
    }
  };

  const getUrgencyPill = (urgency?: string | null) => {
    if (!urgency) return null;
    const u = urgency.toUpperCase();
    if (u === 'HIGH') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
          URGENT
        </span>
      );
    }
    if (u === 'MEDIUM') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Med Urgency
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400">
        Low Urgency
      </span>
    );
  };

  const formatRelativeTime = (isoString: string) => {
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
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Filters & Search Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeFilter === 'ALL'
                ? 'bg-slate-100 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Leads ({contacts.length})
          </button>
          <button
            onClick={() => setActiveFilter('HOT_LEAD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'HOT_LEAD'
                ? 'bg-rose-500 text-white font-semibold shadow-lg shadow-rose-900/40'
                : 'text-rose-400 hover:bg-rose-950/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Hot Leads ({contacts.filter((c) => c.lead_status === 'HOT_LEAD').length})
          </button>
          <button
            onClick={() => setActiveFilter('QUALIFIED_LEAD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'QUALIFIED_LEAD'
                ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/40'
                : 'text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Qualified ({contacts.filter((c) => c.lead_status === 'QUALIFIED_LEAD').length})
          </button>
          <button
            onClick={() => setActiveFilter('SUPPORT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'SUPPORT'
                ? 'bg-sky-600 text-white font-semibold shadow-lg shadow-sky-900/40'
                : 'text-sky-400 hover:bg-sky-950/40'
            }`}
          >
            Support ({contacts.filter((c) => c.lead_status === 'SUPPORT').length})
          </button>
          <button
            onClick={() => setActiveFilter('SPAM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeFilter === 'SPAM'
                ? 'bg-red-600 text-white font-semibold'
                : 'text-red-400 hover:bg-red-950/40'
            }`}
          >
            Spam ({contacts.filter((c) => c.lead_status === 'SPAM' || c.lead_status === 'IRRELEVANT').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, phone, furniture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
          />
        </div>
      </div>

      {/* Leads Table */}
      {filteredContacts.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800/60 text-slate-400 mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No WhatsApp Leads Found</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No leads matched your query. Try clearing the search term.'
              : 'Incoming WhatsApp messages will appear here and be qualified automatically by the AI agent.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Contact & Lead</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Status & Urgency</th>
                <th className="py-3.5 px-4">AI 1-Line Summary & Needs</th>
                <th className="py-3.5 px-4">Extracted Tags</th>
                <th className="py-3.5 px-4 text-right">Last Active</th>
                <th className="py-3.5 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContacts.map((contact) => {
                const isSelected = contact.id === selectedContactId;
                const meta = contact.extracted_metadata || {};

                return (
                  <tr
                    key={contact.id}
                    onClick={() => onSelectContact(contact)}
                    className={`cursor-pointer transition group ${
                      isSelected
                        ? 'bg-slate-800/90'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Contact Profile */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                          {contact.push_name ? contact.push_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-emerald-400 transition">
                            {contact.push_name || 'Anonymous Customer'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            +{contact.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* AI Score */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg font-mono font-bold text-xs border ${
                            contact.lead_score >= 80
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                              : contact.lead_score >= 55
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                              : contact.lead_score >= 30
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {contact.lead_score}
                        </div>
                      </div>
                    </td>

                    {/* Status & Urgency */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(contact.lead_status)}
                        {getUrgencyPill(meta.urgency)}
                      </div>
                    </td>

                    {/* AI Summary */}
                    <td className="py-4 px-4 max-w-xs md:max-w-sm">
                      <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                        {contact.ai_summary || (
                          <span className="text-slate-500 italic">Awaiting AI qualification...</span>
                        )}
                      </p>
                    </td>

                    {/* Extracted Tags */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {meta.budget && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-mono">
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            {meta.budget}
                          </span>
                        )}
                        {meta.product_interest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                            <Briefcase className="w-3 h-3 text-indigo-400" />
                            {meta.product_interest}
                          </span>
                        )}
                        {meta.timeline && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {meta.timeline}
                          </span>
                        )}
                        {!meta.budget && !meta.product_interest && !meta.timeline && (
                          <span className="text-slate-600 text-[11px]">&mdash;</span>
                        )}
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="py-4 px-4 text-right text-slate-400 font-mono whitespace-nowrap">
                      {formatRelativeTime(contact.last_message_at)}
                    </td>

                    {/* Arrow */}
                    <td className="py-4 px-4 text-slate-500 group-hover:text-white transition">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
