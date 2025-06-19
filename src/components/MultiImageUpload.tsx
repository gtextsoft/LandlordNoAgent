import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, ImageIcon, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface MultiImageUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  currentImageUrls?: string[];
  maxImages?: number;
  maxSizeMB?: number;
}

const MultiImageUpload = ({ 
  onImagesUploaded, 
  currentImageUrls = [], 
  maxImages = 10,
  maxSizeMB = 5 
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(currentImageUrls);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const compressImage = (file: File, maxSizeMB: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
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
    const files = event.target.files;
    if (!files || !user) return;

    if (imageUrls.length >= maxImages) {
      toast({
        title: 'Whoa there—let\'s keep it under 10 to avoid a virtual marathon!',
        description: `You can upload a maximum of ${maxImages} images.`,
        variant: 'destructive',
      });
      return;
    }

    const remainingSlots = maxImages - imageUrls.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast({
        title: 'Some images were skipped',
        description: `Only ${remainingSlots} images were uploaded to stay within the ${maxImages} image limit.`,
      });
    }

    setUploading(true);

    try {
      const uploadPromises = filesToProcess.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          throw new Error(`${file.name} is larger than ${maxSizeMB}MB`);
        }

        // Compress the image
        const compressedFile = await compressImage(file, maxSizeMB);
        
        // Upload to Supabase Storage
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('property-photos')
          .upload(fileName, compressedFile);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      const updatedUrls = [...imageUrls, ...newUrls];
      setImageUrls(updatedUrls);
      onImagesUploaded(updatedUrls);
      
      toast({
        title: 'Images uploaded',
        description: `${newUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const urlToRemove = imageUrls[index];
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
    onImagesUploaded(updatedUrls);

    // Also remove from Supabase storage
    if (urlToRemove) {
      try {
        const urlObject = new URL(urlToRemove);
        const path = urlObject.pathname.split('/property-photos/')[1];

        if (path) {
          const { error } = await supabase.storage
            .from('property-photos')
            .remove([path]);
          
          if (error) throw error;
          
          toast({
            title: "Image removed",
            description: "The image has been removed from your listing.",
          });
        }
      } catch (error: any) {
        console.error('Error removing image from storage:', error);
        toast({
          title: "Error removing image",
          description: "Failed to remove image from storage. It's removed from the listing, but might still exist in our system.",
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label>Property Images ({imageUrls.length}/{maxImages})</Label>
      
      {/* Image Grid */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Property image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Main Photo
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {imageUrls.length < maxImages && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {imageUrls.length === 0 ? 'Upload property images' : 'Add more images'}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Add Images'}
          </Button>
        </div>
      )}
      
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-sm text-gray-500">
        Supported formats: JPG, PNG, WebP. Max size: {maxSizeMB}MB per image. Max {maxImages} images total.
      </p>
    </div>
  );
};

export default MultiImageUpload;
