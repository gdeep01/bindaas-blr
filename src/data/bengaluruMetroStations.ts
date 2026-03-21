export interface MetroStation {
  name: string;
  lat: number;
  lng: number;
  line: 'purple' | 'green' | 'yellow';
  isInterchange: boolean;
}

export const METRO_LINE_COLORS: Record<MetroStation['line'], string> = {
  purple: 'hsl(var(--metro-purple))',
  green: 'hsl(var(--metro-green))',
  yellow: 'hsl(var(--metro-yellow))',
};

export const METRO_LINE_LABELS: Record<MetroStation['line'], string> = {
  purple: 'Purple Line',
  green: 'Green Line',
  yellow: 'Yellow Line',
};

export const bengaluruMetroStations: MetroStation[] = [
  { name: 'Baiyappanahalli', lat: 12.9908, lng: 77.6525, line: 'purple', isInterchange: false },
  { name: 'Swami Vivekananda Road', lat: 12.9854, lng: 77.6449, line: 'purple', isInterchange: false },
  { name: 'Indiranagar', lat: 12.9786, lng: 77.6409, line: 'purple', isInterchange: false },
  { name: 'Halasuru', lat: 12.9778, lng: 77.6267, line: 'purple', isInterchange: false },
  { name: 'Trinity', lat: 12.9736, lng: 77.6175, line: 'purple', isInterchange: false },
  { name: 'MG Road', lat: 12.9755, lng: 77.6065, line: 'purple', isInterchange: false },
  { name: 'Cubbon Park', lat: 12.9798, lng: 77.5975, line: 'purple', isInterchange: false },
  { name: 'Dr B. R. Ambedkar Station, Vidhana Soudha', lat: 12.9799, lng: 77.5917, line: 'purple', isInterchange: false },
  { name: 'Sir M. Visvesvaraya Station, Central College', lat: 12.9765, lng: 77.5848, line: 'purple', isInterchange: false },
  { name: 'Nadaprabhu Kempegowda Station, Majestic', lat: 12.9785, lng: 77.5724, line: 'purple', isInterchange: true },
  { name: 'City Railway Station', lat: 12.9766, lng: 77.5668, line: 'purple', isInterchange: false },
  { name: 'Magadi Road', lat: 12.9742, lng: 77.5558, line: 'purple', isInterchange: false },
  { name: 'Hosahalli', lat: 12.9731, lng: 77.5471, line: 'purple', isInterchange: false },
  { name: 'Vijayanagar', lat: 12.972, lng: 77.5404, line: 'purple', isInterchange: false },
  { name: 'Attiguppe', lat: 12.961, lng: 77.5331, line: 'purple', isInterchange: false },
  { name: 'Deepanjali Nagar', lat: 12.9526, lng: 77.5268, line: 'purple', isInterchange: false },
  { name: 'Mysore Road', lat: 12.9468, lng: 77.5301, line: 'purple', isInterchange: false },

  { name: 'Nagasandra', lat: 13.0488, lng: 77.5001, line: 'green', isInterchange: false },
  { name: 'Dasarahalli', lat: 13.0437, lng: 77.5127, line: 'green', isInterchange: false },
  { name: 'Jalahalli', lat: 13.0473, lng: 77.5264, line: 'green', isInterchange: false },
  { name: 'Peenya Industry', lat: 13.0325, lng: 77.5192, line: 'green', isInterchange: false },
  { name: 'Peenya', lat: 13.0288, lng: 77.5189, line: 'green', isInterchange: false },
  { name: 'Goraguntepalya', lat: 13.0282, lng: 77.5401, line: 'green', isInterchange: false },
  { name: 'Yeshwanthpur', lat: 13.0232, lng: 77.5488, line: 'green', isInterchange: true },
  { name: 'Sandal Soap Factory', lat: 13.0147, lng: 77.5537, line: 'green', isInterchange: false },
  { name: 'Mahalakshmi', lat: 13.0094, lng: 77.5495, line: 'green', isInterchange: false },
  { name: 'Rajajinagar', lat: 13.0009, lng: 77.5528, line: 'green', isInterchange: false },
  { name: 'Kuvempu Road', lat: 12.9984, lng: 77.5468, line: 'green', isInterchange: false },
  { name: 'Srirampura', lat: 12.9918, lng: 77.571, line: 'green', isInterchange: false },
  { name: 'Mantri Square Sampige Road', lat: 12.9911, lng: 77.5713, line: 'green', isInterchange: false },
  { name: 'Nadaprabhu Kempegowda Station, Majestic', lat: 12.9785, lng: 77.5724, line: 'green', isInterchange: true },
  { name: 'Chickpete', lat: 12.9697, lng: 77.5763, line: 'green', isInterchange: false },
  { name: 'Krishna Rajendra Market', lat: 12.9632, lng: 77.5736, line: 'green', isInterchange: false },
  { name: 'National College', lat: 12.9501, lng: 77.5739, line: 'green', isInterchange: false },
  { name: 'Lalbagh', lat: 12.9488, lng: 77.5847, line: 'green', isInterchange: false },
  { name: 'South End Circle', lat: 12.9353, lng: 77.5802, line: 'green', isInterchange: false },
  { name: 'Jayanagar', lat: 12.9294, lng: 77.5838, line: 'green', isInterchange: false },
  { name: 'Rashtreeya Vidyalaya Road', lat: 12.9181, lng: 77.5823, line: 'green', isInterchange: true },
  { name: 'Banashankari', lat: 12.9152, lng: 77.5736, line: 'green', isInterchange: false },
  { name: 'Jaya Prakash Nagar', lat: 12.9078, lng: 77.5786, line: 'green', isInterchange: false },
  { name: 'Yelachenahalli', lat: 12.8941, lng: 77.5704, line: 'green', isInterchange: false },
  { name: 'Konanakunte Cross', lat: 12.8847, lng: 77.5649, line: 'green', isInterchange: false },
  { name: 'Doddakallasandra', lat: 12.8767, lng: 77.5668, line: 'green', isInterchange: false },
  { name: 'Vajarahalli', lat: 12.8675, lng: 77.5636, line: 'green', isInterchange: false },
  { name: 'Thalaghattapura', lat: 12.8617, lng: 77.5584, line: 'green', isInterchange: false },
  { name: 'Silk Institute', lat: 12.8494, lng: 77.5488, line: 'green', isInterchange: false },

  { name: 'Rashtreeya Vidyalaya Road', lat: 12.9181, lng: 77.5823, line: 'yellow', isInterchange: true },
  { name: 'Jayadeva Hospital', lat: 12.9163, lng: 77.5988, line: 'yellow', isInterchange: true },
  { name: 'BTM Layout', lat: 12.9168, lng: 77.6102, line: 'yellow', isInterchange: false },
  { name: 'Central Silk Board', lat: 12.9173, lng: 77.6229, line: 'yellow', isInterchange: true },
  { name: 'Bommanahalli', lat: 12.9006, lng: 77.6244, line: 'yellow', isInterchange: false },
  { name: 'Hongasandra', lat: 12.8921, lng: 77.6385, line: 'yellow', isInterchange: false },
  { name: 'Kudlu Gate', lat: 12.8895, lng: 77.6526, line: 'yellow', isInterchange: false },
  { name: 'Singasandra', lat: 12.8798, lng: 77.6588, line: 'yellow', isInterchange: false },
  { name: 'Hosa Road', lat: 12.8706, lng: 77.6649, line: 'yellow', isInterchange: false },
  { name: 'Beratena Agrahara', lat: 12.8645, lng: 77.6722, line: 'yellow', isInterchange: false },
  { name: 'Konappana Agrahara', lat: 12.8571, lng: 77.6775, line: 'yellow', isInterchange: false },
  { name: 'Electronic City', lat: 12.8482, lng: 77.6778, line: 'yellow', isInterchange: false },
  { name: 'Huskur Road', lat: 12.8414, lng: 77.6842, line: 'yellow', isInterchange: false },
  { name: 'Hebbagodi', lat: 12.8355, lng: 77.6918, line: 'yellow', isInterchange: false },
  { name: 'Bommasandra', lat: 12.8168, lng: 77.6924, line: 'yellow', isInterchange: false },
];
