import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  maxSizeMB?: number;
}

const ImageUpload = ({ onImageUploaded, currentImageUrl, maxSizeMB = 5 }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const compressImage = (file: File, maxSizeMB: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 1200;
        const maxHeight = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Please select an image smaller than ${maxSizeMB}MB.`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, maxSizeMB);
      
      // Create preview
      const preview = URL.createObjectURL(compressedFile);
      setPreviewUrl(preview);

      // Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('property-photos')
        .upload(fileName, compressedFile);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(data.path);

      onImageUploaded(publicUrl);
      
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    const urlToRemove = previewUrl;

    setPreviewUrl(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (urlToRemove && urlToRemove.startsWith('https://')) {
      try {
        // Extract path from Supabase URL
        const urlObject = new URL(urlToRemove);
        const path = urlObject.pathname.split('/property-photos/')[1];

        if (path) {
          const { error } = await supabase.storage
            .from('property-photos')
            .remove([path]);

          if (error) throw error;

          toast({
            title: 'Image removed',
            description: 'The image has been successfully removed.',
          });
        }
      } catch (error: any) {
        console.error('Error removing image from storage:', error);
        toast({
          title: 'Removal failed',
          description: error.message || 'Failed to remove image from storage.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label>Property Image</Label>
      
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Property preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Upload a property image</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Choose Image'}
          </Button>
        </div>
      )}
      
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-sm text-gray-500">
        Supported formats: JPG, PNG, WebP. Max size: {maxSizeMB}MB.
      </p>
    </div>
  );
};

export default ImageUpload;
