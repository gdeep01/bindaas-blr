import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Profile = {
  real_name: string | null;
  display_name: string | null;
  display_name_updated_at: string | null;
};

// The profiles table exists in the DB but not yet in the auto-generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any, 'public', any>;

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await db
      .from('profiles')
      .select('real_name, display_name, display_name_updated_at')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? { real_name: null, display_name: null, display_name_updated_at: null });
    setLoading(false);
  };

  const updateDisplayName = async (name: string): Promise<{ success: boolean; error?: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Not logged in' };

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-display-name`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ display_name: name }),
      }
    );

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    await fetchProfile();
    return { success: true };
  };

  // What others see — display name if set, otherwise real name
  const publicName = profile?.display_name ?? profile?.real_name ?? 'Anonymous';

  useEffect(() => { void fetchProfile(); }, [userId]);

  return { profile, loading, updateDisplayName, publicName };
}
