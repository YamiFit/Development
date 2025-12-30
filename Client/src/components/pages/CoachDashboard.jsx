/**
 * Coach Dashboard Component
 * Main dashboard for coaches to manage clients and view profile status
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  UserCircle, 
  Edit, 
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import { 
  getCoachProfile, 
  getCoachTrainingPlaces, 
  calculateProfileCompletion,
  getCoachClients,
  getCoachAppointments,
  getCoachPlans
} from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // State
  const [coachProfile, setCoachProfile] = useState(null);
  const [trainingPlaces, setTrainingPlaces] = useState([]);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Fetch coach profile on mount
  useEffect(() => {
    const fetchCoachData = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch all coach data in parallel
        const [profileResult, placesResult, clientsResult, appointmentsResult, plansResult] = await Promise.all([
          getCoachProfile(user.id),
          getCoachTrainingPlaces(user.id),
          getCoachClients().catch(() => ({ data: [] })),
          getCoachAppointments().catch(() => ({ data: [] })),
          getCoachPlans().catch(() => ({ data: [] })),
        ]);

        if (profileResult.error && profileResult.error.code !== 'PGRST116') {
          throw profileResult.error;
        }

        setCoachProfile(profileResult.data);
        setTrainingPlaces(placesResult.data || []);
        setClients(clientsResult.data || []);
        setAppointments(appointmentsResult.data || []);
        setPlans(plansResult.data || []);

        // Calculate profile completion
        const completion = calculateProfileCompletion(profileResult.data);
        setProfileCompletion(completion);
      } catch (err) {
        console.error('Error fetching coach data:', err);
        setError(err.message || t('coachDashboard.failedToLoadProfile'));
        toast({
          title: t('common.error'),
          description: t('coachDashboard.failedToLoadProfileRetry'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [user?.id, toast]);

  // Compute real stats
  const activeClientCount = clients.length;
  const activePlansCount = plans.filter(p => p.is_active).length;
  const totalPlansCount = plans.length;
  const upcomingAppointments = appointments.filter(
    a => a.status === 'CONFIRMED' || a.status === 'REQUESTED'
  );
  const weekAppointments = upcomingAppointments.filter(a => {
    const appointmentDate = new Date(a.start_time);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return appointmentDate >= now && appointmentDate <= weekFromNow;
  });

  // Stats for dashboard
  const stats = [
    {
      title: t('coachDashboard.activeClients'),
      value: String(activeClientCount),
      description: t('coachDashboard.totalActiveClients'),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('coachDashboard.dietPlans'),
      value: String(activePlansCount),
      description: t('coachDashboard.totalPlansCreated', { count: totalPlansCount }),
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('coachDashboard.appointments'),
      value: String(weekAppointments.length),
      description: t('coachDashboard.scheduledThisWeek'),
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('coachDashboard.clientProgress'),
      value: '0%',
      description: t('coachDashboard.averageGoalAchievement'),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  // Get display name
  const displayName = coachProfile?.full_name || profile?.full_name || user?.email?.split('@')[0] || 'Coach';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Render loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('coachDashboard.loadingDashboard')}</p>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-2">{t('coachDashboard.failedToLoadDashboard')}</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.tryAgain')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Coach Info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              {coachProfile?.profile_image_url ? (
                <AvatarImage src={coachProfile.profile_image_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {t('coachDashboard.welcome', { name: displayName })}
              </h1>
              <p className="text-muted-foreground">
                {coachProfile ? t('coachDashboard.manageClientsDescription') : t('coachDashboard.setupProfileDescription')}
              </p>
            </div>
          </div>
          
          {coachProfile && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/coach/profile')}
              >
                <Edit className="h-4 w-4 me-2" />
                {t('coachDashboard.editProfile')}
              </Button>
              {coachProfile.is_public && (
                <Button 
                  variant="ghost"
                  onClick={() => {
                    toast({
                      title: t('common.comingSoon'),
                      description: t('coachDashboard.publicProfileComingSoon'),
                    });
                  }}
                >
                  <Eye className="h-4 w-4 me-2" />
                  {t('coachDashboard.viewPublicProfile')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Profile Completion Card - Show if profile doesn't exist or is incomplete */}
        {!coachProfile ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-amber-900">{t('coachDashboard.createCoachProfile')}</CardTitle>
              </div>
              <CardDescription className="text-amber-700">
                {t('coachDashboard.noProfileYet')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/coach/profile')}>
                <UserCircle className="h-4 w-4 me-2" />
                {t('coachDashboard.createCoachProfileButton')}
              </Button>
            </CardContent>
          </Card>
        ) : profileCompletion < 100 ? (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-900">{t('coachDashboard.completeYourProfile')}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {t('coachDashboard.percentComplete', { percent: profileCompletion })}
                </Badge>
              </div>
              <CardDescription className="text-blue-700">
                {t('coachDashboard.completeProfileDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={profileCompletion} className="h-2" />
              <Button variant="outline" onClick={() => navigate('/coach/profile')}>
                <Edit className="h-4 w-4 me-2" />
                {t('coachDashboard.completeProfileButton')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900">{t('coachDashboard.profileComplete')}</CardTitle>
              </div>
              <CardDescription className="text-green-700">
                {t('coachDashboard.profileCompleteDescription')}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Profile Summary Card (if profile exists) */}
        {coachProfile && (
          <Card>
            <CardHeader>
              <CardTitle>{t('coachDashboard.profileSummary')}</CardTitle>
              <CardDescription>{t('coachDashboard.profileSummaryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coachProfile.specialties && coachProfile.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t('coachDashboard.specialties')}</p>
                    <div className="flex flex-wrap gap-1">
                      {coachProfile.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {coachProfile.years_of_experience && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t('coachDashboard.experience')}</p>
                    <p className="text-lg font-semibold">{t('coachDashboard.yearsExperience', { years: coachProfile.years_of_experience })}</p>
                  </div>
                )}
                
                {coachProfile.languages && coachProfile.languages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t('coachDashboard.languages')}</p>
                    <div className="flex flex-wrap gap-1">
                      {coachProfile.languages.map((lang, idx) => (
                        <Badge key={idx} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {coachProfile.city && coachProfile.country && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t('coachDashboard.location')}</p>
                    <p className="text-lg font-semibold">{coachProfile.city}, {coachProfile.country}</p>
                  </div>
                )}

                {trainingPlaces.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t('coachDashboard.trainingPlaces')}</p>
                    <p className="text-lg font-semibold">{trainingPlaces.length} {trainingPlaces.length !== 1 ? t('coachDashboard.locations') : t('coachDashboard.locationSingular')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('coachDashboard.recentClients')}</CardTitle>
                <CardDescription>{t('coachDashboard.recentClientsDescription')}</CardDescription>
              </div>
              {clients.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/coach/clients')}>
                  {t('common.viewAll')}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">{t('coachDashboard.noClientsYet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.slice(0, 4).map((client) => {
                    // client.user contains { id, full_name, email, avatar_url }
                    const clientUser = client.user;
                    const clientName = clientUser?.full_name || clientUser?.email?.split('@')[0] || 'Unknown';
                    const initials = clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    
                    return (
                      <div 
                        key={client.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => navigate(`/coach/clients/${client.user_id}`)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('coachDashboard.assigned')} {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/coach/clients/${client.user_id}/chat`);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('coachDashboard.upcomingAppointments')}</CardTitle>
                <CardDescription>{t('coachDashboard.scheduledConsultations')}</CardDescription>
              </div>
              {upcomingAppointments.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/coach/appointments')}>
                  {t('common.viewAll')}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">{t('coachDashboard.noAppointmentsScheduled')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 4).map((appointment) => {
                    // appointment.client contains { id, full_name, email, avatar_url }
                    const clientName = appointment.client?.full_name || appointment.client?.email?.split('@')[0] || 'Unknown Client';
                    const startTime = new Date(appointment.start_time);
                    
                    return (
                      <div 
                        key={appointment.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => navigate('/coach/appointments')}
                      >
                        <div className={`p-2 rounded-lg ${
                          appointment.status === 'REQUESTED' ? 'bg-amber-50' : 'bg-green-50'
                        }`}>
                          <Clock className={`h-4 w-4 ${
                            appointment.status === 'REQUESTED' ? 'text-amber-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(startTime, 'MMM d, yyyy')} at {format(startTime, 'h:mm a')}
                          </p>
                        </div>
                        <Badge variant={appointment.status === 'REQUESTED' ? 'outline' : 'secondary'}>
                          {appointment.status === 'REQUESTED' ? t('coachDashboard.pending') : t('coachDashboard.confirmed')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Diet Plans Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('coachDashboard.activeDietPlans')}</CardTitle>
            <CardDescription>{t('coachDashboard.activeDietPlansDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {plans.filter(p => p.is_active).length === 0 ? (
              <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">{t('coachDashboard.noDietPlansYet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.filter(p => p.is_active).slice(0, 5).map((plan) => {
                  const clientName = plan.client?.full_name || plan.client?.email?.split('@')[0] || 'Unknown Client';
                  const initials = clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  
                  return (
                    <div 
                      key={plan.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/coach/clients/${plan.user_id}/plan/${plan.id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{clientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {plan.diet_text ? plan.diet_text.substring(0, 50) + '...' : t('coachDashboard.dietPlan')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {t('coachDashboard.active')}
                      </Badge>
                    </div>
                  );
                })}
                {plans.filter(p => p.is_active).length > 5 && (
                  <Button variant="ghost" className="w-full" onClick={() => navigate('/coach/clients')}>
                    {t('coachDashboard.viewAllPlans', { count: plans.filter(p => p.is_active).length })}
                    <ChevronRight className="h-4 w-4 ms-1" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('coachDashboard.quickActions')}</CardTitle>
            <CardDescription>{t('coachDashboard.quickActionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button 
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-start"
                onClick={() => navigate('/coach/clients')}
              >
                <Users className="h-6 w-6 mb-2 text-blue-600" />
                <h4 className="font-semibold text-sm">{t('coachDashboard.myClients')}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t('coachDashboard.viewManageClients')}</p>
              </button>
              <button 
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-start"
                onClick={() => {
                  if (clients.length > 0) {
                    navigate(`/coach/clients/${clients[0].user_id}/plan`);
                  } else {
                    toast({ 
                      title: t('coachDashboard.noClients'), 
                      description: t('coachDashboard.needClientForPlan') 
                    });
                  }
                }}
              >
                <FileText className="h-6 w-6 mb-2 text-green-600" />
                <h4 className="font-semibold text-sm">{t('coachDashboard.createPlan')}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t('coachDashboard.designDietPlan')}</p>
              </button>
              <button 
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-start"
                onClick={() => navigate('/coach/appointments')}
              >
                <Calendar className="h-6 w-6 mb-2 text-purple-600" />
                <h4 className="font-semibold text-sm">{t('coachDashboard.appointmentsAction')}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t('coachDashboard.viewAllAppointments')}</p>
              </button>
              <button 
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-start"
                onClick={() => navigate('/coach/profile')}
              >
                <UserCircle className="h-6 w-6 mb-2 text-orange-600" />
                <h4 className="font-semibold text-sm">{t('coachDashboard.editProfileAction')}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t('coachDashboard.updateYourInfo')}</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CoachDashboard;
