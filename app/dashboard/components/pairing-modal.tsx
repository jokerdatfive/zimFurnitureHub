'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PairingModal({ isOpen, onClose, onSuccess }: PairingModalProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'code'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [qrCountdown, setQrCountdown] = useState(25);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch Live QR Code
  const fetchQr = useCallback(async () => {
    setQrLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evolution/pair', { cache: 'no-store' });
      const data = await res.json();
      if (data.qrBase64) {
        setQrBase64(data.qrBase64);
        setQrCountdown(25);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Could not connect to WhatsApp gateway. Please try again.');
    } finally {
      setQrLoading(false);
    }
  }, []);

  // Reset Session (clears stale 401/dead session keys on Evolution API)
  const handleResetSession = async () => {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch('/api/evolution/pair', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.qrBase64) {
        setQrBase64(data.qrBase64);
        setQrCountdown(25);
      } else {
        await fetchQr();
      }
    } catch {
      setError('Failed to reset session. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsConnected(false);
      fetchQr();
    }
  }, [isOpen, fetchQr]);

  // QR Code Auto-Refresh Countdown (25s expiration prevention)
  useEffect(() => {
    if (!isOpen || activeTab !== 'qr' || isConnected || qrLoading) return;

    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          fetchQr();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeTab, isConnected, qrLoading, fetchQr]);

  // Poll connection status every 2.5 seconds while modal is open
  useEffect(() => {
    if (!isOpen || isConnected) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/evolution/status', { cache: 'no-store' });
        const data = await res.json();
        if (data.connected) {
          setIsConnected(true);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            onClose();
          }, 2500);
        }
      } catch {}
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [isOpen, isConnected, onSuccess, onClose]);

  // 90s countdown timer when pairing code is generated
  useEffect(() => {
    if (!pairingCode) return;
    setTimerSeconds(90);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pairingCode]);

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

      if (data.qrBase64) {
        setQrBase64(data.qrBase64);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request pairing code');
      }

      setPairingCode(data.formattedCode || data.code);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-card border border-border text-card-foreground rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Link WhatsApp Gateway</h3>
              <p className="text-xs text-muted-foreground">Pair your business WhatsApp line with KK Furnitures AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-secondary/10 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'qr'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Instant QR Code (Fastest)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>8-Digit Phone Code</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Success Message Banner */}
          {isConnected && (
            <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-base font-bold text-foreground">WhatsApp Linked Successfully!</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your WhatsApp number is now connected. KK Furnitures AI assistant is active and ready to handle customer inquiries.
              </p>
            </div>
          )}

          {!isConnected && error && (
            <div className="flex flex-col gap-2 p-3.5 text-xs rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-medium">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleResetSession}
                disabled={resetting}
                className="self-end inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-destructive/20 hover:bg-destructive/30 rounded-lg transition"
              >
                <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset WhatsApp Socket</span>
              </button>
            </div>
          )}

          {/* TAB 1: QR CODE */}
          {!isConnected && activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center justify-center p-6 bg-background border border-border rounded-2xl">
                {qrLoading || resetting ? (
                  <div className="h-56 w-56 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {resetting ? 'Clearing old session socket...' : 'Generating fresh QR code...'}
                    </span>
                  </div>
                ) : qrBase64 ? (
                  <div className="relative group">
                    <img
                      src={qrBase64}
                      alt="WhatsApp Web QR Code"
                      className="w-56 h-56 rounded-xl border border-border shadow-md bg-white p-2"
                    />
                  </div>
                ) : (
                  <div className="h-56 w-56 flex flex-col items-center justify-center gap-3 text-center px-4">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Could not generate QR code. Tap refresh below.
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={fetchQr}
                    disabled={qrLoading || resetting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded-lg transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSession}
                    disabled={resetting || qrLoading}
                    title="Click if WhatsApp says 'Couldn't link device' or connection is denied"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                    <span>Reset Stale Session</span>
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>Auto-refreshes in <strong>{qrCountdown}s</strong> to stay live</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-secondary/30 border border-border rounded-xl text-left space-y-2 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground mb-1">How to Link with QR Code:</div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[10px]">1</span>
                  <span>Open WhatsApp &rarr; <strong>Settings</strong> (iPhone) or <strong>Three Dots ⋮</strong> (Android)</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[10px]">2</span>
                  <span>Tap <strong>Linked Devices</strong> &rarr; tap <strong>Link a Device</strong></span>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[10px]">3</span>
                  <span>Scan the QR code above &mdash; your line connects instantly!</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 8-DIGIT PHONE CODE */}
          {!isConnected && activeTab === 'code' && (
            <div>
              {!pairingCode ? (
                <form onSubmit={handleGenerateCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Business WhatsApp Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +263 77 123 4567 or 077 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Include country code (e.g. +263). Local format (077...) is automatically converted.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Phone Number Linking
                    </div>
                    <p>
                      Generates a unique 8-digit code for WhatsApp&apos;s &quot;Link with phone number instead&quot; flow.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting to WhatsApp...
                        </>
                      ) : (
                        'Generate Pairing Code'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-background border border-primary/30 rounded-2xl shadow-sm">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Your 8-Digit Pairing Code
                    </span>
                    <div className="mt-2 text-3xl sm:text-4xl font-mono font-bold tracking-widest text-primary select-all">
                      {pairingCode}
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Code expires in: <strong className={timerSeconds < 20 ? 'text-destructive' : 'text-foreground'}>{timerSeconds}s</strong></span>
                    </div>

                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition"
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
                  <div className="p-4 bg-secondary/30 border border-border rounded-xl space-y-2 text-xs text-muted-foreground">
                    <div className="font-semibold text-foreground mb-1">Enter Code on Mobile WhatsApp:</div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[10px]">1</span>
                      <span>Open WhatsApp &rarr; <strong>Settings</strong> (iPhone) or <strong>Three Dots ⋮</strong> (Android)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[10px]">2</span>
                      <span>Tap <strong>Linked Devices</strong> &rarr; tap <strong>Link a Device</strong></span>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[10px]">3</span>
                      <span>Tap <span className="text-primary font-semibold underline">Link with phone number instead</span> at the bottom</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[10px]">4</span>
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
                      className="text-xs text-muted-foreground hover:text-foreground transition underline"
                    >
                      Try another number
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('qr')}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Or switch to QR code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
