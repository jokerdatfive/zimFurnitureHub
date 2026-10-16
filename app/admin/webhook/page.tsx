import { createClient } from "@/utils/supabase/server";
import { Activity, Send, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { sendTestWebhookEvent, clearRawEvents } from "./actions";

export default async function WebhookDiagnosticsPage() {
  const supabase = await createClient();

  const { data: rawEventsData } = await supabase
    .from("whatsapp_raw_events")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(20);

  const rawEvents = rawEventsData || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3">
            <Activity className="h-7 w-7 text-emerald-600" />
            WhatsApp Webhook Diagnostics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor incoming raw events from Meta & Dualhook, test handshake verification, and inspect payloads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form
            action={async () => {
              "use server";
              await sendTestWebhookEvent();
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md shadow-sm transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Send Simulated Test Message
            </button>
          </form>

          <Link
            href="/admin/webhook"
            className="p-2 border border-border bg-secondary hover:bg-secondary/80 rounded-md transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Setup Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ShieldCheck className="h-5 w-5" />
            <h3>Dualhook / Meta Webhook Configuration</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            In your <strong>Dualhook Connections</strong> dashboard (or Meta WhatsApp Business settings), configure:
          </p>
          <div className="space-y-2 text-xs font-mono bg-secondary/50 p-3.5 rounded-lg border border-border">
            <div>
              <span className="text-muted-foreground">Webhook URL:</span>
              <p className="text-foreground font-semibold break-all mt-0.5">
                https://your-domain.vercel.app/api/whatsapp/webhook
              </p>
            </div>
            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground">Verify Token (hub.verify_token):</span>
              <p className="text-foreground font-semibold mt-0.5">
                Set to value of <span className="text-primary font-bold">VERIFY_TOKEN</span> env var
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            ⚡ Direct Meta Webhook Override routes raw WhatsApp messages straight to your server with zero intermediate storage.
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <CheckCircle2 className="h-5 w-5" />
            <h3>Coexistence Capabilities Active</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Client Business App:</strong> Client continues chatting on WhatsApp Business app normally.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Meta Business AI:</strong> Catalog inquiries and auto-responses keep functioning without interruption.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Message Echoes:</strong> Outbound messages sent by the phone app or Meta AI are captured into your web inbox.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Raw-First Storage:</strong> Every payload is saved to <code className="font-mono text-primary">whatsapp_raw_events</code> before parsing.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Raw Events Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-xl font-medium text-foreground">
            Recent Ingested Events ({rawEvents.length})
          </h2>
          {rawEvents.length > 0 && (
            <form
              action={async () => {
                "use server";
                await clearRawEvents();
              }}
            >
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Logs
              </button>
            </form>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-secondary/40 uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Event ID</th>
                  <th className="px-6 py-3.5">Received At</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Payload Preview</th>
                  <th className="px-6 py-3.5 text-right">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rawEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                      No raw webhook events received yet. Click "Send Simulated Test Message" to test the pipeline!
                    </td>
                  </tr>
                ) : (
                  rawEvents.map((evt) => {
                    const firstMsg = evt.payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
                    const summary = firstMsg?.text?.body || evt.payload?.object || "Webhook payload";

                    return (
                      <tr key={evt.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-3 font-mono text-[11px] text-foreground">
                          {evt.id.slice(0, 8)}...
                        </td>

                        <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(evt.received_at).toLocaleString()}
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              evt.processed
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {evt.processed ? "Processed" : "Pending"}
                          </span>
                        </td>

                        <td className="px-6 py-3 text-muted-foreground max-w-sm truncate">
                          {summary}
                        </td>

                        <td className="px-6 py-3 text-right">
                          <details className="inline-block text-left">
                            <summary className="cursor-pointer text-primary hover:underline font-mono text-[11px]">
                              View JSON
                            </summary>
                            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                              <div className="bg-card border border-border p-6 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-4 shadow-xl">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold text-sm">Payload: {evt.id}</h3>
                                  <span className="text-xs text-muted-foreground">Click outside to dismiss</span>
                                </div>
                                <pre className="bg-secondary/50 p-4 rounded text-[11px] font-mono overflow-x-auto text-foreground">
                                  {JSON.stringify(evt.payload, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
