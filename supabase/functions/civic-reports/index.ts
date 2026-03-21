import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REQUIRED_SECRETS = [] as const;

const RATE_LIMIT_MAX_REPORTS = 2;
const BENGALURU_BOUNDS = {
  minLat: 12.75,
  maxLat: 13.15,
  minLng: 77.4,
  maxLng: 77.85,
};
const MAX_LOCATION_NAME_LENGTH = 200;
const MAX_REPORTER_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 500;

interface GarbageReportPayload {
  location_name: string;
  reporter_name?: string;
  description?: string;
  severity?: string;
  report_type?: string;
  latitude: number;
  longitude: number;
  image_urls?: string[];
}

const isWithinBengaluru = (latitude: number, longitude: number) =>
  latitude >= BENGALURU_BOUNDS.minLat &&
  latitude <= BENGALURU_BOUNDS.maxLat &&
  longitude >= BENGALURU_BOUNDS.minLng &&
  longitude <= BENGALURU_BOUNDS.maxLng;

const getClientIp = (req: Request) => {
  // Prefer cf-connecting-ip (most reliable behind Cloudflare)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  return null;
};

const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, '');

const SUPABASE_STORAGE_BASE_URL = `${Deno.env.get('SUPABASE_URL') ?? ''}/storage/v1/object/public/garbage-report-images/`;

const isValidImageUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && url.startsWith(SUPABASE_STORAGE_BASE_URL);
  } catch {
    return false;
  }
};

const hashValue = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

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
    console.error(`[FATAL] Missing secrets: ${missing.join(', ')}`);
    return new Response(
      JSON.stringify({
        error: 'Missing required secrets',
        missing,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json() as GarbageReportPayload;
    const authHeader = req.headers.get('Authorization');
    const clientIp = getClientIp(req);

    if (!payload.location_name?.trim() || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required report fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.location_name.trim().length > MAX_LOCATION_NAME_LENGTH) {
      return new Response(JSON.stringify({ success: false, error: 'Location name is too long.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((payload.reporter_name?.trim().length || 0) > MAX_REPORTER_NAME_LENGTH) {
      return new Response(JSON.stringify({ success: false, error: 'Reporter name is too long.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((payload.description?.trim().length || 0) > MAX_DESCRIPTION_LENGTH) {
      return new Response(JSON.stringify({ success: false, error: 'Description is too long.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((payload.image_urls?.length || 0) > 2) {
      return new Response(JSON.stringify({ success: false, error: 'Upload up to two images per report.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isWithinBengaluru(payload.latitude, payload.longitude)) {
      return new Response(JSON.stringify({ success: false, error: 'Report location must be within Bengaluru city limits.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate image URLs point to our Supabase storage bucket
    if (Array.isArray(payload.image_urls) && payload.image_urls.length > 0) {
      const invalidUrls = payload.image_urls.filter((url) => typeof url !== 'string' || !isValidImageUrl(url));
      if (invalidUrls.length > 0) {
        return new Response(JSON.stringify({ success: false, error: 'Image URLs must point to the application storage bucket.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.replace('Bearer ', '').trim();

    // Create a user-scoped client to validate the JWT
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );

    const { data: authData, error: authError } = await userSupabase.auth.getUser();

    if (authError || !authData.user) {
      console.error('[Supabase] Auth lookup failed:', authError?.message ?? 'Unknown auth error');
      return new Response(JSON.stringify({ success: false, error: 'Invalid session. Please sign in again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!clientIp) {
      return new Response(JSON.stringify({ success: false, error: 'Could not determine client IP address.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reporterIpHash = await hashValue(clientIp);

    const windowStart = new Date();
    windowStart.setUTCHours(0, 0, 0, 0);

    let count = 0;
    try {
      const rateLimitResult = await supabase
        .from('garbage_reports')
        .select('id', { count: 'exact', head: true })
        .eq('reporter_ip_hash', reporterIpHash)
        .gte('reported_at', windowStart.toISOString());

      if (rateLimitResult.error) {
        console.error('[Supabase] Rate limit query failed:', rateLimitResult.error.message);
        throw rateLimitResult.error;
      }

      count = rateLimitResult.count || 0;
    } catch (error) {
      console.error('[Supabase] Rate limit query threw:', error instanceof Error ? error.message : error);
      throw error;
    }

    if (count >= RATE_LIMIT_MAX_REPORTS) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Daily limit reached. You can submit up to two reports per day from the same network.',
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { error } = await supabase.from('garbage_reports').insert({
        location_name: stripHtmlTags(payload.location_name.trim()),
        reporter_name: payload.reporter_name ? stripHtmlTags(payload.reporter_name.trim()) : null,
        description: payload.description ? stripHtmlTags(payload.description.trim()) : null,
        severity: payload.severity || 'medium',
        report_type: payload.report_type || 'dumping',
        latitude: payload.latitude,
        longitude: payload.longitude,
        image_urls: payload.image_urls ?? [],
        reporter_ip_hash: reporterIpHash,
        user_id: authData.user.id,
        moderation_status: 'reported',
        upvotes: 0,
      });

      if (error) {
        console.error('[Supabase] Insert failed:', error.message, error.code);
        throw error;
      }
      console.log('[Supabase] Civic report inserted successfully');
    } catch (error) {
      console.error('[Supabase] Insert threw:', error instanceof Error ? error.message : error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('civic-reports error:', error);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
