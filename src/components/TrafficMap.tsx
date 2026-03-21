import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Car, Smile, Layers3, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapSearchBox } from '@/components/MapSearchBox';
import { LandslideRiskZone, Earthquake, NASAEvent } from '@/lib/landslideApi';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatusDot } from '@/components/ui/StatusDot';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_LAYERS, GarbagePoint, getInitialLayers, Incident, MapLayers, RoadWork, TrafficLocation } from '@/lib/mapConstants';
import { typography } from '@/lib/typography';

const TrafficMapInner = lazy(() => import('./TrafficMapInner'));

interface TrafficMapProps {
  locations: TrafficLocation[];
  incidents?: Incident[];
  roadWorks?: RoadWork[];
  garbagePoints?: GarbagePoint[];
  isLoading?: boolean;
  landslideZones?: LandslideRiskZone[];
  earthquakes?: Earthquake[];
  nasaEvents?: NASAEvent[];
  variant?: 'homepage' | 'fullpage';
  initialLayers?: Partial<MapLayers>;
  title?: string;
  allowMoodMode?: boolean;
  initialView?: { center: [number, number]; zoom: number };
  disableAutoFit?: boolean;
  hideLayerControls?: boolean;
  hiddenLayerKeys?: Array<keyof MapLayers>;
  hideGarbageLayers?: boolean;
  selectedLocation?: { lat: number; lng: number; name: string } | null;
  hideTitle?: boolean;
}

const HOMEPAGE_LAYERS: MapLayers = {
  ...DEFAULT_LAYERS,
  garbageOfficial: false,
  garbageCommunity: false,
  landslide: false,
  earthquakes: false,
  pricePerSqft: false,
  metroAccess: false,
};

const LAYERS_PANEL_WIDTH = 220;

const isLayerHidden = (key: keyof MapLayers, hiddenLayerKeys: Array<keyof MapLayers>, hideGarbageLayers: boolean) => {
  if (hiddenLayerKeys.includes(key)) return true;
  if (hideGarbageLayers && (key === 'garbageOfficial' || key === 'garbageCommunity')) return true;
  return false;
};

const TrafficMapComponent = ({
  locations,
  incidents = [],
  roadWorks = [],
  garbagePoints = [],
  isLoading,
  landslideZones = [],
  earthquakes = [],
  nasaEvents = [],
  variant = 'fullpage',
  initialLayers,
  title,
  allowMoodMode = true,
  initialView,
  disableAutoFit = false,
  hideLayerControls = false,
  hiddenLayerKeys = [],
  hideGarbageLayers = false,
  selectedLocation,
  hideTitle = false,
}: TrafficMapProps) => {
  const isMobile = useIsMobile();
  const isHomepage = variant === 'homepage';
  const isCustomLayerPreset = Boolean(initialLayers);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [mapMode, setMapMode] = useState<'traffic' | 'mood'>('traffic');
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mapLayers, setMapLayers] = useState<MapLayers>(() => ({
    ...(isHomepage ? HOMEPAGE_LAYERS : getInitialLayers()),
    ...(initialLayers ?? {}),
    ...(hideGarbageLayers ? { garbageOfficial: false, garbageCommunity: false } : {}),
  }));

  const stableInitialView = useRef(initialView).current;

  useEffect(() => {
    if (isHomepage) {
      setMapLayers(HOMEPAGE_LAYERS);
      return;
    }
    if (isCustomLayerPreset) {
      return;
    }
    window.localStorage.setItem('mapLayers', JSON.stringify(mapLayers));
  }, [isCustomLayerPreset, isHomepage, mapLayers]);

  useEffect(() => {
    if (!initialLayers) return;
    setMapLayers((current) => ({
      ...current,
      ...initialLayers,
      ...(hideGarbageLayers ? { garbageOfficial: false, garbageCommunity: false } : {}),
    }));
  }, [hideGarbageLayers, initialLayers]);

  useEffect(() => {
    if (!allowMoodMode) {
      setMapMode('traffic');
    }
  }, [allowMoodMode]);

  useEffect(() => {
    if (selectedLocation) {
      setSearchLocation(selectedLocation);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (isHomepage || hideLayerControls) {
      setShowLayerPanel(false);
      return;
    }
    setShowLayerPanel(!isMobile);
  }, [hideLayerControls, isHomepage, isMobile]);

  const handleLocationSelect = useCallback((lat: number, lng: number, name: string) => {
    setSearchLocation({ lat, lng, name });
  }, []);

  const toggleLayer = (layer: keyof MapLayers, checked: boolean) => {
    setMapLayers((current) => ({ ...current, [layer]: checked }));
  };

  const hasIncidents = incidents.length > 0;
  const hasRoadWorks = roadWorks.length > 0;
  const hasGarbage = garbagePoints.length > 0;
  const staticGarbageCount = garbagePoints.filter((point) => point.type !== 'user_report').length;
  const userReportsCount = garbagePoints.filter((point) => point.type === 'user_report').length;

  const mapHeightClass = useMemo(() => {
    if (variant === 'fullpage') {
      return isMobile ? 'h-[calc(100dvh-13rem)]' : 'h-[500px]';
    }
    return isMobile ? 'h-[260px]' : 'h-[250px] sm:h-[300px] md:h-[400px]';
  }, [isMobile, variant]);

  const showDesktopHeader = !isMobile && (variant === 'homepage');
  const showFullpageControls = variant === 'fullpage';
  const showDesktopLegend = !isMobile;
  const showMobileOverlayControls = isMobile && !showFullpageControls;

  const basicLayerItems = useMemo(
    () =>
      ([
        { key: 'traffic', label: 'Traffic' },
        { key: 'incidents', label: 'Incidents' },
        { key: 'roadWorks', label: 'Road Works' },
      ] as const).filter((item) => !isLayerHidden(item.key, hiddenLayerKeys, hideGarbageLayers)),
    [hiddenLayerKeys, hideGarbageLayers],
  );

  const advancedLayerItems = useMemo(
    () =>
      ([
        { key: 'landslide', label: 'Landslide' },
        { key: 'earthquakes', label: 'Earthquakes' },
        { key: 'pricePerSqft', label: 'Property Prices' },
        { key: 'metroAccess', label: 'Metro Access' },
        { key: 'garbageOfficial', label: 'Garbage' },
        { key: 'garbageCommunity', label: 'Garbage (Community)' },
      ] as const).filter((item) => !isLayerHidden(item.key, hiddenLayerKeys, hideGarbageLayers)),
    [hiddenLayerKeys, hideGarbageLayers],
  );

  const legend = (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {mapMode === 'traffic' ? (
        <>
          {mapLayers.traffic ? (
            <>
              <div className="flex items-center gap-2">
                <StatusDot status="low" />
                <span className="text-muted-foreground">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status="moderate" />
                <span className="text-muted-foreground">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status="high" />
                <span className="text-muted-foreground">High</span>
              </div>
            </>
          ) : null}
          {mapLayers.incidents && hasIncidents ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Incidents ({incidents.length})</span>
            </div>
          ) : null}
          {mapLayers.roadWorks && hasRoadWorks ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Road Works ({roadWorks.length})</span>
            </div>
          ) : null}
          {(mapLayers.garbageOfficial || mapLayers.garbageCommunity) && hasGarbage ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Garbage ({staticGarbageCount + userReportsCount})
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <StatusDot status="good" />
            <span className="text-muted-foreground">Thriving</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="live" />
            <span className="text-muted-foreground">Happy</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="moderate" />
            <span className="text-muted-foreground">Okay</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="high" />
            <span className="text-muted-foreground">Struggling</span>
          </div>
        </>
      )}
    </div>
  );

  const layersPanelContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">LAYERS</span>
      </div>

      <div className="space-y-2">
        {basicLayerItems.map((layer) => (
          <div key={layer.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-3 py-2">
            <span className={typography.dataValue}>{layer.label}</span>
            <Switch checked={mapLayers[layer.key]} onCheckedChange={(checked) => toggleLayer(layer.key, checked)} />
          </div>
        ))}
      </div>

      {advancedLayerItems.length ? (
        <div className="rounded-xl border border-white/10 bg-card">
          <button
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
            className="flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-left"
          >
            <span className="eyebrow">
              ADVANCED INSIGHTS
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>
          {advancedOpen ? (
            <div className="space-y-2 px-3 pb-3">
              {advancedLayerItems.map((layer) => (
                <div key={layer.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-3 py-2">
                  <span className={typography.dataValue}>{layer.label}</span>
                  <Switch checked={mapLayers[layer.key]} onCheckedChange={(checked) => toggleLayer(layer.key, checked)} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className={variant === 'homepage' ? 'rounded-xl border border-white/5 bg-card p-4' : 'w-full'}>
        {showDesktopHeader ? (
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h3 className={typography.sectionTitle}>{title || 'Traffic Map'}</h3>
              {allowMoodMode ? (
                <div className="ml-2 flex items-center gap-1 rounded-xl border border-white/10 bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setMapMode('traffic')}
                    className={`min-h-[44px] rounded-xl px-3 py-2 ${typography.navLink} transition-colors ${mapMode === 'traffic' ? 'border border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Car className="h-3.5 w-3.5 not-italic" />
                      Traffic
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode('mood')}
                    className={`min-h-[44px] rounded-xl px-3 py-2 ${typography.navLink} transition-colors ${mapMode === 'mood' ? 'border border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Smile className="h-3.5 w-3.5 not-italic" />
                      Mood
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="max-w-full sm:max-w-xs">
              <MapSearchBox onLocationSelect={handleLocationSelect} onClear={() => setSearchLocation(null)} />
            </div>
          </div>
        ) : null}

        {showFullpageControls ? (
          <div className="relative z-10 bg-[#0a0a0a] py-4">
            {/* Constrained to match nav width */}
            <div className="max-w-[1800px] mx-auto px-4 md:px-8 xl:px-12">
              {!hideTitle ? (
                <>
                  <h1 className={`${typography.h1} mb-2 relative z-10`}>{title || 'Traffic Map'}</h1>
                  <p className={`${typography.body} mb-4`}>Live traffic, incidents, garbage hotspots, and natural disaster data on one map.</p>
                </>
              ) : null}
              {!hideLayerControls ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-full sm:max-w-xs w-full">
                    <MapSearchBox onLocationSelect={handleLocationSelect} onClear={() => setSearchLocation(null)} />
                  </div>
                  {allowMoodMode ? (
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-card p-1">
                      <button
                        type="button"
                        onClick={() => setMapMode('traffic')}
                        className={`min-h-[44px] rounded-xl px-3 py-2 ${typography.navLink} transition-colors ${mapMode === 'traffic' ? 'border border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Car className="h-3.5 w-3.5 not-italic" />
                          Traffic
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapMode('mood')}
                        className={`min-h-[36px] rounded-xl px-3 py-2 ${typography.navLink} transition-colors ${mapMode === 'mood' ? 'border border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Smile className="h-3.5 w-3.5 not-italic" />
                          Mood
                        </span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className={`mb-3 ${variant === 'fullpage' ? 'block' : 'hidden md:block'}`}>{legend}</div>

        <div
          className={`relative overflow-hidden ${mapHeightClass} ${variant === 'homepage' ? 'rounded-xl border border-white/5' : ''}`}
          style={{ maxWidth: '100%', touchAction: 'pan-y' }}
        >
          {showMobileOverlayControls ? (
            <>
              {/* Search bar — floating top */}
              <div
                className="absolute left-3 right-3 top-3 z-[400] overflow-visible"
              >
                <div
                  className="rounded-xl border border-white/10 bg-black/80 p-2"
                  style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                  <MapSearchBox
                    onLocationSelect={handleLocationSelect}
                    onClear={() => setSearchLocation(null)}
                    inputClassName="bg-transparent border-0"
                  />
                </div>
              </div>

              {/* Mode toggle — below search */}
              {allowMoodMode ? (
                <div className="absolute top-[4.5rem] left-1/2 z-[400] -translate-x-1/2">
                  <div
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-black/80 p-1"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setMapMode('traffic')}
                      className={`min-h-[36px] rounded-full px-4 text-[0.7rem] font-black tracking-wide transition-all ${mapMode === 'traffic'
                          ? 'bg-orange-500 text-white'
                          : 'text-white/60 hover:text-white'
                        }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Car className="h-3 w-3 not-italic" />
                        Traffic
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapMode('mood')}
                      className={`min-h-[36px] rounded-full px-4 text-[0.7rem] font-black tracking-wide transition-all ${mapMode === 'mood'
                          ? 'bg-orange-500 text-white'
                          : 'text-white/60 hover:text-white'
                        }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Smile className="h-3 w-3 not-italic" />
                        Mood
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Legend — bottom left */}
              <div
                className="absolute bottom-6 left-3 z-[400] rounded-xl border border-white/10 bg-black/70 px-3 py-2"
                style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                {legend}
              </div>
            </>
          ) : (
            null
          )}

          {/* FAB — standalone, renders on ALL mobile map variants */}
          {isMobile && !isHomepage && !hideLayerControls ? (
            <div
              className="absolute z-[450]"
              style={{
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
                right: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowLayerPanel(true)}
                className="h-14 w-14 rounded-full bg-orange-500 flex items-center justify-center shadow-2xl border-2 border-orange-400"
                aria-label="Open layers"
              >
                <Layers3 className="h-6 w-6 text-white not-italic" />
              </button>
              {(() => {
                const count = Object.values(mapLayers).filter(Boolean).length;
                return count > 0 ? (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-orange-500 pointer-events-none">
                    {count}
                  </div>
                ) : null;
              })()}
            </div>
          ) : null}

          {!isMobile && mapMode === 'traffic' && !isHomepage && !hideLayerControls && showLayerPanel ? (
            <div
              className="absolute right-0 top-0 z-[400] h-full"
              style={{
                width: `${LAYERS_PANEL_WIDTH}px`,
                background: 'hsl(var(--card)/0.95)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="h-full overflow-y-auto p-3">{layersPanelContent}</div>
            </div>
          ) : null}

          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-card p-4">
                <div className="w-full space-y-4">
                  <Skeleton.Text lines={2} />
                  <Skeleton className="h-full w-full" />
                </div>
              </div>
            }
          >
            <div
              className="h-full"
              style={{
                width: !isMobile && mapMode === 'traffic' && showLayerPanel && !isHomepage && !hideLayerControls ? `calc(100% - ${LAYERS_PANEL_WIDTH}px)` : '100%',
                transition: 'width 200ms ease',
              }}
            >
              <TrafficMapInner
                locations={locations}
                incidents={incidents}
                roadWorks={roadWorks}
                garbagePoints={garbagePoints}
                searchLocation={searchLocation}
                mapMode={mapMode}
                mapLayers={mapLayers}
                landslideZones={landslideZones}
                earthquakes={earthquakes}
                nasaEvents={nasaEvents}
                onMapClick={isMobile ? () => setShowLayerPanel(false) : undefined}
                initialView={stableInitialView}
                disableAutoFit={disableAutoFit}
              />
            </div>
          </Suspense>

          {isLoading ? (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md space-y-4">
                <Skeleton.Text lines={2} />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ) : null}
        </div>

        {isHomepage ? (
          <div className="mt-3">
            <Link to="/map" className="text-xs text-muted-foreground transition-colors hover:text-primary">
              Explore full map with all layers {'\u2192'}
            </Link>
          </div>
        ) : null}

      </div>

      {isMobile && !isHomepage && !hideLayerControls ? (
        <>
          {/* Backdrop */}
          {showLayerPanel ? (
            <div
              className="fixed inset-0 z-[1998] bg-black/60"
              role="button"
              aria-label="Close layers"
              tabIndex={0}
              onClick={() => setShowLayerPanel(false)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? setShowLayerPanel(false) : null)}
              style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
            />
          ) : null}

          {/* Bottom sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#111111] px-4 pt-2 pb-safe"
            style={{
              borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              transform: showLayerPanel ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
              maxHeight: '70dvh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'env(safe-area-inset-bottom, 24px)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Map layers"
          >
            {/* Drag handle */}
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-black text-sm tracking-tight text-white">Map Layers</span>
              <button
                type="button"
                onClick={() => setShowLayerPanel(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4 not-italic" />
              </button>
            </div>

            {layersPanelContent}
          </div>
        </>
      ) : null}
    </div>
  );
};

export const TrafficMap = memo(TrafficMapComponent);
