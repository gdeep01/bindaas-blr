import { useLocation } from 'react-router-dom';
import { MoodIndexPanel } from '@/components/MoodIndexPanel';
import { typography } from '@/lib/typography';

const MoodIndexPage = () => {
  const location = useLocation();
  const isComparePage = location.pathname === '/compare';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif italic font-bold text-4xl md:text-5xl text-white tracking-tight leading-none">{isComparePage ? 'Compare Areas' : 'Area Livability'}</h1>
        <p className="font-sans text-sm text-white/60 font-light tracking-wide mt-2">
          Livability scores (0{'\u2013'}100) estimated from publicly available data & proximity analysis.
        </p>
      </div>

      <MoodIndexPanel />
    </div>
  );
};

export default MoodIndexPage;
