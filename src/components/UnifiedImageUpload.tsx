
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X, ImageIcon, Plus, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { compressImage, validateImageFile, handleError, handleSuccess } from '@/utils/shared';

interface UnifiedImageUploadProps {
  // Common props
  onImagesUploaded: (urls: string[]) => void;
  currentImageUrls?: string[];
  maxSizeMB?: number;
  bucket?: string;
  
  // Avatar mode specific
  isAvatar?: boolean;
  
  // Multi-image mode specific
  maxImages?: number;
  
  // Single image mode specific
  isSingle?: boolean;
}

const UnifiedImageUpload = ({
  onImagesUploaded,
  currentImageUrls = [],
  maxSizeMB = 5,
  bucket = 'property-photos',
  isAvatar = false,
  maxImages = 10,
  isSingle = false,
}: UnifiedImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(currentImageUrls);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    const currentUrl = isAvatar || isSingle ? imageUrls[0] : null;
    const maxAllowed = isAvatar || isSingle ? 1 : maxImages;
    
    if (!isAvatar && !isSingle && imageUrls.length >= maxAllowed) {
      handleError(
        new Error(`You can upload a maximum of ${maxAllowed} images.`),
        toast
      );
      return;
    }

    const remainingSlots = maxAllowed - imageUrls.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setUploading(true);

    try {
      const uploadPromises = filesToProcess.map(async (file) => {
        validateImageFile(file, maxSizeMB);
        const compressedFile = await compressImage(file, maxSizeMB);
        
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, compressedFile);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      const updatedUrls = isAvatar || isSingle ? newUrls : [...imageUrls, ...newUrls];
      
      setImageUrls(updatedUrls);
      onImagesUploaded(updatedUrls);
      
      handleSuccess(toast, `${newUrls.length} image(s) uploaded successfully.`);
    } catch (error: any) {
      handleError(error, toast, 'Failed to upload images. Please try again.');
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

    if (urlToRemove && urlToRemove.startsWith('https://')) {
      try {
        const urlObject = new URL(urlToRemove);
        const path = urlObject.pathname.split(`/${bucket}/`)[1];

        if (path) {
          const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

          if (error) throw error;
          handleSuccess(toast, 'Image removed successfully.');
        }
      } catch (error: any) {
        handleError(error, toast, 'Failed to remove image from storage.');
      }
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Avatar mode rendering
  if (isAvatar) {
    return (
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={imageUrls[0] || undefined} alt="User avatar" />
          <AvatarFallback>
            {profile?.full_name ? getInitials(profile.full_name) : <UserIcon className="h-10 w-10 text-gray-400" />}
          </AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // Single image mode rendering
  if (isSingle) {
    return (
      <div className="space-y-4">
        <Label>Property Image</Label>
        
        {imageUrls[0] ? (
          <div className="relative">
            <img
              src={imageUrls[0]}
              alt="Property preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => removeImage(0)}
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
      </div>
    );
  }

  // Multi-image mode rendering
  return (
    <div className="space-y-4">
      <Label>Property Images ({imageUrls.length}/{maxImages})</Label>
      
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
        multiple={!isSingle && !isAvatar}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-sm text-gray-500">
        Supported formats: JPG, PNG, WebP. Max size: {maxSizeMB}MB per image.
        {!isSingle && !isAvatar && ` Max ${maxImages} images total.`}
      </p>
    </div>
  );
};

export default UnifiedImageUpload;
