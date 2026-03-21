import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

const BENGALURU_BOUNDS = {
  minLat: 12.75,
  maxLat: 13.15,
  minLng: 77.4,
  maxLng: 77.85,
};

const isWithinBengaluru = (lat: number, lng: number) =>
  lat >= BENGALURU_BOUNDS.minLat &&
  lat <= BENGALURU_BOUNDS.maxLat &&
  lng >= BENGALURU_BOUNDS.minLng &&
  lng <= BENGALURU_BOUNDS.maxLng;

interface MapSearchBoxProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  onClear?: () => void;
  containerClassName?: string;
  inputClassName?: string;
}

export const MapSearchBox = ({ onLocationSelect, onClear, containerClassName, inputClassName }: MapSearchBoxProps) => {
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
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  const searchLocation = async (searchQuery: string): Promise<void> => {
    if (searchQuery.length < 3) {
      abortRef.current?.abort();
      setIsSearching(false);
      setResults([]);
      setShowResults(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);
    try {
      // Search with bias towards Bengaluru area
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=77.40,12.75,77.85,13.15&bounded=1&countrycodes=in&limit=6`,
        {
          headers: {
            'Accept-Language': 'en',
          },
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`);
      }
      const data: unknown = await response.json();
      if (!controller.signal.aborted) {
        const bengaluruResults = Array.isArray(data)
          ? data.filter((result): result is SearchResult => {
              if (!result || typeof result !== 'object') {
                return false;
              }
              const candidate = result as Partial<SearchResult>;
              if (
                typeof candidate.display_name !== 'string' ||
                typeof candidate.lat !== 'string' ||
                typeof candidate.lon !== 'string'
              ) {
                return false;
              }
              const lat = Number.parseFloat(candidate.lat);
              const lng = Number.parseFloat(candidate.lon);
              return Number.isFinite(lat) && Number.isFinite(lng) && isWithinBengaluru(lat, lng);
            })
          : [];
        setResults(bengaluruResults);
        setShowResults(true);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      if (isDev) {
        console.error('Search failed:', error);
      }
      setResults([]);
      setShowResults(false);
    } finally {
      if (isMountedRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      void searchLocation(value);
    }, 400) as unknown as ReturnType<typeof window.setTimeout>;
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
    <div ref={searchRef} className={cn("relative z-[9000]", containerClassName)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search Bengaluru..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className={cn("h-11 border-border bg-background pl-9 pr-9 focus:border-primary font-display font-bold text-sm", inputClassName)}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2"
            onClick={clearSearch}
            aria-label={isSearching ? 'Searching locations' : 'Clear search'}
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
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

      {showResults && query.length >= 3 && results.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[9000] rounded-sm border border-border bg-background shadow-none p-4 text-center">
          <p className="font-body text-sm font-bold text-muted-foreground">No locations found in Bengaluru</p>
        </div>
      )}
    </div>
  );
};
