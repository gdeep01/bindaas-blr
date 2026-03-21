import { LandslidePanel } from '@/components/LandslidePanel';
import { typography } from '@/lib/typography';

const LandslidePage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={typography.h1}>Landslide &amp; Natural Disasters</h1>
        <p className={`${typography.body} mt-1`}>Karnataka landslide risk zones, earthquake monitoring, and NASA natural event tracking.</p>
      </div>
      <LandslidePanel />
    </div>
  );
};

export default LandslidePage;
