import { useState, type ChangeEvent, useMemo, useEffect } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ImageUploadFieldProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export const ImageUploadField = ({ selectedFiles, onFilesChange, maxFiles = 2 }: ImageUploadFieldProps) => {
  const previewUrls = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  useEffect(
    () => () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    },
    [previewUrls],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      onFilesChange([]);
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast.error('Only image files are allowed.');
      event.target.value = '';
      return;
    }

    if (imageFiles.length > maxFiles) {
      toast.error(`Upload up to ${maxFiles} images per report.`);
      event.target.value = '';
      return;
    }

    onFilesChange(imageFiles);
  };

  return (
    <>
      <label
        htmlFor="report_images"
        className="flex cursor-pointer items-center justify-between rounded-sm border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground"
      >
        <span className="inline-flex items-center gap-2 font-body font-bold">
          <ImagePlus className="h-4 w-4 not-italic" />
          Upload 1-{maxFiles} Images
        </span>
        <span className="font-body text-xs font-bold uppercase tracking-[0.08em]">
          JPG, PNG, WEBP
        </span>
      </label>
      <Input
        id="report_images"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      {selectedFiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mt-2">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="overflow-hidden rounded-sm border border-border bg-secondary/40">
              <img src={previewUrls[index]} alt={file.name} width="320" height="192" className="h-24 w-full object-cover" />
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Upload className="h-3.5 w-3.5 not-italic" />
                <span className="truncate">{file.name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};
