import { Car, Building2, Trees, GraduationCap, HeartPulse, Shield, Sparkles, Flame } from 'lucide-react';

export const cleanMetricLabel = (value: string) => value.replace(/^[A-Z]{2,}\s+/, '').trim();

export const getMetricIcon = (name: string) => {
  const label = cleanMetricLabel(name);
  if (label === 'Quality of Living') return Building2;
  if (label === 'Parks & Green') return Trees;
  if (label === 'Schools') return GraduationCap;
  if (label === 'Healthcare') return HeartPulse;
  if (label === 'Industrial Safety') return Shield;
  if (label === 'Entertainment') return Sparkles;
  if (label === 'Fire Station') return Flame;
  return Car;
};

export const getScoreTextClass = (score: number) => {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
};

