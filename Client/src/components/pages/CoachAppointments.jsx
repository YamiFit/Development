/**
 * Coach Appointments Page
 * Coaches can view and manage appointments with their clients
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  CalendarDays,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuthRedux';
import { getCoachAppointments, updateAppointmentStatus } from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';

const CoachAppointments = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Calculate week range
  const getWeekRange = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return { start, end };
  };

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const { start, end } = getWeekRange(currentWeek);
        const { data, error } = await getCoachAppointments(null, start, end);

        if (error) throw error;

        setAppointments(data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: t('common.error'),
          description: t('coachAppointments.failedToLoadAppointments'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.id, currentWeek, toast]);

  // Handle status update
  const handleStatusUpdate = async (appointmentId, status) => {
    setUpdatingId(appointmentId);
    try {
      const { data, error } = await updateAppointmentStatus(appointmentId, status);

      if (error) {
        throw error;
      }

      toast({
        title: t('common.updated'),
        description: t('coachAppointments.appointmentStatusUpdated', { status: status.toLowerCase() }),
      });

      // Refresh appointments
      const { start, end } = getWeekRange(currentWeek);
      const { data: newAppointments } = await getCoachAppointments(null, start, end);
      setAppointments(newAppointments || []);
    } catch (error) {
      console.error('Error updating appointment:', error);
      
      // Show specific error message
      const errorMessage = error?.message || t('coachAppointments.failedToUpdateAppointment');
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() - 7);
      return date;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() + 7);
      return date;
    });
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      REQUESTED: { label: t('coachAppointments.pending'), variant: 'secondary', icon: Clock },
      CONFIRMED: { label: t('coachAppointments.confirmed'), variant: 'default', icon: CheckCircle },
      CANCELED: { label: t('coachAppointments.cancelled'), variant: 'destructive', icon: XCircle },
      COMPLETED: { label: t('coachAppointments.completed'), variant: 'outline', icon: CheckCircle },
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

  // Get initials - with better fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get display name for client - with email fallback
  const getClientName = (client) => {
    if (client?.full_name) return client.full_name;
    if (client?.email) return client.email.split('@')[0];
    return t('coachAppointments.unknownClient');
  };

  // Format week range for display
  const formatWeekRange = () => {
    const { start, end } = getWeekRange(currentWeek);
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() - 1);

    return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Separate appointments
  const pendingAppointments = appointments.filter(a => a.status === 'REQUESTED');
  const confirmedAppointments = appointments.filter(a => a.status === 'CONFIRMED');
  const otherAppointments = appointments.filter(a => a.status === 'CANCELED' || a.status === 'COMPLETED');

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              {t('coachAppointments.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('coachAppointments.subtitle')}
            </p>
          </div>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">{formatWeekRange()}</h3>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  {t('coachAppointments.today')}
                </Button>
              </div>

              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              {t('coachAppointments.pendingTab')}
              {pendingAppointments.length > 0 && (
                <span className="ms-1 bg-orange-500 text-white text-xs rounded-full px-1.5">
                  {pendingAppointments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              {t('coachAppointments.confirmedTab')} ({confirmedAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              {t('coachAppointments.otherTab')} ({otherAppointments.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-4">
            {pendingAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('coachAppointments.noPendingRequests')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('coachAppointments.noPendingDescription')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-orange-200 bg-orange-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 border">
                            {appointment.client?.avatar_url ? (
                              <AvatarImage src={appointment.client.avatar_url} />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(getClientName(appointment.client))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-medium">{getClientName(appointment.client)}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              {formatDate(appointment.start_time)}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                "{appointment.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(appointment.id, 'CONFIRMED')}
                            disabled={updatingId === appointment.id}
                          >
                            {updatingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 me-1" />
                                {t('coachAppointments.confirm')}
                              </>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingId === appointment.id}
                              >
                                <XCircle className="h-4 w-4 me-1" />
                                {t('coachAppointments.decline')}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('coachAppointments.declineAppointmentTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('coachAppointments.declineAppointmentDesc', { name: getClientName(appointment.client) })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('coachAppointments.keep')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleStatusUpdate(appointment.id, 'CANCELED')}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  {t('coachAppointments.decline')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Confirmed Tab */}
          <TabsContent value="confirmed" className="mt-4">
            {confirmedAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarDays className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('coachAppointments.noConfirmedAppointments')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('coachAppointments.noConfirmedDescription')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {confirmedAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 border">
                            {appointment.client?.avatar_url ? (
                              <AvatarImage src={appointment.client.avatar_url} />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(getClientName(appointment.client))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{getClientName(appointment.client)}</p>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              {formatDate(appointment.start_time)}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/coach/clients/${appointment.user_id}/chat`)}
                          >
                            <MessageSquare className="h-4 w-4 me-1" />
                            {t('coachAppointments.chat')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(appointment.id, 'COMPLETED')}
                            disabled={updatingId === appointment.id}
                          >
                            {updatingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t('coachAppointments.complete')
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Other Tab */}
          <TabsContent value="other" className="mt-4">
            {otherAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('coachAppointments.noOtherAppointments')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('coachAppointments.noOtherDescription')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {otherAppointments.map((appointment) => (
                  <Card key={appointment.id} className="opacity-75">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border">
                          {appointment.client?.avatar_url ? (
                            <AvatarImage src={appointment.client.avatar_url} />
                          ) : null}
                          <AvatarFallback>
                            {getInitials(getClientName(appointment.client))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{getClientName(appointment.client)}</p>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(appointment.start_time)}
                            <span>•</span>
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
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

export default CoachAppointments;
