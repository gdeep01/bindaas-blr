import { AIPredictionsPanel } from '@/components/AIPredictionsPanel';
import { typography } from '@/lib/typography';

const AIInsightsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={typography.h1}>Smart Predictions</h1>
        <p className={`${typography.body} mt-1`}>AI-powered analysis, predictions, and route recommendations for Bengaluru travel patterns.</p>
      </div>
      <AIPredictionsPanel />
    </div>
  );
};

export default AIInsightsPage;
