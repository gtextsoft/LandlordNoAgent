
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Shared logout function to eliminate duplication
export const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/login';
  } catch (error: any) {
    console.error('Error signing out:', error);
    // Don't redirect on error to allow user to try again
  }
};

// Shared error handler
export const handleError = (error: any, toast: ReturnType<typeof useToast>['toast'], defaultMessage = 'An error occurred') => {
  console.error(error);
  toast({
    title: 'Error',
    description: error.message || defaultMessage,
    variant: 'destructive',
  });
};

// Shared success handler
export const handleSuccess = (toast: ReturnType<typeof useToast>['toast'], message: string) => {
  toast({
    title: 'Success',
    description: message,
  });
};

// Shared image compression utility
export const compressImage = (file: File, maxSizeMB: number = 5): Promise<File> => {
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

// Shared file validation
export const validateImageFile = (file: File, maxSizeMB: number = 5) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.');
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Please select an image smaller than ${maxSizeMB}MB.`);
  }
};
