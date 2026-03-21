import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REQUIRED_SECRETS = [] as const;

const isAuthorizedCronRequest = (req: Request, serviceRoleKey: string) => {
  const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
  const apiKeyHeader = req.headers.get('apikey')?.trim();
  const cronSecret = Deno.env.get('CRON_SECRET');
  const cronHeader = req.headers.get('x-cron-secret')?.trim();

  if (authHeader === serviceRoleKey || apiKeyHeader === serviceRoleKey) {
    return true;
  }

  return Boolean(cronSecret && cronHeader === cronSecret);
};

const LOCALITIES = [
  { id: 'mg-road', name: 'MG Road', lat: 12.9756, lng: 77.6068 },
  { id: 'brigade-road', name: 'Brigade Road', lat: 12.9726, lng: 77.6066 },
  { id: 'cubbon-park', name: 'Cubbon Park Area', lat: 12.9763, lng: 77.5929 },
  { id: 'shivajinagar', name: 'Shivajinagar', lat: 12.9857, lng: 77.6048 },
  { id: 'majestic', name: 'Majestic / KSR', lat: 12.9771, lng: 77.5713 },
  { id: 'chickpet', name: 'Chickpet', lat: 12.9686, lng: 77.5751 },
  { id: 'gandhinagar', name: 'Gandhinagar', lat: 12.9800, lng: 77.5750 },
  { id: 'avenue-road', name: 'Avenue Road', lat: 12.9730, lng: 77.5780 },
  { id: 'koramangala', name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { id: 'jayanagar', name: 'Jayanagar', lat: 12.9250, lng: 77.5938 },
  { id: 'jp-nagar', name: 'JP Nagar', lat: 12.9063, lng: 77.5857 },
  { id: 'btm-layout', name: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { id: 'hsr-layout', name: 'HSR Layout', lat: 12.9116, lng: 77.6474 },
  { id: 'banashankari', name: 'Banashankari', lat: 12.9255, lng: 77.5468 },
  { id: 'basavanagudi', name: 'Basavanagudi', lat: 12.9422, lng: 77.5737 },
  { id: 'girinagar', name: 'Girinagar', lat: 12.9380, lng: 77.5520 },
  { id: 'kumaraswamy-layout', name: 'Kumaraswamy Layout', lat: 12.9100, lng: 77.5600 },
  { id: 'padmanabhanagar', name: 'Padmanabhanagar', lat: 12.9130, lng: 77.5560 },
  { id: 'wilson-garden', name: 'Wilson Garden', lat: 12.9500, lng: 77.5950 },
  { id: 'lalbagh', name: 'Lalbagh Area', lat: 12.9507, lng: 77.5848 },
  { id: 'uttarahalli', name: 'Uttarahalli', lat: 12.8950, lng: 77.5450 },
  { id: 'kanakapura-road', name: 'Kanakapura Road', lat: 12.8800, lng: 77.5650 },
  { id: 'indiranagar', name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { id: 'whitefield', name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { id: 'kr-puram', name: 'KR Puram', lat: 13.0098, lng: 77.6960 },
  { id: 'marathahalli', name: 'Marathahalli', lat: 12.9591, lng: 77.7010 },
  { id: 'cv-raman-nagar', name: 'CV Raman Nagar', lat: 12.9850, lng: 77.6600 },
  { id: 'old-airport-road', name: 'Old Airport Road', lat: 12.9650, lng: 77.6500 },
  { id: 'domlur', name: 'Domlur', lat: 12.9610, lng: 77.6370 },
  { id: 'varthur', name: 'Varthur', lat: 12.9400, lng: 77.7400 },
  { id: 'brookefield', name: 'Brookefield', lat: 12.9570, lng: 77.7250 },
  { id: 'kadugodi', name: 'Kadugodi', lat: 12.9900, lng: 77.7600 },
  { id: 'hoodi', name: 'Hoodi', lat: 12.9880, lng: 77.7150 },
  { id: 'harlur', name: 'Harlur', lat: 12.9100, lng: 77.6600 },
  { id: 'sarjapur-road', name: 'Sarjapur Road', lat: 12.9100, lng: 77.6850 },
  { id: 'bellandur', name: 'Bellandur', lat: 12.9260, lng: 77.6780 },
  { id: 'hebbal', name: 'Hebbal', lat: 13.0358, lng: 77.5970 },
  { id: 'yelahanka', name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { id: 'sahakara-nagar', name: 'Sahakara Nagar', lat: 13.0600, lng: 77.5800 },
  { id: 'rt-nagar', name: 'RT Nagar', lat: 13.0218, lng: 77.5940 },
  { id: 'hennur', name: 'Hennur', lat: 13.0450, lng: 77.6350 },
  { id: 'thanisandra', name: 'Thanisandra', lat: 13.0600, lng: 77.6400 },
  { id: 'nagavara', name: 'Nagavara', lat: 13.0440, lng: 77.6150 },
  { id: 'jakkur', name: 'Jakkur', lat: 13.0700, lng: 77.6050 },
  { id: 'devanahalli', name: 'Devanahalli', lat: 13.2468, lng: 77.7107 },
  { id: 'kogilu', name: 'Kogilu', lat: 13.0800, lng: 77.5950 },
  { id: 'malleshwaram', name: 'Malleshwaram', lat: 13.0035, lng: 77.5648 },
  { id: 'rajajinagar', name: 'Rajajinagar', lat: 12.9910, lng: 77.5520 },
  { id: 'vijayanagar', name: 'Vijayanagar', lat: 12.9700, lng: 77.5350 },
  { id: 'nagarbhavi', name: 'Nagarbhavi', lat: 12.9610, lng: 77.5100 },
  { id: 'peenya', name: 'Peenya', lat: 13.0290, lng: 77.5210 },
  { id: 'yeshwanthpur', name: 'Yeshwanthpur', lat: 13.0230, lng: 77.5540 },
  { id: 'mahalakshmi-layout', name: 'Mahalakshmi Layout', lat: 13.0100, lng: 77.5480 },
  { id: 'basaveshwara-nagar', name: 'Basaveshwara Nagar', lat: 12.9880, lng: 77.5380 },
  { id: 'kengeri', name: 'Kengeri', lat: 12.9070, lng: 77.4850 },
  { id: 'rajarajeshwari-nagar', name: 'RR Nagar', lat: 12.9200, lng: 77.5100 },
  { id: 'electronic-city', name: 'Electronic City', lat: 12.8399, lng: 77.6770 },
  { id: 'bommanahalli', name: 'Bommanahalli', lat: 12.8990, lng: 77.6200 },
  { id: 'madiwala', name: 'Madiwala', lat: 12.9210, lng: 77.6150 },
  { id: 'silk-board', name: 'Silk Board Area', lat: 12.9170, lng: 77.6230 },
  { id: 'hosa-road', name: 'Hosa Road', lat: 12.8700, lng: 77.6900 },
  { id: 'begur', name: 'Begur', lat: 12.8750, lng: 77.6350 },
  { id: 'arekere', name: 'Arekere', lat: 12.8950, lng: 77.6050 },
  { id: 'ramamurthy-nagar', name: 'Ramamurthy Nagar', lat: 13.0150, lng: 77.6680 },
  { id: 'banaswadi', name: 'Banaswadi', lat: 13.0100, lng: 77.6450 },
  { id: 'kalyan-nagar', name: 'Kalyan Nagar', lat: 13.0270, lng: 77.6360 },
  { id: 'hbr-layout', name: 'HBR Layout', lat: 13.0350, lng: 77.6200 },
  { id: 'kammanahalli', name: 'Kammanahalli', lat: 13.0150, lng: 77.6400 },
  { id: 'mysore-road', name: 'Mysore Road', lat: 12.9550, lng: 77.5200 },
  { id: 'nayandahalli', name: 'Nayandahalli', lat: 12.9550, lng: 77.5100 },
  { id: 'chord-road', name: 'Chord Road', lat: 12.9800, lng: 77.5350 },
  { id: 'outer-ring-road-east', name: 'ORR East (Marathahalli–Sarjapur)', lat: 12.9400, lng: 77.6950 },
  { id: 'outer-ring-road-north', name: 'ORR North (Hebbal–KR Puram)', lat: 13.0200, lng: 77.6500 },
  { id: 'sadashivanagar', name: 'Sadashivanagar', lat: 13.0050, lng: 77.5780 },
  { id: 'vasanth-nagar', name: 'Vasanth Nagar', lat: 12.9880, lng: 77.5920 },
  { id: 'richmond-town', name: 'Richmond Town', lat: 12.9650, lng: 77.5980 },
  { id: 'langford-town', name: 'Langford Town', lat: 12.9500, lng: 77.5900 },
  { id: 'frazer-town', name: 'Frazer Town', lat: 12.9980, lng: 77.6120 },
  { id: 'ulsoor', name: 'Ulsoor', lat: 12.9820, lng: 77.6200 },
  { id: 'austin-town', name: 'Austin Town', lat: 12.9680, lng: 77.6150 },
  { id: 'anekal', name: 'Anekal', lat: 12.7100, lng: 77.6950 },
  { id: 'chandapura', name: 'Chandapura', lat: 12.8000, lng: 77.7050 },
  { id: 'bannerghatta-road', name: 'Bannerghatta Road', lat: 12.8700, lng: 77.5950 },
  { id: 'tumkur-road', name: 'Tumkur Road', lat: 13.0500, lng: 77.5200 },
  { id: 'jalahalli', name: 'Jalahalli', lat: 13.0450, lng: 77.5350 },
  { id: 'vidyaranyapura', name: 'Vidyaranyapura', lat: 13.0750, lng: 77.5550 },
];

interface OverpassCountElement {
  tags?: {
    nodes?: number;
    ways?: number;
  };
}

function calculateScores(counts: number[]) {
  // Extract counts
  const [schools, healthcare, parks, entertainment, fire_stations, industrial] = counts;

  // Formulas
  let schools_score = 10;
  if (schools >= 10) schools_score = 95;
  else if (schools >= 7) schools_score = 80;
  else if (schools >= 4) schools_score = 65;
  else if (schools >= 2) schools_score = 45;
  else if (schools === 1) schools_score = 25;

  let healthcare_score = 10;
  if (healthcare >= 7) healthcare_score = 90;
  else if (healthcare >= 4) healthcare_score = 75;
  else if (healthcare >= 2) healthcare_score = 55;
  else if (healthcare === 1) healthcare_score = 30;

  let parks_score = 10;
  if (parks >= 5) parks_score = 85;
  else if (parks >= 3) parks_score = 60;
  else if (parks >= 1) parks_score = 35;

  let entertainment_score = 10;
  if (entertainment >= 16) entertainment_score = 90;
  else if (entertainment >= 9) entertainment_score = 75;
  else if (entertainment >= 4) entertainment_score = 55;
  else if (entertainment >= 1) entertainment_score = 30;

  let fire_score = 20;
  if (fire_stations >= 2) fire_score = 95;
  else if (fire_stations === 1) fire_score = 70;

  let industrial_score = 90;
  if (industrial >= 3) industrial_score = 15;
  else if (industrial === 2) industrial_score = 35;
  else if (industrial === 1) industrial_score = 60;

  const overall_mood_score = Math.round(
    (schools_score + healthcare_score + parks_score + entertainment_score + fire_score + industrial_score) / 6
  );

  return {
    schools_score, healthcare_score, parks_score, entertainment_score, fire_score, industrial_score, overall_mood_score
  };
}

async function fetchLocationData(lat: number, lng: number) {
  const query = `[out:json][timeout:25];
( node["amenity"="school"](around:1500,${lat},${lng}); way["amenity"="school"](around:1500,${lat},${lng}); ); out count;
( node["amenity"~"hospital|clinic"](around:1500,${lat},${lng}); way["amenity"~"hospital|clinic"](around:1500,${lat},${lng}); ); out count;
( node["leisure"="park"](around:1500,${lat},${lng}); way["leisure"="park"](around:1500,${lat},${lng}); ); out count;
( node["amenity"~"restaurant|cafe|pub|bar|cinema"](around:1500,${lat},${lng}); way["amenity"~"restaurant|cafe|pub|bar|cinema"](around:1500,${lat},${lng}); ); out count;
( node["amenity"="fire_station"](around:1500,${lat},${lng}); way["amenity"="fire_station"](around:1500,${lat},${lng}); ); out count;
( node["landuse"="industrial"](around:1500,${lat},${lng}); way["landuse"="industrial"](around:1500,${lat},${lng}); ); out count;`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.statusText}`);
  }

  const json = await response.json() as { elements?: OverpassCountElement[] };
  const elements = json.elements || [];
  
  if (elements.length < 6) {
    throw new Error('Unexpected Overpass API response format');
  }

  return elements.map((el) => (el.tags?.nodes || 0) + (el.tags?.ways || 0));
}

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
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!isAuthorizedCronRequest(req, supabaseServiceKey)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let updatedCount = 0;
    const failures = [];

    // Process a limited subset per execution to avoid Edge Function timeout limits
    // In production, this would be a CRON job tracking its state, 
    // but for now, we'll run 10 at a time if the user requests it, or perhaps all if timeout allows.
    // Edge functions typically timeout at 5-15s, but Deno on Supabase has slightly generous background limits.
    // However, 80 * 600ms = ~48 seconds. It might pass if the edge function timeout is 60s. 
    // Just in case, this could potentially time out if not careful, but we'll try to process all as requested.

    for (const loc of LOCALITIES) {
      try {
        const counts = await fetchLocationData(loc.lat, loc.lng);
        const {
          schools_score, healthcare_score, parks_score, entertainment_score, fire_score, industrial_score, overall_mood_score
        } = calculateScores(counts);

        const record = {
          locality_name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          schools_count: counts[0],
          healthcare_count: counts[1],
          parks_count: counts[2],
          entertainment_count: counts[3],
          fire_stations_count: counts[4],
          industrial_count: counts[5],
          schools_score,
          healthcare_score,
          parks_score,
          entertainment_score,
          fire_score,
          industrial_score,
          overall_mood_score,
          last_updated: new Date().toISOString()
        };

        const { error } = await supabase
          .from('locality_metrics')
          .upsert(record, { onConflict: 'locality_name' });

        if (error) {
          throw new Error('Supabase upsert error: ' + error.message);
        }

        const { error: historyError } = await supabase
          .from('locality_score_history')
          .upsert({
            locality_name: loc.name,
            overall_mood_score,
            growth_score: null,
            schools_score,
            healthcare_score,
            parks_score,
            entertainment_score,
            snapshot_date: new Date().toISOString().slice(0, 10),
            data_source: 'update-livability-scores',
          }, {
            onConflict: 'locality_name,snapshot_date',
            ignoreDuplicates: true,
          });

        if (historyError) {
          throw new Error('Locality history insert error: ' + historyError.message);
        }

        updatedCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : JSON.stringify(err);
        console.error(`[UpdateLivability] Failed for ${loc.name}:`, message);
        failures.push({ name: loc.name, error: message });
      }

      // Add 600ms delay as asked
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: `Processed ${LOCALITIES.length} localities.`,
        updated: updatedCount,
        failures,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
