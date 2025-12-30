/**
 * Coach Selection Card Component
 * Handles coach selection with cooldown + capacity rules
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  User,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Calendar,
  FileText,
  Star,
  MapPin,
  Award,
} from 'lucide-react';
import { selectCoach } from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';

const CoachSelectionCard = ({
  coach,
  isCurrentCoach = false,
  currentAssignment = null,
  onCoachSelected,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selecting, setSelecting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cooldownError, setCooldownError] = useState(null);

  // Calculate cooldown days remaining
  const getCooldownDaysRemaining = () => {
    if (!currentAssignment?.assigned_at) return 0;
    const assignedDate = new Date(currentAssignment.assigned_at);
    const now = new Date();
    const daysSinceAssignment = Math.floor((now - assignedDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, 5 - daysSinceAssignment);
  };

  const cooldownRemaining = getCooldownDaysRemaining();
  const canChangeCoach = cooldownRemaining === 0;

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Capacity info
  const activeClients = coach.active_clients || 0;
  const maxClients = 10;
  const isAvailable = coach.is_available !== false && activeClients < maxClients;
  const capacityPercentage = (activeClients / maxClients) * 100;

  // Handle select coach
  const handleSelectCoach = async () => {
    if (isCurrentCoach) {
      // Navigate to chat/plan instead
      navigate('/coaching');
      return;
    }

    // Check if user has an existing coach and show confirmation
    if (currentAssignment && !isCurrentCoach) {
      if (!canChangeCoach) {
        setCooldownError({
          message: `You can change your coach after 5 days from your last selection. Please wait ${cooldownRemaining} more day(s).`,
          daysRemaining: cooldownRemaining,
        });
        return;
      }
      setShowConfirmDialog(true);
      return;
    }

    await performSelection();
  };

  // Perform the actual selection
  const performSelection = async () => {
    setSelecting(true);
    setCooldownError(null);

    try {
      const { data, error } = await selectCoach(coach.coach_id);

      if (error) throw error;

      if (!data?.success) {
        // Handle specific errors
        if (data?.error?.includes('5 days') || data?.cooldown_remaining_days) {
          setCooldownError({
            message: data.error,
            daysRemaining: data.cooldown_remaining_days,
          });
          return;
        }

        if (data?.error?.includes('maximum capacity')) {
          toast({
            title: 'Coach Unavailable',
            description: data.error,
            variant: 'destructive',
          });
          return;
        }

        throw new Error(data?.error || 'Failed to select coach');
      }

      toast({
        title: 'Success!',
        description: `${coach.full_name || 'Coach'} is now your coach.`,
      });

      // Callback to refresh parent state
      if (onCoachSelected) {
        onCoachSelected(data);
      }
    } catch (error) {
      console.error('Error selecting coach:', error);
      toast({
        title: 'Selection Failed',
        description: error.message || 'Failed to select coach. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSelecting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${isCurrentCoach ? 'ring-2 ring-primary' : ''} ${!isAvailable ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                {coach.profile_image_url ? (
                  <AvatarImage src={coach.profile_image_url} alt={coach.full_name} />
                ) : null}
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(coach.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{coach.full_name || 'Coach'}</CardTitle>
                {(coach.city || coach.country) && (
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {[coach.city, coach.country].filter(Boolean).join(', ')}
                  </CardDescription>
                )}
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-col gap-1 items-end">
              {isCurrentCoach && (
                <Badge className="bg-primary">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Your Coach
                </Badge>
              )}
              {!isAvailable && !isCurrentCoach && (
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  Full
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          {coach.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{coach.bio}</p>
          )}

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            {coach.years_of_experience && (
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                {coach.years_of_experience} years exp
              </Badge>
            )}
            {coach.specialties?.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {coach.specialties[0]}
                {coach.specialties.length > 1 && ` +${coach.specialties.length - 1}`}
              </Badge>
            )}
          </div>

          {/* Capacity Indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Capacity
              </span>
              <span className={activeClients >= maxClients ? 'text-destructive' : 'text-muted-foreground'}>
                {activeClients}/{maxClients} clients
              </span>
            </div>
            <Progress
              value={capacityPercentage}
              className={`h-1.5 ${capacityPercentage >= 100 ? 'bg-destructive/20' : ''}`}
            />
          </div>

          {/* Cooldown Warning */}
          {cooldownError && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
              <Clock className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-orange-800">{cooldownError.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {isCurrentCoach ? (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate('/coaching')}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/my-plan')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Book
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSelectCoach}
                  disabled={!isAvailable || selecting}
                >
                  {selecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Selecting...
                    </>
                  ) : !isAvailable ? (
                    <>
                      <Users className="h-4 w-4 mr-1" />
                      Fully Booked
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-1" />
                      Select Coach
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/tracker/coach/${coach.coach_id}`)}
                >
                  View Profile
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Changing Coach */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Your Coach?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to switch from your current coach to{' '}
                <span className="font-semibold">{coach.full_name}</span>.
              </p>
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg text-orange-800 text-sm mt-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  After this change, you won't be able to switch coaches again for <strong>5 days</strong>.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={selecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performSelection} disabled={selecting}>
              {selecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Switching...
                </>
              ) : (
                'Confirm Switch'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CoachSelectionCard;
