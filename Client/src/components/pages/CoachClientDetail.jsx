/**
 * Coach Client Detail Page
 * Shows full client profile and health information
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MessageSquare,
  Calendar,
  FileText,
  Scale,
  Target,
  Activity,
  Heart,
  Flame,
  Droplets,
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import { getClientPlans, getCoachClients } from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';

const CoachClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [client, setClient] = useState(null);
  const [healthProfile, setHealthProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!user?.id || !clientId) return;

      setLoading(true);
      try {
        // Verify this client is assigned to this coach
        const { data: clients } = await getCoachClients();
        const assignment = clients.find(a => a.user_id === clientId);

        if (!assignment) {
          setIsAuthorized(false);
          toast({
            title: t('coachClientDetail.accessDenied'),
            description: t('coachClientDetail.clientNotAssigned'),
            variant: 'destructive',
          });
          return;
        }

        // Note: getCoachClients returns { user: {...}, health_profile: {...} }
        setClient(assignment.user);
        setHealthProfile(assignment.health_profile);

        // Fetch plans
        const { data: clientPlans } = await getClientPlans(clientId);
        setPlans(clientPlans);

      } catch (error) {
        console.error('Error fetching client data:', error);
        toast({
          title: t('common.error'),
          description: t('coachClientDetail.failedToLoadClient'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user?.id, clientId, toast]);

  // Get goal label
  const getGoalLabel = (goal) => {
    const goals = {
      lose_weight: t('goals.loseWeight'),
      gain_muscle: t('goals.gainMuscle'),
      maintain: t('goals.maintain'),
      general_health: t('goals.generalHealth'),
    };
    return goals[goal] || goal || t('common.notSet');
  };

  // Get activity level label
  const getActivityLabel = (level) => {
    const levels = {
      sedentary: t('coachClientDetail.sedentary'),
      lightly_active: t('coachClientDetail.lightlyActive'),
      moderately_active: t('coachClientDetail.moderatelyActive'),
      very_active: t('coachClientDetail.veryActive'),
      extremely_active: t('coachClientDetail.extremelyActive'),
    };
    return levels[level] || level || t('common.notSet');
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Render loading
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64 md:col-span-1" />
            <Skeleton className="h-64 md:col-span-2" />
          </div>
        </div>
      </Layout>
    );
  }

  // Unauthorized
  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('coachClientDetail.accessDenied')}</h2>
          <p className="text-muted-foreground mb-4">{t('coachClientDetail.clientNotAssigned')}</p>
          <Button onClick={() => navigate('/coach/clients')}>
            {t('coachClientDetail.backToMyClients')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/coach/clients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('coachClientDetail.clientProfile')}</h1>
            <p className="text-muted-foreground">{client?.full_name || t('coachClientDetail.clientDetails')}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Client Info Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-primary/20 mb-4">
                  {client?.avatar_url ? (
                    <AvatarImage src={client.avatar_url} alt={client.full_name} />
                  ) : null}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(client?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{client?.full_name || t('common.unknown')}</h2>
                <Badge className="mt-2">{t('coachClientDetail.activeClient')}</Badge>

                {/* Contact Info */}
                <div className="w-full mt-6 space-y-3">
                  {client?.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="w-full mt-6 space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/coach/clients/${clientId}/chat`)}
                  >
                    <MessageSquare className="h-4 w-4 me-2" />
                    {t('coachClientDetail.sendMessage')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/coach/clients/${clientId}/plan`)}
                  >
                    <FileText className="h-4 w-4 me-2" />
                    {t('coachClientDetail.createPlan')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/coach/clients/${clientId}/appointments`)}
                  >
                    <Calendar className="h-4 w-4 me-2" />
                    {t('coachClientDetail.schedule')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Profile & Plans */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="health">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="health">{t('coachClientDetail.healthProfile')}</TabsTrigger>
                <TabsTrigger value="plans">{t('coachClientDetail.dietExercisePlans')}</TabsTrigger>
              </TabsList>

              {/* Health Profile Tab */}
              <TabsContent value="health" className="mt-4">
                {healthProfile ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Body Metrics */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          {t('coachClientDetail.bodyMetrics')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.currentWeight')}</span>
                          <span className="font-medium">{healthProfile.current_weight || '-'} {t('common.kg')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.targetWeight')}</span>
                          <span className="font-medium">{healthProfile.target_weight || '-'} {t('common.kg')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.height')}</span>
                          <span className="font-medium">{healthProfile.height || '-'} {t('common.cm')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.bmi')}</span>
                          <span className="font-medium">{healthProfile.bmi?.toFixed(1) || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.age')}</span>
                          <span className="font-medium">{healthProfile.age || '-'} {t('common.years')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.gender')}</span>
                          <span className="font-medium capitalize">{healthProfile.gender || '-'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Goals & Activity */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          {t('coachClientDetail.goalsAndActivity')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.goal')}</span>
                          <Badge variant="outline">{getGoalLabel(healthProfile.goal)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.activityLevel')}</span>
                          <span className="font-medium text-sm">{getActivityLabel(healthProfile.activity_level)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.sport')}</span>
                          <span className="font-medium">{healthProfile.sport || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('coachClientDetail.workType')}</span>
                          <span className="font-medium capitalize">{healthProfile.work_type?.replace(/_/g, ' ') || '-'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Daily Targets */}
                    <Card className="sm:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Flame className="h-4 w-4" />
                          {t('coachClientDetail.dailyTargets')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <Flame className="h-5 w-5 mx-auto text-orange-600 mb-1" />
                            <p className="text-xl font-bold text-orange-600">{healthProfile.daily_calorie_target || '-'}</p>
                            <p className="text-xs text-muted-foreground">{t('coachClientDetail.calories')}</p>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <Heart className="h-5 w-5 mx-auto text-red-600 mb-1" />
                            <p className="text-xl font-bold text-red-600">{healthProfile.daily_protein_target || '-'}{t('common.grams')}</p>
                            <p className="text-xs text-muted-foreground">{t('coachClientDetail.protein')}</p>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <Activity className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                            <p className="text-xl font-bold text-yellow-600">{healthProfile.daily_carbs_target || '-'}{t('common.grams')}</p>
                            <p className="text-xs text-muted-foreground">{t('coachClientDetail.carbs')}</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <Scale className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                            <p className="text-xl font-bold text-purple-600">{healthProfile.daily_fats_target || '-'}{t('common.grams')}</p>
                            <p className="text-xs text-muted-foreground">{t('coachClientDetail.fats')}</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <Droplets className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                            <p className="text-xl font-bold text-blue-600">{healthProfile.daily_water_target || '-'}{t('common.ml')}</p>
                            <p className="text-xs text-muted-foreground">{t('coachClientDetail.water')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medical Conditions */}
                    {healthProfile.medical_conditions?.length > 0 && (
                      <Card className="sm:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {t('coachClientDetail.medicalConditions')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {healthProfile.medical_conditions.map((condition, index) => (
                              <Badge key={index} variant="secondary">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('coachClientDetail.noHealthProfile')}</h3>
                      <p className="text-muted-foreground text-center">
                        {t('coachClientDetail.clientNoHealthProfile')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Plans Tab */}
              <TabsContent value="plans" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{t('coachClientDetail.clientPlans')}</h3>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/coach/clients/${clientId}/plan`)}
                    >
                      <FileText className="h-4 w-4 me-2" />
                      {t('coachClientDetail.createNewPlan')}
                    </Button>
                  </div>

                  {plans.length > 0 ? (
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <Card key={plan.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                    {plan.is_active ? t('coachClientDetail.active') : t('coachClientDetail.inactive')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {t('coachClientDetail.created')} {new Date(plan.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {plan.diet_text && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium">{t('coachClientDetail.dietPlan')}:</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {plan.diet_text}
                                    </p>
                                  </div>
                                )}
                                {plan.exercise_text && (
                                  <div>
                                    <p className="text-sm font-medium">{t('coachClientDetail.exercisePlan')}:</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {plan.exercise_text}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/coach/clients/${clientId}/plan/${plan.id}`)}
                              >
                                {t('common.edit')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{t('coachClientDetail.noPlansYet')}</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          {t('coachClientDetail.createDietExercisePlan')}
                        </p>
                        <Button onClick={() => navigate(`/coach/clients/${clientId}/plan`)}>
                          <FileText className="h-4 w-4 me-2" />
                          {t('coachClientDetail.createFirstPlan')}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoachClientDetail;
