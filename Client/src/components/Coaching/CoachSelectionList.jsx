/**
 * Coach Selection List Component
 * Displays available coaches with selection capabilities
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Users,
  Filter,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CoachSelectionCard from './CoachSelectionCard';
import { getAvailableCoaches, getCurrentAssignment } from '@/services/api/coach.service';
import { useAuth } from '@/hooks/useAuthRedux';
import { useToast } from '@/hooks/use-toast';

const CoachSelectionList = ({ onCoachSelected }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [coaches, setCoaches] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Fetch coaches and current assignment
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const [coachesResult, assignmentResult] = await Promise.all([
          getAvailableCoaches(),
          getCurrentAssignment(),
        ]);

        setCoaches(coachesResult.data || []);
        setCurrentAssignment(assignmentResult.data);
      } catch (error) {
        console.error('Error fetching coaches:', error);
        toast({
          title: 'Error',
          description: 'Failed to load coaches.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  // Handle coach selection callback
  const handleCoachSelected = async (result) => {
    // Refresh assignment data
    const { data: newAssignment } = await getCurrentAssignment();
    setCurrentAssignment(newAssignment);

    // Refresh coach list (capacity may have changed)
    const { data: newCoaches } = await getAvailableCoaches();
    setCoaches(newCoaches || []);

    if (onCoachSelected) {
      onCoachSelected(result);
    }
  };

  // Filter coaches
  const filteredCoaches = coaches.filter((coach) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      coach.full_name?.toLowerCase().includes(searchLower) ||
      coach.bio?.toLowerCase().includes(searchLower) ||
      coach.specialties?.some(s => s.toLowerCase().includes(searchLower)) ||
      coach.city?.toLowerCase().includes(searchLower);

    // Availability filter
    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && coach.is_available) ||
      (availabilityFilter === 'full' && !coach.is_available);

    return matchesSearch && matchesAvailability;
  });

  // Calculate cooldown info
  const getCooldownInfo = () => {
    if (!currentAssignment?.assigned_at) return null;
    const assignedDate = new Date(currentAssignment.assigned_at);
    const now = new Date();
    const daysSinceAssignment = Math.floor((now - assignedDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 5 - daysSinceAssignment);

    if (daysRemaining > 0) {
      return {
        canChange: false,
        daysRemaining,
        message: `You can change your coach in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
      };
    }

    return { canChange: true, daysRemaining: 0, message: 'You can change your coach' };
  };

  const cooldownInfo = getCooldownInfo();

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Assignment Info */}
      {currentAssignment && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-sm">
                  <Users className="h-3 w-3 mr-1" />
                  Active Coach
                </Badge>
                <span className="font-medium">
                  {currentAssignment.coach_profile?.full_name ||
                    currentAssignment.coach?.full_name ||
                    'Your Coach'}
                </span>
              </div>

              {cooldownInfo && (
                <div className={`flex items-center gap-2 text-sm ${cooldownInfo.canChange ? 'text-green-600' : 'text-orange-600'}`}>
                  <Clock className="h-4 w-4" />
                  <span>{cooldownInfo.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coaches by name, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Coaches</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="full">Fully Booked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{coaches.length} coaches</span>
        <span>•</span>
        <span>{coaches.filter(c => c.is_available).length} available</span>
      </div>

      {/* Empty State */}
      {filteredCoaches.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Coaches Found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? `No coaches match "${searchQuery}"`
                : 'No coaches are currently available.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Coaches Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCoaches.map((coach) => (
          <CoachSelectionCard
            key={coach.coach_id}
            coach={coach}
            isCurrentCoach={currentAssignment?.coach_id === coach.coach_id}
            currentAssignment={currentAssignment}
            onCoachSelected={handleCoachSelected}
          />
        ))}
      </div>
    </div>
  );
};

export default CoachSelectionList;
