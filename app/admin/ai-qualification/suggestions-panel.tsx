'use client';

import { useState, useTransition } from 'react';
import { BadgeDollarSign, ReceiptText, Handshake, ShoppingBag, Check, X, Sparkles } from 'lucide-react';
import type { SuggestionKind } from '@/lib/db/types';
import {
  applyPaymentSuggestion,
  applyLaybySuggestion,
  applyPromiseSuggestion,
  acknowledgeOrderSuggestion,
  dismissSuggestion,
} from './actions';

export interface SuggestionRow {
  id: string;
  contact_id: string;
  kind: SuggestionKind;
  title: string;
  detail: string | null;
  payload: Record<string, any>;
  created_at: string;
  contact: { push_name: string | null; phone_number: string } | null;
}

export interface ActiveLayby {
  id: string;
  contact_id?: string | null;
  customer_name: string;
  product_name: string;
  balance_due: number;
}

const METHODS = ['EcoCash', 'InnBucks', 'Mukuru', 'USD_Cash', 'Bank_Transfer'];
const KIND_META: Record<SuggestionKind, { label: string; icon: typeof Sparkles; tone: string }> = {
  PAYMENT_CONFIRMED: { label: 'Payment confirmed', icon: BadgeDollarSign, tone: 'text-emerald-600' },
  LAYBY_REQUEST: { label: 'New layby', icon: ReceiptText, tone: 'text-purple-600' },
  PROMISE: { label: 'Customer promise', icon: Handshake, tone: 'text-amber-600' },
  ORDER: { label: 'Order / delivery', icon: ShoppingBag, tone: 'text-sky-600' },
};

const inputCls =
  'w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary';

function Card({ s, laybys, onChanged }: { s: SuggestionRow; laybys: ActiveLayby[]; onChanged: () => void }) {
  const meta = KIND_META[s.kind];
  const Icon = meta.icon;
  const p = s.payload || {};
  const name = s.contact?.push_name || (s.contact ? `+${s.contact.phone_number}` : 'Customer');

  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Default the payment target to this customer's layby when there is exactly one
  const mine = laybys.filter((l) => l.contact_id === s.contact_id);
  const [laybyId, setLaybyId] = useState(mine.length === 1 ? mine[0].id : '');
  const [amount, setAmount] = useState(String(p.amount ?? p.deposit ?? ''));
  const [method, setMethod] = useState(METHODS.includes(p.method) ? p.method : 'EcoCash');
  const [product, setProduct] = useState(String(p.product ?? ''));
  const [total, setTotal] = useState(String(p.total_price ?? ''));
  const [deposit, setDeposit] = useState(String(p.deposit ?? ''));
  const [date, setDate] = useState(String(p.date ?? ''));
  const [promiseType, setPromiseType] = useState<'PAYMENT' | 'VISIT' | 'CALL_BACK'>('PAYMENT');

  const run = (fn: () => Promise<{ success?: true; error?: string }>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else onChanged();
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${meta.tone}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{s.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {name} · {meta.label} · {new Date(s.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          type="button"
          title="Dismiss"
          disabled={pending}
          onClick={() => run(() => dismissSuggestion(s.id))}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {s.detail && <p className="text-xs text-muted-foreground leading-relaxed">{s.detail}</p>}

      {s.kind === 'PAYMENT_CONFIRMED' && (
        <div className="grid grid-cols-2 gap-2">
          <select className={`${inputCls} col-span-2`} value={laybyId} onChange={(e) => setLaybyId(e.target.value)}>
            <option value="">Apply to which layby account…</option>
            {[...mine, ...laybys.filter((l) => l.contact_id !== s.contact_id)].map((l) => (
              <option key={l.id} value={l.id}>
                {l.customer_name} – {l.product_name} (balance ${l.balance_due})
              </option>
            ))}
          </select>
          <input className={inputCls} type="number" step="0.01" placeholder="Amount $" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
          {p.reference && <p className="col-span-2 text-[11px] font-mono text-muted-foreground">Ref: {p.reference}</p>}
        </div>
      )}

      {s.kind === 'LAYBY_REQUEST' && (
        <div className="grid grid-cols-2 gap-2">
          <input className={`${inputCls} col-span-2`} placeholder="Product" value={product} onChange={(e) => setProduct(e.target.value)} />
          <input className={inputCls} type="number" step="0.01" placeholder="Total price $" value={total} onChange={(e) => setTotal(e.target.value)} />
          <input className={inputCls} type="number" step="0.01" placeholder="Deposit paid $" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          <select className={`${inputCls} col-span-2`} value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      )}

      {s.kind === 'PROMISE' && (
        <div className="grid grid-cols-2 gap-2">
          <select className={inputCls} value={promiseType} onChange={(e) => setPromiseType(e.target.value as typeof promiseType)}>
            <option value="PAYMENT">Payment</option>
            <option value="VISIT">Showroom visit</option>
            <option value="CALL_BACK">Callback</option>
          </select>
          <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className={`${inputCls} col-span-2`} type="number" step="0.01" placeholder="Amount $ (optional)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      )}

      {s.kind === 'ORDER' && p.delivery_location && (
        <p className="text-xs text-muted-foreground">Delivery: {p.delivery_location}</p>
      )}

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (s.kind === 'PAYMENT_CONFIRMED')
            run(() => applyPaymentSuggestion(s.id, { laybyId, amount: Number(amount), method, reference: p.reference || undefined }));
          else if (s.kind === 'LAYBY_REQUEST')
            run(() =>
              applyLaybySuggestion(s.id, {
                customerName: s.contact?.push_name || '',
                productName: product,
                totalPrice: Number(total),
                deposit: Number(deposit) || 0,
                method,
              })
            );
          else if (s.kind === 'PROMISE')
            run(() => applyPromiseSuggestion(s.id, { date, amount: Number(amount) || null, type: promiseType }));
          else run(() => acknowledgeOrderSuggestion(s.id));
        }}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
      >
        <Check className="h-3.5 w-3.5" />
        {pending
          ? 'Saving…'
          : s.kind === 'PAYMENT_CONFIRMED'
          ? 'Approve & record payment'
          : s.kind === 'LAYBY_REQUEST'
          ? 'Approve & create layby'
          : s.kind === 'PROMISE'
          ? 'Approve & log promise'
          : 'Mark as handled'}
      </button>
    </div>
  );
}

export function SuggestionsPanel({
  suggestions,
  laybys,
  hint,
  onChanged,
}: {
  suggestions: SuggestionRow[];
  laybys: ActiveLayby[];
  hint?: string | null;
  onChanged: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">AI Suggested Actions</h2>
          {suggestions.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              {suggestions.length}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Nothing is saved until you approve</span>
      </div>

      {hint && (
        <p className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3">
          {hint}
        </p>
      )}

      {suggestions.length === 0 && !hint ? (
        <p className="text-xs text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">
          No pending suggestions. When a customer confirms a payment, asks for layby, or promises a date, the AI
          will propose the matching database update here.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suggestions.map((s) => (
            <Card key={s.id} s={s} laybys={laybys} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
