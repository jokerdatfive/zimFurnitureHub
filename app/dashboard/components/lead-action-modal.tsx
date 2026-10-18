'use client';

import type { WaContact } from '@/lib/db/types';
import Link from 'next/link';
import {
  X,
  MessageCircle,
  ExternalLink,
  Boxes,
  ReceiptText,
  Handshake,
  DollarSign,
  MapPin,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  Package,
  TrendingUp,
  User,
  ShieldAlert,
} from 'lucide-react';

interface LeadActionModalProps {
  contact: WaContact | null;
  onClose: () => void;
}

export function LeadActionModal({ contact, onClose }: LeadActionModalProps) {
  if (!contact) return null;

  const meta = contact.extracted_metadata || {};
  const cleanPhone = contact.phone_number.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-card border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0">
              {contact.push_name ? contact.push_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {contact.push_name || 'Customer Inquiry'}
                </h3>
                {contact.lead_score >= 80 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider">
                    HOT LEAD
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                +{contact.phone_number}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* 1. Primary One-Tap WhatsApp Action */}
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chat Directly in WhatsApp App</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-75" />
          </a>

          {/* 2. AI Intelligence & Summary */}
          <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Lead Qualification
              </span>
              <span className="text-xs font-mono font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
                Score: {contact.lead_score}/100
              </span>
            </div>
            <p className="text-xs text-foreground font-medium leading-relaxed">
              {contact.ai_summary || 'Customer initiated inquiry on WhatsApp. AI qualification ready.'}
            </p>
          </div>

          {/* 3. Extracted Retail Data Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-background border border-border rounded-xl p-3">
              <span className="text-[11px] font-semibold text-muted-foreground block">Furniture Inquired</span>
              <span className="text-xs font-bold text-foreground mt-0.5 block truncate">
                {meta.product_interest || 'General Furniture'}
              </span>
            </div>

            <div className="bg-background border border-border rounded-xl p-3">
              <span className="text-[11px] font-semibold text-muted-foreground block">Stated Budget</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                {meta.budget || 'Not specified'}
              </span>
            </div>

            <div className="bg-background border border-border rounded-xl p-3">
              <span className="text-[11px] font-semibold text-muted-foreground block">Payment Method</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5 block">
                {meta.payment_method || 'Not specified'}
              </span>
            </div>

            <div className="bg-background border border-border rounded-xl p-3">
              <span className="text-[11px] font-semibold text-muted-foreground block">Delivery Suburb</span>
              <span className="text-xs font-bold text-foreground mt-0.5 block truncate">
                {meta.delivery_location || 'Harare / Zimbabwe'}
              </span>
            </div>
          </div>

          {/* 4. Action Suggested by AI */}
          {meta.action_required && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs">
              <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                Suggested Next Step:
              </span>
              <p className="text-foreground font-medium">
                {meta.action_required}
              </p>
            </div>
          )}

          {/* 5. Business Operations Quick Actions (Stock, Laybys, Promises) */}
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Quick Database Actions
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/admin/stock"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-secondary/60 transition text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <span>Check / Update Stock</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                href="/admin/layby"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-secondary/60 transition text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-purple-600" />
                  <span>Open Layby Balances</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                href="/admin/promises"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-secondary/60 transition text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-amber-600" />
                  <span>Promises & Visits</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                href="/admin"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-secondary/60 transition text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span>Products Catalog</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-secondary/20 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
