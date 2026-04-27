import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_IMAGE = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const SUPPORTED_PDF = ["application/pdf"];

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { attachment_id } = await req.json();
    if (!attachment_id) {
      return new Response(JSON.stringify({ error: "attachment_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Load attachment
    const { data: att, error: attErr } = await admin
      .from("task_attachments")
      .select("*")
      .eq("id", attachment_id)
      .maybeSingle();
    if (attErr || !att) throw new Error(attErr?.message || "Attachment not found");

    const mime = (att.mime_type || "").toLowerCase();
    const isImage = SUPPORTED_IMAGE.includes(mime) || mime.startsWith("image/");
    const isPdf = SUPPORTED_PDF.includes(mime);

    if (!isImage && !isPdf) {
      await admin
        .from("task_attachments")
        .update({
          ocr_status: "skipped",
          ocr_error: `Unsupported type: ${mime || "unknown"}`,
          ocr_completed_at: new Date().toISOString(),
        })
        .eq("id", attachment_id);
      return new Response(JSON.stringify({ status: "skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as processing
    await admin
      .from("task_attachments")
      .update({ ocr_status: "processing", ocr_error: null })
      .eq("id", attachment_id);

    // Download file from storage
    const { data: fileBlob, error: dlErr } = await admin.storage
      .from("task-attachments")
      .download(att.storage_path);
    if (dlErr || !fileBlob) throw new Error(dlErr?.message || "Failed to download file");

    const arrayBuf = await fileBlob.arrayBuffer();
    const sizeMb = arrayBuf.byteLength / (1024 * 1024);
    if (sizeMb > 20) {
      throw new Error(`File too large for OCR (${sizeMb.toFixed(1)} MB, max 20 MB)`);
    }

    const base64 = bytesToBase64(new Uint8Array(arrayBuf));
    const dataUrl = `data:${mime};base64,${base64}`;

    const systemPrompt =
      "You are an OCR engine. Extract ALL visible text from the provided document or image. " +
      "Preserve line breaks and reading order. Include numbers, labels, table cell contents, headings. " +
      "Do NOT add commentary, explanations, or markdown formatting. " +
      "Output ONLY the extracted text. If nothing readable is found, respond with exactly: [NO_TEXT_FOUND]";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract all text from this file: ${att.file_name}` },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      if (aiResp.status === 429) throw new Error("AI rate limit exceeded, try again shortly");
      if (aiResp.status === 402) throw new Error("AI credits exhausted — top up workspace");
      throw new Error(`AI gateway error ${aiResp.status}: ${t.slice(0, 200)}`);
    }

    const json = await aiResp.json();
    let text: string = json?.choices?.[0]?.message?.content?.trim() || "";
    if (text === "[NO_TEXT_FOUND]") text = "";

    await admin
      .from("task_attachments")
      .update({
        ocr_text: text,
        ocr_status: "completed",
        ocr_error: null,
        ocr_completed_at: new Date().toISOString(),
      })
      .eq("id", attachment_id);

    return new Response(
      JSON.stringify({ status: "completed", chars: text.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("OCR error:", msg);
    try {
      const { attachment_id } = await req.clone().json().catch(() => ({}));
      if (attachment_id) {
        await admin
          .from("task_attachments")
          .update({
            ocr_status: "failed",
            ocr_error: msg.slice(0, 500),
            ocr_completed_at: new Date().toISOString(),
          })
          .eq("id", attachment_id);
      }
    } catch (_) {}
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
