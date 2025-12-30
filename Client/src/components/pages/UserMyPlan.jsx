/**
 * User's My Plan Page
 * Displays the user's current diet and exercise plan from their coach
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Utensils,
  Dumbbell,
  MessageSquare,
  Calendar,
  User,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import { getMyActivePlan, getCurrentAssignment } from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const UserMyPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // State
  const [plan, setPlan] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch plan data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Fetch current assignment and plan in parallel
        const [assignmentResult, planResult] = await Promise.all([
          getCurrentAssignment(),
          getMyActivePlan(),
        ]);

        setAssignment(assignmentResult.data);
        setPlan(planResult.data);
      } catch (error) {
        console.error('Error fetching plan data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your plan.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format text with line breaks
  const formatPlanText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-[400px] w-full" />
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
            <FileText className="h-8 w-8 text-primary" />
            {t('plan.title')}
          </h1>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('plan.noCoachAssigned')}</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {t('plan.needCoachForPlan')}
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
  const coachName = coach?.full_name || assignment.coach?.full_name || t('plan.yourCoach');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              {t('plan.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('plan.subtitle')}
            </p>
          </div>
        </div>

        {/* Coach Info Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/coaching')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('plan.message')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('plan.book')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* No Plan Yet */}
        {!plan && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('plan.noPlanYet')}</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {t('plan.noPlanYetDesc')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Plan Content */}
        {plan && (
          <div className="space-y-4">
            {/* Plan Meta */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="default">
                <Clock className="h-3 w-3 mr-1" />
                {t('plan.activePlan')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {t('plan.lastUpdated')}: {new Date(plan.updated_at).toLocaleDateString()}
              </span>
              {plan.start_date && (
                <span className="text-sm text-muted-foreground">
                  • {t('plan.started')}: {new Date(plan.start_date).toLocaleDateString()}
                </span>
              )}
              {plan.end_date && (
                <span className="text-sm text-muted-foreground">
                  • {t('plan.ends')}: {new Date(plan.end_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Tabs for Diet and Exercise */}
            <Tabs defaultValue="diet">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="diet" className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  {t('plan.dietPlan')}
                </TabsTrigger>
                <TabsTrigger value="exercise" className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  {t('plan.exercisePlan')}
                </TabsTrigger>
              </TabsList>

              {/* Diet Tab */}
              <TabsContent value="diet" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-green-600" />
                      {t('plan.dietPlan')}
                    </CardTitle>
                    <CardDescription>
                      {t('plan.dietPlanDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {plan.diet_text ? (
                      <div className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-lg">
                        {formatPlanText(plan.diet_text)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>{t('plan.noDietPlanYet')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exercise Tab */}
              <TabsContent value="exercise" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-blue-600" />
                      {t('plan.exercisePlan')}
                    </CardTitle>
                    <CardDescription>
                      {t('plan.exercisePlanDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {plan.exercise_text ? (
                      <div className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-lg">
                        {formatPlanText(plan.exercise_text)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>{t('plan.noExercisePlanYet')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Coach Notes */}
            {plan.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('plan.coachNotes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {plan.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserMyPlan;
