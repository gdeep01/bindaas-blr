import { useState } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { typography } from '@/lib/typography';
import { toast } from 'sonner';

interface LocationCaptureFieldProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string, locationName?: string) => void;
}

export const LocationCaptureField = ({
  latitude,
  longitude,
  onLocationChange,
}: LocationCaptureFieldProps) => {
  const isDev = import.meta.env.DEV;
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetLocation = (): void => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not available in this browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        let locationName = '';

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          );
          if (!response.ok) {
            throw new Error(`Reverse geocoding failed with status ${response.status}`);
          }
          const data: unknown = await response.json();
          if (data && typeof data === 'object' && 'display_name' in data && typeof data.display_name === 'string') {
            locationName = data.display_name.split(', ').slice(0, 3).join(', ');
          }
        } catch (error) {
          if (isDev) {
            console.error('Reverse geocoding failed:', error);
          }
        }

        onLocationChange(lat, lng, locationName);
        setIsGettingLocation(false);
        toast.success('Location captured.');
      },
      (error) => {
        if (isDev) {
          console.error('Geolocation error:', error);
        }
        setIsGettingLocation(false);
        toast.error('Could not get location. Please enter it manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="latitude" className={typography.label}>
            Latitude
          </Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="12.9716"
            value={latitude}
            onChange={(event) => onLocationChange(event.target.value, longitude)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude" className={typography.label}>
            Longitude
          </Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="77.5946"
            value={longitude}
            onChange={(event) => onLocationChange(latitude, event.target.value)}
            required
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 rounded-sm"
        onClick={handleGetLocation}
        disabled={isGettingLocation}
      >
        {isGettingLocation ? (
          <CheckCircle2 className="h-4 w-4 text-info not-italic" />
        ) : (
          <MapPin className="h-4 w-4 not-italic" />
        )}
        {isGettingLocation ? 'Getting Location' : 'Use My Current Location'}
      </Button>
    </div>
  );
};
