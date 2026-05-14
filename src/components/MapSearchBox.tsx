import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LOCALITY_PRICE_MAP } from '@/lib/localityPrices';
import { bengaluruPropertyPrices } from '@/data/bengaluruPropertyPrices';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  isLocal?: boolean;
}

// Coordinates for all localities in LOCALITY_PRICE_MAP
const LOCALITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Sadashivanagar: { lat: 13.0092, lng: 77.5726 },
  'Lavelle Road': { lat: 12.9716, lng: 77.5946 },
  'Cubbon Park Area': { lat: 12.9763, lng: 77.5929 },
  'Cunningham Road': { lat: 12.9833, lng: 77.5917 },
  'MG Road': { lat: 12.9757, lng: 77.6011 },
  'Brigade Road': { lat: 12.9719, lng: 77.6075 },
  'Vasanth Nagar': { lat: 12.9900, lng: 77.5933 },
  'Richmond Town': { lat: 12.9612, lng: 77.5996 },
  Malleshwaram: { lat: 13.0035, lng: 77.5709 },
  'Benson Town': { lat: 13.0012, lng: 77.6089 },
  'Langford Town': { lat: 12.9551, lng: 77.5989 },
  'Frazer Town': { lat: 12.9987, lng: 77.6148 },
  'Cox Town': { lat: 13.0041, lng: 77.6211 },
  'Wilson Garden': { lat: 12.9479, lng: 77.5921 },
  Ulsoor: { lat: 12.9825, lng: 77.6209 },
  'Austin Town': { lat: 12.9637, lng: 77.6201 },
  Shivajinagar: { lat: 12.9856, lng: 77.6010 },
  Jayanagar: { lat: 12.9308, lng: 77.5832 },
  'Jayanagar 4th Block': { lat: 12.9343, lng: 77.5812 },
  Basavanagudi: { lat: 12.9416, lng: 77.5756 },
  Sarakki: { lat: 12.9112, lng: 77.5669 },
  Padmanabhanagar: { lat: 12.9217, lng: 77.5531 },
  Girinagar: { lat: 12.9347, lng: 77.5551 },
  'JP Nagar Phase 1-3': { lat: 12.9107, lng: 77.5845 },
  'JP Nagar Phase 4-6': { lat: 12.9012, lng: 77.5901 },
  'JP Nagar Phase 7-8': { lat: 12.8934, lng: 77.5956 },
  'JP Nagar': { lat: 12.9063, lng: 77.5857 },
  Banashankari: { lat: 12.9256, lng: 77.5468 },
  'Banashankari Stage 3': { lat: 12.9089, lng: 77.5389 },
  'BTM Layout': { lat: 12.9166, lng: 77.6101 },
  'Bannerghatta Road': { lat: 12.8933, lng: 77.5971 },
  'Hosa Road': { lat: 12.8731, lng: 77.6478 },
  Hulimavu: { lat: 12.8837, lng: 77.6089 },
  Bilekahalli: { lat: 12.8923, lng: 77.6198 },
  Arekere: { lat: 12.8801, lng: 77.6156 },
  Begur: { lat: 12.8712, lng: 77.6234 },
  'Begur Road': { lat: 12.8756, lng: 77.6187 },
  Gottigere: { lat: 12.8634, lng: 77.6023 },
  Uttarahalli: { lat: 12.9023, lng: 77.5289 },
  'Kanakapura Road': { lat: 12.8812, lng: 77.5712 },
  Bommanahalli: { lat: 12.8998, lng: 77.6401 },
  Haralur: { lat: 12.8923, lng: 77.6678 },
  'Haralur Road': { lat: 12.8956, lng: 77.6645 },
  Choodasandra: { lat: 12.8889, lng: 77.6712 },
  'Electronic City': { lat: 12.8399, lng: 77.6770 },
  'Electronic City Phase 2': { lat: 12.8289, lng: 77.6812 },
  'Electronic City Toll': { lat: 12.8445, lng: 77.6734 },
  Chandapura: { lat: 12.8012, lng: 77.6934 },
  Attibele: { lat: 12.7756, lng: 77.7634 },
  Jigani: { lat: 12.7923, lng: 77.6312 },
  Madivala: { lat: 12.9234, lng: 77.6234 },
  'Silk Board Junction': { lat: 12.9172, lng: 77.6227 },
  'Silk Board Area': { lat: 12.9167, lng: 77.6201 },
  Koramangala: { lat: 12.9352, lng: 77.6245 },
  Indiranagar: { lat: 12.9784, lng: 77.6408 },
  Domlur: { lat: 12.9612, lng: 77.6398 },
  Kodihalli: { lat: 12.9578, lng: 77.6489 },
  'Old Airport Road': { lat: 12.9612, lng: 77.6534 },
  Murugeshpalya: { lat: 12.9634, lng: 77.6556 },
  'HSR Layout': { lat: 12.9116, lng: 77.6473 },
  Bellandur: { lat: 12.9256, lng: 77.6701 },
  'Sarjapur Road': { lat: 12.9089, lng: 77.6789 },
  Marathahalli: { lat: 12.9591, lng: 77.6972 },
  'Marathahalli Bridge': { lat: 12.9545, lng: 77.7012 },
  Whitefield: { lat: 12.9698, lng: 77.7499 },
  'Whitefield Main Road': { lat: 12.9712, lng: 77.7401 },
  ITPL: { lat: 12.9863, lng: 77.7270 },
  Hoodi: { lat: 12.9812, lng: 77.7145 },
  Brookefield: { lat: 12.9756, lng: 77.7201 },
  Kundalahalli: { lat: 12.9745, lng: 77.7089 },
  Kaggadasapura: { lat: 12.9901, lng: 77.6823 },
  Mahadevapura: { lat: 12.9934, lng: 77.7012 },
  'KR Puram': { lat: 13.0089, lng: 77.6934 },
  Varthur: { lat: 12.9412, lng: 77.7401 },
  Kadugodi: { lat: 12.9923, lng: 77.7623 },
  Hoskote: { lat: 13.0712, lng: 77.7989 },
  Banaswadi: { lat: 13.0112, lng: 77.6534 },
  'HRBR Layout': { lat: 13.0145, lng: 77.6489 },
  'HBR Layout': { lat: 13.0178, lng: 77.6412 },
  Kammanahalli: { lat: 13.0089, lng: 77.6378 },
  Horamavu: { lat: 13.0212, lng: 77.6623 },
  'Horamavu Agara': { lat: 13.0178, lng: 77.6656 },
  'Kalyan Nagar': { lat: 13.0256, lng: 77.6489 },
  'Ramamurthy Nagar': { lat: 13.0312, lng: 77.6701 },
  Hebbal: { lat: 13.0456, lng: 77.5912 },
  'Manyata Tech Park Area': { lat: 13.0478, lng: 77.6212 },
  'RT Nagar': { lat: 13.0234, lng: 77.5923 },
  'Sahakara Nagar': { lat: 13.0534, lng: 77.5934 },
  Vidyaranyapura: { lat: 13.0623, lng: 77.5556 },
  Jakkur: { lat: 13.0712, lng: 77.5923 },
  'Hennur Road': { lat: 13.0423, lng: 77.6345 },
  Thanisandra: { lat: 13.0567, lng: 77.6278 },
  Kothanur: { lat: 13.0634, lng: 77.5812 },
  Kogilu: { lat: 13.0756, lng: 77.6034 },
  Yelahanka: { lat: 13.1006, lng: 77.5963 },
  'Bagalur Road': { lat: 13.1234, lng: 77.6712 },
  Devanahalli: { lat: 13.2456, lng: 77.7145 },
  Rajajinagar: { lat: 12.9912, lng: 77.5534 },
  Yeshwanthpur: { lat: 13.0234, lng: 77.5389 },
  'Yeshwanthpur Circle': { lat: 13.0212, lng: 77.5367 },
  'BEL Circle': { lat: 13.0312, lng: 77.5489 },
  'Mahalakshmi Layout': { lat: 13.0078, lng: 77.5423 },
  Vijayanagar: { lat: 12.9712, lng: 77.5289 },
  'Chord Road': { lat: 12.9856, lng: 77.5212 },
  Nagarbhavi: { lat: 12.9534, lng: 77.5089 },
  'RR Nagar': { lat: 12.9267, lng: 77.5123 },
  'Mysore Road': { lat: 12.9456, lng: 77.4934 },
  'Magadi Road': { lat: 12.9712, lng: 77.5156 },
  'Rajarajeshwari Nagar': { lat: 12.9234, lng: 77.4923 },
  Kengeri: { lat: 12.9078, lng: 77.4823 },
  Peenya: { lat: 13.0289, lng: 77.5167 },
  'Tumkur Road': { lat: 13.0456, lng: 77.5056 },
  'BEML Layout': { lat: 12.9389, lng: 77.5034 },
  Nelamangala: { lat: 13.0978, lng: 77.3923 },
};

const BENGALURU_BOUNDS = {
  minLat: 12.75,
  maxLat: 13.30,
  minLng: 77.35,
  maxLng: 77.85,
};

const isWithinBengaluru = (lat: number, lng: number) =>
  lat >= BENGALURU_BOUNDS.minLat &&
  lat <= BENGALURU_BOUNDS.maxLat &&
  lng >= BENGALURU_BOUNDS.minLng &&
  lng <= BENGALURU_BOUNDS.maxLng;

// Fuzzy local search — instant, no network
const searchLocally = (query: string): SearchResult[] => {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  return Object.keys(LOCALITY_PRICE_MAP)
    .filter((name) => {
      const n = name.toLowerCase();
      // starts with query (highest priority) or contains query
      return n.startsWith(q) || n.includes(q);
    })
    .sort((a, b) => {
      const an = a.toLowerCase();
      const bn = b.toLowerCase();
      // starts-with results first
      const aStarts = an.startsWith(q) ? 0 : 1;
      const bStarts = bn.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.localeCompare(b);
    })
    .slice(0, 6)
    .map((name) => {
      const coords = LOCALITY_COORDS[name];
      const propData = bengaluruPropertyPrices.find(p => p.name === name);
      const zone = propData?.zone ? `${propData.zone} Zone` : 'Bengaluru Urban';
      
      return {
        display_name: `${name}, ${zone}, Bengaluru, Karnataka, India`,
        lat: coords ? String(coords.lat) : '12.9716',
        lon: coords ? String(coords.lng) : '77.5946',
        type: 'locality',
        importance: 1,
        isLocal: true,
      };
    });
};

interface MapSearchBoxProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  onClear?: () => void;
  containerClassName?: string;
  inputClassName?: string;
}

export const MapSearchBox = ({
  onLocationSelect,
  onClear,
  containerClassName,
  inputClassName,
}: MapSearchBoxProps) => {
  const isDev = import.meta.env.DEV;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const searchNominatim = useCallback(async (searchQuery: string): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Bengaluru')}&viewbox=77.35,12.75,77.85,13.30&bounded=0&countrycodes=in&limit=5`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data: unknown = await response.json();

      if (!controller.signal.aborted && isMountedRef.current) {
        const nominatimResults = Array.isArray(data)
          ? data.filter((result): result is SearchResult => {
            if (!result || typeof result !== 'object') return false;
            const c = result as Partial<SearchResult>;
            if (
              typeof c.display_name !== 'string' ||
              typeof c.lat !== 'string' ||
              typeof c.lon !== 'string'
            ) return false;
            const lat = Number.parseFloat(c.lat);
            const lng = Number.parseFloat(c.lon);
            return Number.isFinite(lat) && Number.isFinite(lng) && isWithinBengaluru(lat, lng);
          })
          : [];

        // Merge: local first, then nominatim results not already covered
        const localResults = searchLocally(searchQuery);
        const localNames = new Set(localResults.map((r) => r.display_name.split(',')[0].toLowerCase()));
        const freshNominatim = nominatimResults.filter(
          (r) => !localNames.has(r.display_name.split(',')[0].toLowerCase())
        );
        const merged = [...localResults, ...freshNominatim].slice(0, 6);
        setResults(merged);
        setShowResults(merged.length > 0);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      if (isDev) console.error('Nominatim search failed:', error);
    } finally {
      if (isMountedRef.current) setIsSearching(false);
    }
  }, [isDev]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      abortRef.current?.abort();
      return;
    }

    // Show local results instantly
    const local = searchLocally(value);
    setResults(local);
    setShowResults(local.length > 0);

    // Fire Nominatim after debounce for street/landmark fallback
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void searchNominatim(value);
    }, 500) as unknown as ReturnType<typeof window.setTimeout>;
  };

  const handleSelect = (result: SearchResult): void => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    const name = result.display_name.split(',')[0];
    onLocationSelect(lat, lng, name);
    setQuery(name);
    setShowResults(false);
  };

  const clearSearch = (): void => {
    abortRef.current?.abort();
    setQuery('');
    setResults([]);
    setShowResults(false);
    onClear?.();
  };

  return (
    <div ref={searchRef} className={cn('relative z-[9000]', containerClassName)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search Bengaluru..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className={cn(
            'h-11 border-border bg-background pl-9 pr-9 focus:border-primary font-display font-bold text-sm',
            inputClassName
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2"
            onClick={clearSearch}
            aria-label={isSearching ? 'Searching locations' : 'Clear search'}
          >
            {isSearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[9000] mt-1 max-h-60 overflow-y-auto rounded-sm border border-border bg-background shadow-none">
          {results.map((result) => (
            <button
              key={`${result.display_name}-${result.lat}-${result.lon}`}
              className="w-full px-3 py-2.5 text-left hover:bg-accent/50 transition-colors flex items-start gap-2 border-b border-border/30 last:border-0"
              onClick={() => handleSelect(result)}
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-body text-sm font-bold text-foreground truncate">
                  {result.display_name.split(',')[0]}
                </p>
                <p className="font-body text-xs font-bold text-muted-foreground truncate">
                  {result.display_name.split(',').slice(1, 4).join(',')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[9000] rounded-sm border border-border bg-background shadow-none p-4 text-center">
          <p className="font-body text-sm font-bold text-muted-foreground">
            No locations found in Bengaluru
          </p>
        </div>
      )}
    </div>
  );
};