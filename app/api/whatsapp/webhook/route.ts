import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, parseWhatsAppEvent } from "@/lib/whatsapp/parser";

export const dynamic = "force-dynamic";

/**
 * GET Handler: Handles Meta / Dualhook verification challenge (hub.challenge)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.VERIFY_TOKEN;

  // If a verify token is configured, check it. Otherwise accept if mode is subscribe
  if (mode === "subscribe") {
    if (!expectedToken || token === expectedToken) {
      console.log("✅ WhatsApp Webhook verification handshake successful!");
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } else {
      console.warn("⚠️ Webhook verification failed: verify token mismatch.", {
        received: token,
        expected: expectedToken ? "[CONFIGURED]" : "[NOT_SET]",
      });
      return new NextResponse("Forbidden: verify token mismatch", { status: 403 });
    }
  }

  return new NextResponse("Invalid verification mode", { status: 400 });
}

/**
 * POST Handler: Ingests raw WhatsApp events from Meta / Dualhook
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const configuredKey = process.env.WEBHOOK_KEY;

    // Optional query key validation (?key=...)
    if (configuredKey && key !== configuredKey) {
      console.warn("⚠️ Webhook secret key rejected.");
      return NextResponse.json({ error: "Unauthorized: Invalid key" }, { status: 401 });
    }

    const payload = await req.json();

    const supabase = getSupabaseAdmin();

    // 1. Store raw event first into whatsapp_raw_events
    const { data: rawEvent, error: dbError } = await supabase
      .from("whatsapp_raw_events")
      .insert({
        payload,
        processed: false,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("❌ Failed to save raw WhatsApp event to Supabase:", dbError.message);
      // Return 500 so Meta/Dualhook retries delivery
      return NextResponse.json(
        { error: "Database ingestion failure", details: dbError.message },
        { status: 500 }
      );
    }

    console.log(`📥 Raw WhatsApp event recorded (ID: ${rawEvent.id})`);

    // 2. Parse event asynchronously in the background so webhook responds immediately with 200
    // (Next.js serverless execution allows awaiting or running quick parses)
    try {
      parseWhatsAppEvent(rawEvent.id, payload).catch((err) => {
        console.error("Background parse error:", err);
      });
    } catch (parseErr) {
      console.error("Could not trigger background parse:", parseErr);
    }

    return NextResponse.json(
      {
        status: "ok",
        received: true,
        id: rawEvent.id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Exception handling WhatsApp webhook POST:", err.message);
    return NextResponse.json(
      { error: "Server processing error", message: err.message },
      { status: 500 }
    );
  }
}
