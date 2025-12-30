/**
 * User Appointments Page
 * Users can view their appointments and book new ones with their coach
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Plus,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import {
  getCurrentAssignment,
  getUserAppointments,
  bookAppointment,
  updateAppointmentStatus,
} from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const UserAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // State
  const [assignment, setAssignment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const [assignmentResult, appointmentsResult] = await Promise.all([
          getCurrentAssignment(),
          getUserAppointments(),
        ]);

        setAssignment(assignmentResult.data);
        setAppointments(appointmentsResult.data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load appointments.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  // Handle booking form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle book appointment
  const handleBookAppointment = async () => {
    if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) {
      toast({
        title: t('common.error'),
        description: t('appointments.validationSelectFields'),
        variant: 'destructive',
      });
      return;
    }

    const startTime = new Date(`${bookingForm.date}T${bookingForm.startTime}`);
    const endTime = new Date(`${bookingForm.date}T${bookingForm.endTime}`);

    if (endTime <= startTime) {
      toast({
        title: t('common.error'),
        description: t('appointments.validationEndAfterStart'),
        variant: 'destructive',
      });
      return;
    }

    if (startTime < new Date()) {
      toast({
        title: t('common.error'),
        description: t('appointments.validationNoPast'),
        variant: 'destructive',
      });
      return;
    }

    setBooking(true);
    try {
      const { data, error } = await bookAppointment(
        assignment.coach_id,
        startTime.toISOString(),
        endTime.toISOString(),
        bookingForm.notes || null
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || t('appointments.bookingFailed'));
      }

      toast({
        title: t('common.success'),
        description: t('appointments.appointmentBooked'),
      });

      // Refresh appointments
      const { data: newAppointments } = await getUserAppointments();
      setAppointments(newAppointments || []);

      // Reset form and close dialog
      setBookingForm({ date: '', startTime: '', endTime: '', notes: '' });
      setBookingDialogOpen(false);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: t('appointments.bookingFailed'),
        description: error.message || t('appointments.bookingFailed'),
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async (appointmentId) => {
    try {
      const { data, error } = await updateAppointmentStatus(appointmentId, 'CANCELED');

      if (error) {
        throw error;
      }

      toast({
        title: t('appointments.cancelled'),
        description: t('appointments.appointmentCancelled'),
      });

      // Refresh appointments
      const { data: newAppointments } = await getUserAppointments();
      setAppointments(newAppointments || []);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      
      // Show specific error message
      const errorMessage = error?.message || t('appointments.cancelFailed');
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      REQUESTED: { label: t('status.appointment.requested'), variant: 'secondary', icon: Clock },
      CONFIRMED: { label: t('status.appointment.confirmed'), variant: 'default', icon: CheckCircle },
      CANCELED: { label: t('status.appointment.canceled'), variant: 'destructive', icon: XCircle },
      COMPLETED: { label: t('status.appointment.completed'), variant: 'outline', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.REQUESTED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Separate appointments by STATUS, not by time
  // Upcoming = REQUESTED or CONFIRMED (active appointments)
  // Past = COMPLETED or CANCELED (finished appointments)
  const upcomingAppointments = appointments.filter(
    a => a.status === 'REQUESTED' || a.status === 'CONFIRMED'
  );
  const pastAppointments = appointments.filter(
    a => a.status === 'COMPLETED' || a.status === 'CANCELED'
  );

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </Layout>
    );
  }

  // No coach assigned
  if (!assignment) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            {t('appointments.title')}
          </h1>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('plan.noCoachAssigned')}</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {t('appointments.needCoachToBook')}
              </p>
              <Button onClick={() => navigate('/tracker')}>
                {t('plan.findCoach')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const coach = assignment.coach_profile || assignment.coach;
  const coachName = coach?.full_name || t('plan.yourCoach');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              {t('appointments.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('appointments.subtitle')}
            </p>
          </div>

          {/* Book New Button */}
          <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('appointments.bookAppointment')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('appointments.bookNew')}</DialogTitle>
                <DialogDescription>
                  {t('appointments.scheduleWith', { name: coachName })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">{t('appointments.date')}</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    min={today}
                    value={bookingForm.date}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">{t('appointments.startTime')}</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={bookingForm.startTime}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">{t('appointments.endTime')}</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={bookingForm.endTime}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('appointments.notesOptional')}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder={t('appointments.notesPlaceholder')}
                    value={bookingForm.notes}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleBookAppointment} disabled={booking}>
                  {booking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('appointments.booking')}
                    </>
                  ) : (
                    t('appointments.bookAppointment')
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coach Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {coach?.profile_image_url ? (
                  <AvatarImage src={coach.profile_image_url} alt={coachName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(coachName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{coachName}</p>
                <p className="text-sm text-muted-foreground">{t('plan.yourCoach')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              {t('appointments.upcomingAppointments')} ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {t('appointments.pastAppointments')} ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Appointments */}
          <TabsContent value="upcoming" className="mt-4">
            {upcomingAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarDays className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('appointments.noUpcoming')}</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {t('appointments.bookToGetStarted')}
                  </p>
                  <Button onClick={() => setBookingDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('appointments.bookNow')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(appointment.status)}
                            <span className="text-sm text-muted-foreground">
                              {formatDate(appointment.start_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-lg font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                        {appointment.status === 'REQUESTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            {t('common.cancel')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Past Appointments */}
          <TabsContent value="past" className="mt-4">
            {pastAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('appointments.noPast')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('appointments.completedWillAppear')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pastAppointments.map((appointment) => (
                  <Card key={appointment.id} className="opacity-75">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(appointment.status)}
                            <span className="text-sm text-muted-foreground">
                              {formatDate(appointment.start_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserAppointments;
