import { cloneElement, isValidElement, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Trash2, Upload, X } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { reportTypes } from '@/data/garbageData';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { typography } from '@/lib/typography';
import { toast } from 'sonner';
import { ImageUploadField, LocationCaptureField } from './garbage';

interface GarbageReportFormProps {
  onReportSubmitted?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

const BENGALURU_BOUNDS = {
  minLat: 12.75,
  maxLat: 13.15,
  minLng: 77.4,
  maxLng: 77.85,
};

const MAX_FILES = 2;

const isWithinBengaluru = (latitude: number, longitude: number) =>
  latitude >= BENGALURU_BOUNDS.minLat &&
  latitude <= BENGALURU_BOUNDS.maxLat &&
  longitude >= BENGALURU_BOUNDS.minLng &&
  longitude <= BENGALURU_BOUNDS.maxLng;

const getFileExtension = (fileName: string) => {
  const segments = fileName.split('.');
  return segments.length > 1 ? segments.at(-1)?.toLowerCase() || 'jpg' : 'jpg';
};

export const GarbageReportForm = ({
  onReportSubmitted,
  open: openProp,
  onOpenChange,
  trigger,
}: GarbageReportFormProps) => {
  const isDev = import.meta.env.DEV;
  const [internalOpen, setInternalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingOpenAfterAuth, setPendingOpenAfterAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    location_name: '',
    description: '',
    severity: 'medium',
    report_type: 'dumping',
    latitude: '',
    longitude: '',
  });
  const { user } = useAuth();
  const { publicName } = useProfile(user?.id);

  const isControlled = typeof openProp === 'boolean';
  const open = isControlled ? openProp : internalOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const openAuthModal = useCallback(() => {
    setPendingOpenAfterAuth(true);
    setAuthOpen(true);
  }, [setAuthOpen, setPendingOpenAfterAuth]);

  const onOpenAuth = openAuthModal;

  useEffect(() => {
    if (user && pendingOpenAfterAuth) {
      setAuthOpen(false);
      setOpen(true);
      setPendingOpenAfterAuth(false);
    }
  }, [pendingOpenAfterAuth, setOpen, user]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  const resetForm = (): void => {
    setFormData({
      location_name: '',
      description: '',
      severity: 'medium',
      report_type: 'dumping',
      latitude: '',
      longitude: '',
    });
    setSelectedFiles([]);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || selectedFiles.length === 0) {
      return [];
    }

    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      const extension = getFileExtension(file.name);
      const path = `${user.id}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('garbage-report-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (error) {
        throw new Error(`Image upload failed: ${error.message}`);
      }

      const { data } = supabase.storage.from('garbage-report-images').getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // trigger auth modal instead of submitting
      onOpenAuth?.();
      return;
    }

    if (!user) {
      onClose(); // close the garbage form
      // open auth modal
      openAuthModal();
      return;
    }

    if (!formData.location_name || !formData.latitude || !formData.longitude) {
      toast.error('Location name and coordinates are required.');
      return;
    }

    const latitude = Number.parseFloat(formData.latitude);
    const longitude = Number.parseFloat(formData.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      toast.error('Enter valid latitude and longitude values.');
      return;
    }

    if (!isWithinBengaluru(latitude, longitude)) {
      toast.error('Location must be within Bengaluru city limits.');
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls = await uploadImages();
      if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('VITE_SUPABASE_ANON_KEY is undefined!');
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/civic-reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            location_name: formData.location_name.trim(),
            reporter_name: publicName,
            description: formData.description.trim() || null,
            severity: formData.severity,
            report_type: formData.report_type,
            latitude,
            longitude,
            image_urls: imageUrls,
          }),
          cache: 'no-store',
          mode: 'cors',
          signal: AbortSignal.timeout(10000),
        }
      );
      const data = await res.json();
      const error = data.error ? { message: data.error } : null;

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to submit report');
      }

      toast.success('Garbage report submitted. Thank you for helping keep Bengaluru clean.');
      resetForm();
      setOpen(false);
      onReportSubmitted?.();
    } catch (error) {
      if (isDev) {
        console.error('Error submitting garbage report:', error);
      }
      const message = error instanceof Error ? error.message : 'Failed to submit report';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerNode = trigger ?? (
    <Button variant="outline" className="gap-2 rounded-sm">
      <Trash2 className="h-4 w-4 not-italic" />
      Report Garbage
    </Button>
  );

  const renderTrigger = (onClick: () => void) => {
    if (isValidElement<{ onClick?: () => void }>(triggerNode)) {
      return cloneElement(triggerNode, {
        onClick,
      });
    }

    return (
      <button type="button" onClick={onClick}>
        {triggerNode}
      </button>
    );
  };

  return (
    <>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      {user ? (
        <>
          {renderTrigger(() => setOpen(true))}
          {open ? (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div className="relative z-[10000] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm border border-border bg-card p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-white"
                  aria-label="Close garbage report form"
                >
                  <X size={18} className="not-italic" />
                </button>
                <div className="mb-4">
                  <h2 className={`${typography.sectionTitle} flex items-center gap-2`}>
                    <AlertTriangle className="h-5 w-5 text-warning not-italic" />
                    Report Garbage
                  </h2>
                  <p className={`${typography.body} mt-2 text-gray-400`}>
                    Share the location, issue type, and up to two reference photos.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_name" className={typography.label}>
                      Location Name
                    </Label>
                    <Input
                      id="location_name"
                      placeholder="Near Silk Board Junction"
                      value={formData.location_name}
                      onChange={(event) => setFormData((current) => ({ ...current, location_name: event.target.value }))}
                      required
                      maxLength={200}
                    />
                  </div>



                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="report_type" className={typography.label}>
                        Issue Type
                      </Label>
                      <Select
                        value={formData.report_type}
                        onValueChange={(value) => setFormData((current) => ({ ...current, report_type: value }))}
                      >
                        <SelectTrigger id="report_type">
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="severity" className={typography.label}>
                        Severity
                      </Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) => setFormData((current) => ({ ...current, severity: value }))}
                      >
                        <SelectTrigger id="severity">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className={typography.label}>
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the garbage pile, overflow, or illegal dumping spot."
                      value={formData.description}
                      onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                      rows={4}
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="report_images" className={typography.label}>
                        Reference Images
                      </Label>
                      <ImageUploadField 
                        selectedFiles={selectedFiles} 
                        onFilesChange={setSelectedFiles} 
                        maxFiles={MAX_FILES} 
                      />
                    </div>

                    <LocationCaptureField
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={(lat, lng, name) => 
                        setFormData((current) => ({ 
                          ...current, 
                          latitude: lat, 
                          longitude: lng, 
                          location_name: name || current.location_name 
                        }))
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <CheckCircle2 className="h-4 w-4 text-background not-italic" />
                    ) : (
                      <Upload className="h-4 w-4 text-background not-italic" />
                    )}
                    {isSubmitting ? 'Submitting Report' : user ? 'Submit Report' : 'Sign in to Submit'}
                  </Button>
                </form>
              </div>
            </div>
          ) : null}
        </>
      ) : trigger ? (
        renderTrigger(() => {
          openAuthModal();
        })
      ) : (
        <Button
          className="w-full gap-2 sm:w-auto"
          onClick={() => {
            openAuthModal();
          }}
        >
          <Trash2 className="h-4 w-4 not-italic" />
          Report Garbage
        </Button>
      )}
    </>
  );
};
