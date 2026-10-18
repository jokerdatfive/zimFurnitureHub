'use client';

import { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  Loader2,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PairingModal({ isOpen, onClose, onSuccess }: PairingModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPairingCode(null);

    try {
      const res = await fetch('/api/evolution/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request pairing code');
      }

      setPairingCode(data.formattedCode || data.code);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while generating the pairing code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace('-', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Link WhatsApp Gateway</h3>
              <p className="text-xs text-slate-400">Self-service 8-digit phone pairing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 transition hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!pairingCode ? (
            <form onSubmit={handleGenerateCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Business WhatsApp Phone Number (with Country Code)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. +263 77 123 4567 or +1 555 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Include international country code without spaces or dashes.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  No QR Code Scanning Required
                </div>
                <p>
                  This triggers an official Baileys pairing handshake. WhatsApp will notify your mobile phone directly with a prompt to confirm.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting to Hugging Face...
                    </>
                  ) : (
                    'Generate Pairing Code'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="text-center p-6 bg-slate-950/80 border border-emerald-500/30 rounded-2xl">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Your 8-Digit Pairing Code
                </span>
                <div className="mt-2 text-3xl sm:text-4xl font-mono font-bold tracking-widest text-emerald-400 select-all">
                  {pairingCode}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-700/50 rounded-lg transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Step by step guide */}
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
                <div className="font-semibold text-white mb-2">Instructions on Phone:</div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold shrink-0 text-[10px]">1</span>
                  <span>Open WhatsApp &rarr; <strong>Settings</strong> (iOS) or <strong>Three Dots ⋮</strong> (Android)</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold shrink-0 text-[10px]">2</span>
                  <span>Select <strong>Linked Devices</strong> &rarr; tap <strong>Link a Device</strong></span>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold shrink-0 text-[10px]">3</span>
                  <span>Tap <span className="text-emerald-400 font-semibold underline">Link with phone number instead</span> at the bottom</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold shrink-0 text-[10px]">4</span>
                  <span>Enter the 8-digit code <strong>{pairingCode}</strong></span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPairingCode(null);
                    setPhoneNumber('');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  Try another number
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
