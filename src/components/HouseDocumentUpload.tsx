import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase, HouseDocument } from '@/lib/supabase';
import { 
  FileText, 
  Upload, 
  X, 
  Download, 
  AlertCircle, 
  CheckCircle,
  Eye
} from 'lucide-react';
import { handleError, handleSuccess } from '@/utils/errorHandling';

interface HouseDocumentUploadProps {
  onDocumentsUploaded: (documentUrls: HouseDocument[]) => void;
  currentDocuments?: HouseDocument[];
  maxDocuments?: number;
  landlordId: string;
  propertyId?: string; // Optional for editing existing properties
}

const HouseDocumentUpload = ({ 
  onDocumentsUploaded, 
  currentDocuments = [], 
  maxDocuments = 5,
  landlordId,
  propertyId
}: HouseDocumentUploadProps) => {
  const [documents, setDocuments] = useState<HouseDocument[]>(currentDocuments);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const documentTypeLabels = {
    'Certificate of Occupancy': 'C of O',
    'Building Plan Approval': 'Building Plan',
    'Property Title': 'Title Deed',
    'Survey Plan': 'Survey',
    'Tax Receipt': 'Tax Receipt',
    'Other': 'Other Document'
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (documents.length + files.length > maxDocuments) {
      toast({
        title: "Too Many Documents",
        description: `You can only upload up to ${maxDocuments} documents.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedDocuments: HouseDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File "${file.name}" is not a supported format. Please use PDF, Word, or image files.`);
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        }

        // Generate unique file name with proper path structure
        const fileName = `${landlordId}/${propertyId || 'new-property'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('house-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error('Document storage is not properly configured. Please contact support.');
          }
          throw uploadError;
        }

        if (!uploadData?.path) {
          throw new Error('Upload failed: No path returned');
        }

        // Get signed URL that expires in 1 hour
        const { data: urlData, error: urlError } = await supabase.storage
          .from('house-documents')
          .createSignedUrl(uploadData.path, 3600);

        if (urlError) throw urlError;

        const newDocument: HouseDocument = {
          id: `doc_${Date.now()}_${i}`,
          name: file.name,
          url: urlData.signedUrl,
          path: uploadData.path, // Store the path for future reference
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString()
        };

        uploadedDocuments.push(newDocument);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const updatedDocuments = [...documents, ...uploadedDocuments];
      setDocuments(updatedDocuments);
      onDocumentsUploaded(updatedDocuments);

      handleSuccess(toast, `${uploadedDocuments.length} document(s) uploaded successfully!`);

    } catch (error: any) {
      handleError(error, toast, 'Failed to upload documents');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  }, [documents, maxDocuments, landlordId, propertyId, onDocumentsUploaded, toast]);

  const removeDocument = async (documentId: string) => {
    try {
      const documentToRemove = documents.find(doc => doc.id === documentId);
      if (!documentToRemove?.path) return;

      // Remove from Supabase Storage using the stored path
      const { error } = await supabase.storage
        .from('house-documents')
        .remove([documentToRemove.path]);

      if (error) throw error;

      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsUploaded(updatedDocuments);

      handleSuccess(toast, 'Document removed successfully');
    } catch (error: any) {
      handleError(error, toast, 'Failed to remove document');
    }
  };

  const downloadDocument = async (houseDoc: HouseDocument) => {
    try {
      if (!houseDoc.path) {
        throw new Error('Document path not found');
      }

      // Get a fresh signed URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('house-documents')
        .createSignedUrl(houseDoc.path, 3600);

      if (urlError) throw urlError;

      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = urlData.signedUrl;
      link.download = houseDoc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
      handleError(error, toast, 'Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('image')) return <Eye className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            House Documents
            <Badge variant="outline" className="ml-2 text-blue-600">
              For Verification
            </Badge>
          </span>
          <Badge variant="secondary">
            {documents.length}/{maxDocuments}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Upload official documents to verify your property ownership. This helps build trust with potential renters.
        </div>

        {/* Upload Button */}
        <div className="flex justify-center p-4 border-2 border-dashed rounded-lg bg-gray-50">
          <Button
            variant="outline"
            className="w-full max-w-xs"
            disabled={uploading || documents.length >= maxDocuments}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading || documents.length >= maxDocuments}
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-center text-gray-600">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Document List */}
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(doc.type)}
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Documents List */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Recommended Documents:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {Object.entries(documentTypeLabels).map(([key, label]) => (
              <li key={key}>• {label}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default HouseDocumentUpload; 