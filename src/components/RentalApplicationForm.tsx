import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  handleError, 
  handleSuccess, 
  validateRequired, 
  validateEmail, 
  validatePhone,
  ValidationError
} from '@/utils/errorHandling';
import { FileText, Upload, X, CheckCircle } from 'lucide-react';

interface RentalApplicationFormProps {
  propertyId: string;
  propertyPrice: number;
  onSuccess?: (applicationId: string) => void;
}

interface UploadedFile {
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
}

const RentalApplicationForm = ({ propertyId, propertyPrice, onSuccess }: RentalApplicationFormProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState('');
  const [employmentInfo, setEmploymentInfo] = useState('');
  const [referencesInfo, setReferencesInfo] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  useEffect(() => {
    checkExistingApplication();
  }, [propertyId, profile?.id]);

  const checkExistingApplication = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('rental_applications')
        .select('id, status, created_at')
        .eq('property_id', propertyId)
        .eq('renter_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setHasExistingApplication(true);
        setExistingApplication(data);
      }
    } catch (error: any) {
      if (error.code !== 'PGRST116') {
        handleError(error, toast, 'Failed to check existing application');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const newUploadedFiles: UploadedFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (10MB limit increased from 5MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new ValidationError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        }
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          throw new ValidationError(`File "${file.name}" is not a supported format. Please use PDF, JPEG, PNG, or Word documents.`);
        }
        
        // Generate unique filename to avoid conflicts
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
        const filePath = `applications/${propertyId}/${profile.id}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('house-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) throw error;
        
        // Get public URL for persistent access
        const { data: { publicUrl } } = supabase.storage
          .from('house-documents')
          .getPublicUrl(data.path);
          
        newUploadedFiles.push({
          name: file.name,
          path: data.path,
          url: publicUrl,
          size: file.size,
          type: file.type
        });
        
        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      
      handleSuccess(toast, `${newUploadedFiles.length} file(s) uploaded successfully!`, {
        title: 'Files Uploaded',
        context: 'RentalApplication'
      });
      
    } catch (error: any) {
      handleError(error, toast, 'Failed to upload files', {
        context: 'RentalApplication'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Clear the input
      e.target.value = '';
    }
  };

  const removeFile = async (fileIndex: number) => {
    const fileToRemove = uploadedFiles[fileIndex];
    
    try {
      // Remove from storage
      const { error } = await supabase.storage
        .from('house-documents')
        .remove([fileToRemove.path]);
        
      if (error) throw error;
      
      // Remove from state
      setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
      
    } catch (error: any) {
      handleError(error, toast, 'Failed to remove file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasExistingApplication) {
      handleError(
        new ValidationError('You have already applied for this property'),
        toast,
        'Duplicate Application',
        { context: 'RentalApplication' }
      );
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Enhanced validation
      validateRequired(fullName, 'Full name');
      validateRequired(email, 'Email');
      validateEmail(email);
      validateRequired(employmentInfo, 'Employment information');
      validateRequired(referencesInfo, 'References information');
      
      if (phone) {
        validatePhone(phone);
      }
      
      if (monthlyIncome && isNaN(Number(monthlyIncome))) {
        throw new ValidationError('Monthly income must be a valid number');
      }
      
      if (!profile?.id) {
        throw new ValidationError('User authentication required');
      }

      // Check if user has uploaded at least one document
      if (uploadedFiles.length === 0) {
        throw new ValidationError('Please upload at least one document (ID, proof of income, etc.)');
      }
      
      // Insert application record
      const { data: application, error: insertError } = await supabase
        .from('rental_applications')
        .insert([{
          property_id: propertyId,
          renter_id: profile.id,
          full_name: fullName,
          email,
          phone: phone || null,
          employment_info: employmentInfo,
          references_info: referencesInfo,
          document_urls: uploadedFiles.map(f => f.url),
          status: 'application_pending',
          rent_amount: propertyPrice
        }])
        .select()
        .single();
        
      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          throw new ValidationError('You have already applied for this property');
        }
        throw insertError;
      }
      
      handleSuccess(toast, 'Your rental application has been submitted successfully! The landlord will review it and get back to you soon.', {
        title: 'Application Submitted',
        context: 'RentalApplication'
      });
      
      if (onSuccess && application) {
        onSuccess(application.id);
      }
      
    } catch (error: any) {
      handleError(error, toast, 'Failed to submit application', {
        context: 'RentalApplication'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // If user already has an application, show status
  if (hasExistingApplication && existingApplication) {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'application_approved': return 'text-green-600 bg-green-50 border-green-200';
        case 'application_rejected': return 'text-red-600 bg-red-50 border-red-200';
        case 'payment_completed': return 'text-blue-600 bg-blue-50 border-blue-200';
        default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'application_approved': return 'Approved - Proceed to Payment';
        case 'application_rejected': return 'Application Rejected';
        case 'payment_completed': return 'Payment Completed';
        default: return 'Application Pending Review';
      }
    };

    return (
      <Alert className={`border-2 ${getStatusColor(existingApplication.status)}`}>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div className="font-semibold">{getStatusText(existingApplication.status)}</div>
          <div className="text-sm">
            You submitted an application for this property on {new Date(existingApplication.created_at).toLocaleDateString()}.
          </div>
          {existingApplication.status === 'application_approved' && (
            <Button 
              onClick={() => window.location.href = `/payment/${existingApplication.id}`}
              className="w-full mt-2"
            >
              Proceed to Payment
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name *</label>
          <Input 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            required 
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email *</label>
          <Input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            placeholder="Enter your email address"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="Enter your phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Monthly Income</label>
          <Input 
            type="number" 
            value={monthlyIncome} 
            onChange={e => setMonthlyIncome(e.target.value)} 
            placeholder="Enter your monthly income"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Employment Information *</label>
        <Textarea 
          value={employmentInfo} 
          onChange={e => setEmploymentInfo(e.target.value)} 
          placeholder="Please provide your employment details: employer name, position, duration, monthly income, etc."
          className="min-h-[100px]"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">References *</label>
        <Textarea 
          value={referencesInfo} 
          onChange={e => setReferencesInfo(e.target.value)} 
          placeholder="Please provide at least 2 references with names, relationships, and contact information."
          className="min-h-[100px]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Documents * (ID, Proof of Income, etc.)
        </label>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="documents" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop files here or click to upload
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PDF, JPEG, PNG, Word documents up to 10MB each
                  </span>
                </label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Uploaded Files:</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={submitting || uploading || uploadedFiles.length === 0}
      >
        {submitting ? 'Submitting Application...' : 'Submit Application'}
      </Button>
    </form>
  );
};

export default RentalApplicationForm; 