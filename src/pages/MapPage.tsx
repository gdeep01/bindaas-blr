import { useMemo } from 'react';
import { TrafficMap } from '@/components/TrafficMap';
import { useTrafficData } from '@/contexts/TrafficDataContext';

const MapPage = () => {
  const { trafficData, metrics, garbagePoints, isLoading, landslideZones, earthquakes, nasaEvents } = useTrafficData();
  const mapLocations = useMemo(
    () =>
      (trafficData?.hotspots || []).map((h) => ({
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        congestionLevel: h.congestionLevel,
        trend: h.trend,
        eta: h.eta,
      })),
    [trafficData?.hotspots],
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen">
      <TrafficMap
        variant="fullpage"
        hideGarbageLayers
        hiddenLayerKeys={['garbageOfficial', 'garbageCommunity']}
        locations={mapLocations}
        incidents={metrics?.incidents || []}
        roadWorks={metrics?.roadWorks || []}
        garbagePoints={garbagePoints}
        isLoading={isLoading}
        landslideZones={landslideZones}
        earthquakes={earthquakes}
        nasaEvents={nasaEvents}
      />
    </div>
  );
};

export default MapPage;
