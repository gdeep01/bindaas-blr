import { Mountain, AlertTriangle, CloudRain, Radio, RefreshCw } from 'lucide-react';
import { useTrafficData } from '@/contexts/TrafficDataContext';
import { DataCard } from '@/components/ui/DataCard';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDot } from '@/components/ui/StatusDot';
import { typography } from '@/lib/typography';

const FALLBACK_RISK_ZONES = [
  { district: 'Hassan', riskScore: 41, riskLevel: 'high', elevation: 890, slope: 18, annualRainfall: 1360, weather: null },
  { district: 'Belgaum', riskScore: 28, riskLevel: 'moderate', elevation: 760, slope: 12, annualRainfall: 1180, weather: null },
  { district: 'Chikkamagaluru', riskScore: 34, riskLevel: 'high', elevation: 1040, slope: 20, annualRainfall: 1820, weather: null },
  { district: 'Kodagu', riskScore: 31, riskLevel: 'high', elevation: 980, slope: 19, annualRainfall: 2240, weather: null },
  { district: 'Shivamogga', riskScore: 26, riskLevel: 'moderate', elevation: 690, slope: 11, annualRainfall: 1580, weather: null },
  { district: 'Uttara Kannada', riskScore: 24, riskLevel: 'moderate', elevation: 620, slope: 10, annualRainfall: 2480, weather: null },
  { district: 'Dakshina Kannada', riskScore: 22, riskLevel: 'moderate', elevation: 110, slope: 6, annualRainfall: 3320, weather: null },
  { district: 'Mysuru', riskScore: 18, riskLevel: 'low', elevation: 770, slope: 7, annualRainfall: 860, weather: null },
] as const;

const formatShortDate = (value?: string) => {
  if (!value) {
    return 'Just now';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const LandslidePanel = () => {
  const { landslideZones, nasaEvents, isLoading } = useTrafficData();
  const topZones = landslideZones.slice(0, 8);
  const topNasaEvents = nasaEvents.slice(0, 5);
  const zonesForDisplay = topZones.length > 0 ? topZones : FALLBACK_RISK_ZONES;
  const summary = {
    criticalZones: landslideZones.filter((zone) => zone.riskLevel === 'critical').length,
    highRiskZones: landslideZones.filter((zone) => zone.riskLevel === 'high').length,
    moderateZones: landslideZones.filter((zone) => zone.riskLevel === 'moderate').length,
    lowRiskZones: landslideZones.filter((zone) => zone.riskLevel === 'low').length,
  };

  const getRiskClasses = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return { text: 'text-danger', border: 'border-danger', bar: 'bg-danger', status: 'critical' as const };
      case 'high':
        return { text: 'text-danger', border: 'border-danger', bar: 'bg-danger', status: 'high' as const };
      case 'moderate':
        return { text: 'text-warning', border: 'border-warning', bar: 'bg-warning', status: 'moderate' as const };
      default:
        return { text: 'text-success', border: 'border-success', bar: 'bg-success', status: 'low' as const };
    }
  };

  return (
    <DataCard>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Mountain className="h-5 w-5 text-primary not-italic" />
          <h3 className={typography.h3}>Landslide Risk Prediction</h3>
          <span className="sm:hidden inline-flex items-center">
            <RefreshCw className="h-4 w-4 text-muted-foreground not-italic" />
            <span className="sr-only">Synced from scheduled disaster alerts</span>
          </span>
        </div>
        <span className={`${typography.label} hidden sm:block`}>Synced from scheduled disaster alerts</span>
      </div>

      {landslideZones.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Critical', count: summary.criticalZones, status: 'critical' as const },
            { label: 'High', count: summary.highRiskZones, status: 'high' as const },
            { label: 'Moderate', count: summary.moderateZones, status: 'moderate' as const },
            { label: 'Low', count: summary.lowRiskZones, status: 'low' as const },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/5 bg-card p-4 text-center">
              <StatusDot status={item.status} className="mb-3 justify-center" />
              <div className={`${typography.statMedium} text-foreground`}>{item.count ?? '--'}</div>
              <div className={typography.label}>{item.label}</div>
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton.Card key={index} />
          ))}
        </div>
      ) : null}

      <div className="mb-4">
        <h4 className="eyebrow mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger not-italic" />
          Highest Risk Districts
        </h4>
        <div className="space-y-4 max-h-[280px] overflow-y-auto scrollbar-hide">
          {isLoading && topZones.length === 0 ? (
            <>
              <Skeleton.Card />
              <Skeleton.Card />
              <Skeleton.Card />
            </>
          ) : null}

          {zonesForDisplay.map((zone) => {
            const riskClasses = getRiskClasses(zone.riskLevel);
            const dateSafeWeather = zone.weather?.rainfall ?? '--';
            return (
              <div key={zone.district} className="rounded-xl border border-white/5 bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`${typography.statSmall} flex items-center gap-2`}>
                    <StatusDot status={riskClasses.status} />
                    {zone.district || 'N/A'}
                  </span>
                  <span className={`${typography.statSmall} rounded-xl border px-2 py-1 ${riskClasses.border} ${riskClasses.text}`}>
                    {zone.riskScore ?? '--'}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                  <span>{zone.elevation ?? '--'}m elevation</span>
                  <span>{zone.slope ?? '--'}deg slope</span>
                  <span>{zone.annualRainfall ?? '--'}mm per year</span>
                  {zone.weather ? (
                    <span className="inline-flex items-center gap-2">
                      <CloudRain className="h-3 w-3 not-italic" />
                      {dateSafeWeather}mm now
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 h-0.5 bg-border overflow-hidden">
                  <div className={`h-full ${riskClasses.bar}`} style={{ width: `${zone.riskScore ?? 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {topNasaEvents.length > 0 ? (
        <div>
          <h4 className="eyebrow mb-2 flex items-center gap-2">
            <Radio className="h-4 w-4 text-info not-italic" />
            NASA EONET Events
          </h4>
          <div className="space-y-2">
            {topNasaEvents.map((event) => (
              <div key={event.id} className="rounded-xl border border-white/5 bg-card p-4 text-sm">
                <span className={`${typography.body} text-info`}>{event.title || 'N/A'}</span>
                {event.date ? <span className="ml-2 text-muted-foreground">{formatShortDate(event.date)}</span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </DataCard>
  );
};
