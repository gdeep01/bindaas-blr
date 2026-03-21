import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REQUIRED_SECRETS = [] as const;

interface UpvotePayload {
  report_id: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'https://bindaas-blr.vercel.app',
    'https://bindaasblr.vercel.app',
    Deno.env.get('ALLOWED_ORIGIN') ?? '',
  ].filter(Boolean);

  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  const missing = REQUIRED_SECRETS.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    console.error(`[FATAL] Missing secrets: ${missing.join(", ")}`);
    return new Response(
      JSON.stringify({
        error: "Missing required secrets",
        missing,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as UpvotePayload;
    const authHeader = req.headers.get("Authorization");
    const report_id = payload.report_id?.trim();

    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!report_id || !UUID_REGEX.test(report_id)) {
      return new Response(JSON.stringify({ error: 'Invalid report_id' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const jwt = authHeader.replace("Bearer ", "").trim();
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !authData.user) {
      console.error("[Supabase] Auth lookup failed:", authError?.message ?? "Unknown auth error");
      return new Response(JSON.stringify({ success: false, error: "Invalid session. Please sign in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    const { data: reportRow, error: reportError } = await supabase
      .from("garbage_reports")
      .select("id, user_id, upvotes, moderation_status")
      .eq("id", report_id)
      .maybeSingle();

    if (reportError || !reportRow) {
      return new Response(JSON.stringify({ success: false, error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingVote, error: existingVoteError } = await supabase
      .from("garbage_report_votes")
      .select("id")
      .eq("report_id", report_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingVoteError) {
      console.error("[Supabase] Existing vote lookup failed:", existingVoteError.message, existingVoteError.code);
      throw existingVoteError;
    }

    if (existingVote) {
      return new Response(JSON.stringify({ success: false, error: "You have already upvoted this report." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: voteError } = await supabase
      .from("garbage_report_votes")
      .insert({
        report_id,
        user_id: userId,
      });

    if (voteError) {
      console.error("[Supabase] Vote insert failed:", voteError.message, voteError.code);
      throw voteError;
    }

    const nextUpvotes = (reportRow.upvotes ?? 0) + 1;
    const nextModerationStatus =
      reportRow.moderation_status === "resolved"
        ? "resolved"
        : nextUpvotes >= 3
          ? "confirmed"
          : reportRow.moderation_status || "reported";

    const { error: updateError } = await supabase
      .from("garbage_reports")
      .update({
        upvotes: nextUpvotes,
        moderation_status: nextModerationStatus,
      })
      .eq("id", report_id);

    if (updateError) {
      console.error("[Supabase] Report update failed:", updateError.message, updateError.code);
      throw updateError;
    }

    console.log("[Supabase] Garbage upvote recorded successfully");

    return new Response(
      JSON.stringify({
        success: true,
        upvotes: nextUpvotes,
        moderation_status: nextModerationStatus,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("garbage-upvote error:", error);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
