import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROFANITY_BLOCKLIST = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'dick', 'pussy', 'cunt',
  'nigger', 'nigga', 'chutiya', 'madarchod', 'behenchod', 'bhenchod',
  'gaandu', 'harami', 'randi', 'sala', 'bokachoda', 'lavde', 'lund',
  'bhosdike', 'mc', 'bc', 'admin', 'moderator', 'bindaasblr', 'bindaas',
];

const isProfane = (name: string): boolean => {
  const lower = name.toLowerCase().replace(/\s+/g, '');
  return PROFANITY_BLOCKLIST.some(word => lower.includes(word));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { display_name } = await req.json();

    // Validate
    if (!display_name || typeof display_name !== 'string') {
      return new Response(JSON.stringify({ error: 'Display name is required' }), { status: 400, headers: corsHeaders });
    }

    const trimmed = display_name.trim();

    if (trimmed.length < 2 || trimmed.length > 30) {
      return new Response(JSON.stringify({ error: 'Display name must be between 2 and 30 characters' }), { status: 400, headers: corsHeaders });
    }

    if (isProfane(trimmed)) {
      return new Response(JSON.stringify({ error: 'Display name contains prohibited words' }), { status: 400, headers: corsHeaders });
    }

    // Check existing profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('display_name, display_name_updated_at')
      .eq('id', user.id)
      .maybeSingle();

    // Check 7 day cooldown
    if (existing?.display_name_updated_at) {
      const daysSince = (Date.now() - new Date(existing.display_name_updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        const daysLeft = Math.ceil(7 - daysSince);
        return new Response(JSON.stringify({ 
          error: `You can change your display name again in ${daysLeft} day${daysLeft > 1 ? 's' : ''}` 
        }), { status: 429, headers: corsHeaders });
      }
    }

    // Check uniqueness
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('display_name_lower', trimmed.toLowerCase())
      .neq('id', user.id)
      .maybeSingle();

    if (taken) {
      return new Response(JSON.stringify({ error: 'This display name is already taken' }), { status: 409, headers: corsHeaders });
    }

    // Store history
    if (existing?.display_name) {
      await supabase.from('display_name_history').insert({
        user_id: user.id,
        old_name: existing.display_name,
        new_name: trimmed,
      });
    }

    // Update profile
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: trimmed,
      display_name_updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, display_name: trimmed }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
