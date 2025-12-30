import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import HealthProfileForm from './HealthProfileForm';
import { useAuth } from '@/hooks/useAuthRedux';
import { sendHealthProfileToWebhook } from '@/services/api/profile.service';
import { useToast } from '@/hooks/use-toast';

export default function HealthProfileModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const { user, updateHealthProfile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (formData) => {
    setLoading(true);
    console.log('🚀 Form submitted with data:', formData);

    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error('❌ Request timeout - operation took too long');
      setLoading(false);
      toast({
        title: 'Timeout',
        description: 'Request took too long. Please try again.',
        variant: 'destructive',
      });
    }, 30000); // 30 second timeout

    try {
      // First, save basic profile to database immediately
      console.log('💾 Saving basic profile to database...');
      const { data: profileData, error: profileError } = await updateHealthProfile(formData, null);

      if (profileError) {
        console.error('❌ Database error:', profileError);
        clearTimeout(timeout);
        setLoading(false);
        toast({
          title: 'Error',
          description: profileError.message || 'Failed to save health profile. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Basic profile saved successfully:', profileData);

      // Clear timeout
      clearTimeout(timeout);

      // Show success message
      toast({
        title: 'Success',
        description: 'Your health profile has been saved successfully!',
        variant: 'default',
      });

      // Close modal - data already updated in state
      setLoading(false);
      onClose();

      // Then send to N8N webhook for AI assessment (in background - non-blocking)
      console.log('🌐 Sending to N8N webhook for AI assessment...');
      sendHealthProfileToWebhook(user.id, formData)
        .then((webhookResponse) => {
          if (webhookResponse.error) {
            console.warn('⚠️ Webhook failed (non-critical):', webhookResponse.error);
          } else {
            console.log('✅ AI assessment will be available after processing:', webhookResponse.data);
          }
        })
        .catch((err) => {
          console.warn('⚠️ Webhook error (non-critical):', err);
        });
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      clearTimeout(timeout);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save health profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!loading && !isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => {
        if (loading) {
          e.preventDefault();
        }
      }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Complete Your Health Profile</DialogTitle>
          <DialogDescription>
            Please fill out your health information to personalize your experience
          </DialogDescription>
        </DialogHeader>
        <HealthProfileForm onSubmit={handleSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
