// Simulated traffic data for Bengaluru
// This would be replaced with real API data in production

export const currentSentimentScore = 58;

export const hotspots = [
  { name: 'Silk Board Junction', congestionLevel: 85, trend: 'up' as const, eta: '+45 min' },
  { name: 'Marathahalli Bridge', congestionLevel: 72, trend: 'stable' as const, eta: '+30 min' },
  { name: 'KR Puram', congestionLevel: 68, trend: 'down' as const, eta: '+25 min' },
  { name: 'Hebbal Flyover', congestionLevel: 55, trend: 'up' as const, eta: '+18 min' },
  { name: 'Electronic City', congestionLevel: 45, trend: 'down' as const, eta: '+12 min' },
  { name: 'Whitefield Main Road', congestionLevel: 62, trend: 'stable' as const, eta: '+22 min' },
];

export const hourlyTrendData = [
  { time: '6 AM', congestion: 15, predicted: undefined },
  { time: '7 AM', congestion: 35, predicted: undefined },
  { time: '8 AM', congestion: 65, predicted: undefined },
  { time: '9 AM', congestion: 82, predicted: undefined },
  { time: '10 AM', congestion: 70, predicted: undefined },
  { time: '11 AM', congestion: 55, predicted: undefined },
  { time: '12 PM', congestion: 48, predicted: undefined },
  { time: '1 PM', congestion: 52, predicted: undefined },
  { time: '2 PM', congestion: 45, predicted: undefined },
  { time: '3 PM', congestion: 50, predicted: undefined },
  { time: '4 PM', congestion: 58, predicted: 62 },
  { time: '5 PM', congestion: undefined, predicted: 78 },
  { time: '6 PM', congestion: undefined, predicted: 88 },
  { time: '7 PM', congestion: undefined, predicted: 75 },
  { time: '8 PM', congestion: undefined, predicted: 55 },
  { time: '9 PM', congestion: undefined, predicted: 35 },
];

export const weeklyData = [
  { day: 'Mon', avg: 62 },
  { day: 'Tue', avg: 58 },
  { day: 'Wed', avg: 55 },
  { day: 'Thu', avg: 60 },
  { day: 'Fri', avg: 72 },
  { day: 'Sat', avg: 45 },
  { day: 'Sun', avg: 32 },
];

export const liveFeeds = [
  { location: 'Silk Board Junction', status: 'live' as const },
  { location: 'MG Road Metro', status: 'live' as const },
  { location: 'Koramangala 5th Block', status: 'live' as const },
  { location: 'Indiranagar 100ft Road', status: 'offline' as const },
];

export const insights = {
  avgCommute: '48 min',
  avgCommuteChange: '+8%',
  peakHour: '9:00 AM',
  clearestTime: '2:00 PM',
  incidentsToday: 12,
  roadworks: 5,
};
