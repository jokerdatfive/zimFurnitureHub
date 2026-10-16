import { createClient } from "@/utils/supabase/server";
import { MessageSquare, RefreshCw, Smartphone, Bot, User, Clock, ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";

interface MessagesPageProps {
  searchParams: Promise<{ conversationId?: string; q?: string }>;
}

export default async function WhatsAppMessagesPage({ searchParams }: MessagesPageProps) {
  const { conversationId, q } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch all conversations with contacts
  let convQuery = supabase
    .from("whatsapp_conversations")
    .select(`
      id,
      last_message_at,
      last_message_preview,
      unread_count,
      status,
      contact:whatsapp_contacts (
        id,
        wa_id,
        bsuid,
        phone,
        profile_name
      )
    `)
    .order("last_message_at", { ascending: false });

  const { data: convData, error: convError } = await convQuery;
  const conversations = (convData || []) as any[];

  // Filter if search query provided
  const filteredConversations = q
    ? conversations.filter(
        (c) =>
          c.contact?.profile_name?.toLowerCase().includes(q.toLowerCase()) ||
          c.contact?.phone?.includes(q) ||
          c.last_message_preview?.toLowerCase().includes(q.toLowerCase())
      )
    : conversations;

  // Selected conversation (or default to the first one)
  const selectedConvId = conversationId || (filteredConversations[0]?.id ?? null);
  const activeConversation = conversations.find((c) => c.id === selectedConvId) || filteredConversations[0] || null;

  // 2. Fetch messages for active conversation
  let messages: any[] = [];
  if (selectedConvId) {
    const { data: msgData } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", selectedConvId)
      .order("timestamp", { ascending: true });
    messages = msgData || [];
  }

  // 3. Check if lead exists for this contact
  let leadInfo = null;
  if (activeConversation?.contact?.id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("contact_id", activeConversation.contact.id)
      .maybeSingle();
    leadInfo = lead;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            WhatsApp Live Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time messages synced directly from customer chats, Meta Business AI, and the WhatsApp Business mobile app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/messages"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md border border-border transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Link>
          <Link
            href="/admin/webhook"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-colors"
          >
            Webhook Status
          </Link>
        </div>
      </div>

      {/* Main Inbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px] bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        
        {/* Left Column: Conversation List */}
        <div className="lg:col-span-4 border-r border-border flex flex-col bg-secondary/10">
          {/* Search Box */}
          <div className="p-3.5 border-b border-border bg-card">
            <form method="GET" action="/admin/messages" className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={q || ""}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-secondary/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </form>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <p>No conversations found.</p>
                <p className="text-xs mt-1 text-muted-foreground/80">
                  New incoming WhatsApp messages will automatically appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const contact = conv.contact || {};
                const timeString = conv.last_message_at
                  ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "";

                return (
                  <Link
                    key={conv.id}
                    href={`/admin/messages?conversationId=${conv.id}`}
                    className={`block p-4 transition-colors hover:bg-secondary/40 text-left ${
                      isSelected ? "bg-secondary/60 border-l-4 border-l-emerald-600 font-medium" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[170px]">
                        {contact.profile_name || "WhatsApp User"}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{timeString}</span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate line-clamp-1 mb-1.5">
                      {conv.last_message_preview || "No messages yet"}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/90 font-mono">
                        {contact.phone || contact.wa_id || "ID: " + (contact.bsuid?.slice(0, 8) || "N/A")}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat View & Lead Quick Card */}
        <div className="lg:col-span-8 flex flex-col bg-card">
          {activeConversation ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div>
                  <h2 className="font-semibold text-base text-foreground flex items-center gap-2">
                    {activeConversation.contact?.profile_name || "WhatsApp Client"}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-normal">
                      Active Chat
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Phone: <span className="font-mono text-foreground">{activeConversation.contact?.phone || activeConversation.contact?.wa_id || "BSUID: " + activeConversation.contact?.bsuid}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {leadInfo ? (
                    <Link
                      href={`/admin/leads?id=${leadInfo.id}`}
                      className="text-xs px-2.5 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                    >
                      Lead Status: {leadInfo.status}
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/leads`}
                      className="text-xs px-2.5 py-1.5 rounded bg-secondary text-foreground hover:bg-secondary/80 font-medium transition-colors"
                    >
                      View in Leads
                    </Link>
                  )}
                  <Link
                    href={`/admin/layby`}
                    className="text-xs px-2.5 py-1.5 rounded border border-border text-foreground hover:bg-secondary font-medium transition-colors"
                  >
                    Open Layby
                  </Link>
                </div>
              </div>

              {/* Chat Bubble Thread */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[550px] bg-secondary/5">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-8 text-muted-foreground text-sm">
                    <div>
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p>No messages recorded for this thread yet.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isInbound = m.direction === "INBOUND";
                    const isBusinessApp = m.sender_type === "BUSINESS_APP";
                    const isAI = m.sender_type === "BUSINESS_AI";
                    const time = new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                      >
                        {/* Sender Badge */}
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-muted-foreground">
                          {isInbound ? (
                            <>
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{activeConversation.contact?.profile_name || "Customer"}</span>
                            </>
                          ) : isAI ? (
                            <>
                              <Bot className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              <span className="text-purple-600 dark:text-purple-400 font-medium">Meta Business AI</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Phone Business App</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{time}</span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                            isInbound
                              ? "bg-secondary text-foreground rounded-tl-sm border border-border"
                              : isAI
                              ? "bg-purple-600 text-white rounded-tr-sm"
                              : "bg-emerald-600 text-white rounded-tr-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Footer note */}
              <div className="p-3 bg-secondary/30 border-t border-border text-center text-xs text-muted-foreground">
                <span>💬 The client replies directly from his WhatsApp Business mobile app or Meta Business AI. Messages mirror here via coexistence.</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 stroke-[1.5] mb-3 opacity-30 text-emerald-600" />
              <h3 className="font-medium text-foreground text-base">Select a conversation</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Choose a customer from the left to view full chat history, phone echo messages, and AI responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
