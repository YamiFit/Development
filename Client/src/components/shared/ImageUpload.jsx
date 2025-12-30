/**
 * ImageUpload Component
 * Upload and preview image files with validation
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateImage } from '@/utils/validation';
import { useTranslation } from 'react-i18next';

const ImageUpload = ({
  value,
  onChange,
  error,
  className = ''
}) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(value || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Sync preview with value prop (important for edit mode)
  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    const validation = validateImage(file);
    if (!validation.valid) {
      onChange(null, validation.error);
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onChange(file, null);
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  // Handle remove
  const handleRemove = () => {
    setPreview(null);
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle click to upload
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {preview ? (
        // Preview mode
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 end-2"
          >
            <X className="h-4 w-4 me-1" />
            {t('common.remove')}
          </Button>
        </div>
      ) : (
        // Upload area
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors hover:border-primary hover:bg-accent/50
            ${dragActive ? 'border-primary bg-accent' : 'border-gray-300'}
            ${error ? 'border-red-500' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {dragActive ? (
              <Upload className="h-12 w-12 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {dragActive ? t('imageUpload.dropImageHere') : t('imageUpload.clickToUpload')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('imageUpload.imageRequirements')}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
