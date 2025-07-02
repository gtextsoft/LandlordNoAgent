import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

interface RentalApplicationFormProps {
  propertyId: string;
  onSuccess?: () => void;
}

const RentalApplicationForm = ({ propertyId, onSuccess }: RentalApplicationFormProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState('');
  const [employmentInfo, setEmploymentInfo] = useState('');
  const [referencesInfo, setReferencesInfo] = useState('');
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocuments(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Enhanced validation
      validateRequired(fullName, 'Full name');
      validateRequired(email, 'Email');
      validateEmail(email);
      
      if (phone) {
        validatePhone(phone);
      }
      
      if (!profile?.id) {
        throw new ValidationError('User authentication required');
      }

      let documentUrls: string[] = [];
      
      // Upload documents to Supabase Storage with better error handling
      if (documents && documents.length > 0) {
        for (let i = 0; i < documents.length; i++) {
          const file = documents[i];
          
          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            throw new ValidationError(`File "${file.name}" is too large. Maximum size is 5MB.`);
          }
          
          // Validate file type
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedTypes.includes(file.type)) {
            throw new ValidationError(`File "${file.name}" is not a supported format. Please use PDF, JPEG, or PNG.`);
          }
          
          const { data, error } = await supabase.storage
            .from('rental_documents')
            .upload(`${profile.id}/${Date.now()}_${file.name}`, file);
            
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from('rental_documents')
            .getPublicUrl(data.path);
            
          documentUrls.push(publicUrl);
        }
      }
      
      // Insert application record
      const { error: insertError } = await supabase
        .from('rental_applications')
        .insert([{
          property_id: propertyId,
          renter_id: profile.id,
          full_name: fullName,
          email,
          phone: phone || null,
          employment_info: employmentInfo || null,
          references_info: referencesInfo || null,
          document_urls: documentUrls.length > 0 ? documentUrls : null,
          status: 'pending'
        }]);
        
      if (insertError) throw insertError;
      
      handleSuccess('Your rental application has been submitted successfully!', toast, {
        title: 'Application Submitted',
        context: 'RentalApplication'
      });
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      handleError(error, toast, 'Failed to submit application', {
        context: 'RentalApplication'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Employment Information</label>
        <Textarea 
          value={employmentInfo} 
          onChange={e => setEmploymentInfo(e.target.value)} 
          placeholder="Please provide your employment details: employer name, position, duration, monthly income, etc."
          className="min-h-[80px]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">References</label>
        <Textarea 
          value={referencesInfo} 
          onChange={e => setReferencesInfo(e.target.value)} 
          placeholder="Please provide at least 2 references with names, relationships, and contact information."
          className="min-h-[80px]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Upload Documents (ID, Proof of Income, etc.)</label>
        <Input type="file" multiple onChange={handleFileChange} />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  );
};

export default RentalApplicationForm; 