import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const payload = await req.json();
  const user = payload?.record;

  if (!user?.id) return new Response('ok');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const realName = user.raw_user_meta_data?.full_name ?? 
                   user.raw_user_meta_data?.name ?? 
                   null;

  await supabase.from('profiles').upsert({
    id: user.id,
    real_name: realName,
  });

  return new Response('ok');
});
