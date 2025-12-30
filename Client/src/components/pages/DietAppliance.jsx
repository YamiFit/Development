/**
 * Diet Appliance Page
 * Coach creates/edits diet and exercise plans for a specific client
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  FileText,
  Utensils,
  Dumbbell,
  Save,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Trash2,
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
import {
  getCoachClients,
  getClientPlans,
  createClientPlan,
  updateClientPlan,
  deleteClientPlan,
} from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';

const DietAppliance = () => {
  const { clientId, planId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    diet_text: '',
    exercise_text: '',
    notes: '',
    is_active: true,
    start_date: '',
    end_date: '',
  });

  // Fetch client and plan data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !clientId) return;

      setLoading(true);
      try {
        // Verify authorization
        const { data: clients } = await getCoachClients();
        const assignment = clients.find(a => a.user_id === clientId);

        if (!assignment) {
          setIsAuthorized(false);
          return;
        }

        // Note: getCoachClients returns { user: {...}, health_profile: {...} }
        setClient(assignment.user);

        // If editing existing plan, fetch it
        if (planId) {
          const { data: plans } = await getClientPlans(clientId);
          const plan = plans.find(p => p.id === planId);

          if (plan) {
            setFormData({
              diet_text: plan.diet_text || '',
              exercise_text: plan.exercise_text || '',
              notes: plan.notes || '',
              is_active: plan.is_active ?? true,
              start_date: plan.start_date || '',
              end_date: plan.end_date || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: t('common.error'),
          description: t('dietAppliance.failedToLoadData'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, clientId, planId, toast]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch change
  const handleSwitchChange = (checked) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.diet_text.trim() && !formData.exercise_text.trim()) {
      toast({
        title: t('dietAppliance.validationError'),
        description: t('dietAppliance.provideDietOrExercise'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const planData = {
        user_id: clientId,
        diet_text: formData.diet_text.trim(),
        exercise_text: formData.exercise_text.trim(),
        notes: formData.notes.trim(),
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      let result;
      if (planId) {
        result = await updateClientPlan(planId, planData);
      } else {
        result = await createClientPlan(planData);
      }

      if (result.error) throw result.error;

      toast({
        title: t('common.success'),
        description: planId ? t('dietAppliance.planUpdated') : t('dietAppliance.planCreated'),
      });

      navigate(`/coach/clients/${clientId}`);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: t('common.error'),
        description: planId ? t('dietAppliance.failedToUpdatePlan') : t('dietAppliance.failedToCreatePlan'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!planId) return;

    try {
      const result = await deleteClientPlan(planId);

      if (result.error) throw result.error;

      toast({
        title: t('dietAppliance.deleted'),
        description: t('dietAppliance.planDeleted'),
      });

      navigate(`/coach/clients/${clientId}`);
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: t('common.error'),
        description: t('dietAppliance.failedToDeletePlan'),
        variant: 'destructive',
      });
    }
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full" />
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
          <h2 className="text-xl font-semibold mb-2">{t('dietAppliance.accessDenied')}</h2>
          <p className="text-muted-foreground mb-4">{t('dietAppliance.clientNotAssigned')}</p>
          <Button onClick={() => navigate('/coach/clients')}>
            {t('dietAppliance.backToMyClients')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {planId ? t('dietAppliance.editPlan') : t('dietAppliance.createNewPlan')}
              </h1>
              <p className="text-muted-foreground">
                {t('dietAppliance.dietAndExercisePlanFor')} {client?.full_name || t('dietAppliance.client')}
              </p>
            </div>
          </div>

          {/* Delete Button (for existing plans) */}
          {planId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 me-2" />
                  {t('common.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dietAppliance.deletePlanTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('dietAppliance.deletePlanDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Client Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {client?.avatar_url ? (
                  <AvatarImage src={client.avatar_url} alt={client.full_name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(client?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{client?.full_name || t('dietAppliance.unknownClient')}</p>
                <p className="text-sm text-muted-foreground">{client?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Form */}
        <div className="grid gap-6">
          {/* Diet Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-green-600" />
                {t('dietAppliance.dietPlan')}
              </CardTitle>
              <CardDescription>
                {t('dietAppliance.dietPlanDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="diet_text"
                value={formData.diet_text}
                onChange={handleChange}
                placeholder={t('dietAppliance.dietPlanPlaceholder')}
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Exercise Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-600" />
                {t('dietAppliance.exercisePlan')}
              </CardTitle>
              <CardDescription>
                {t('dietAppliance.exercisePlanDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="exercise_text"
                value={formData.exercise_text}
                onChange={handleChange}
                placeholder={t('dietAppliance.exercisePlanPlaceholder')}
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dietAppliance.planSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('dietAppliance.additionalNotes')}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t('dietAppliance.notesPlaceholder')}
                  className="min-h-[100px]"
                />
              </div>

              <Separator />

              {/* Date Range */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">{t('dietAppliance.startDate')}</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">{t('dietAppliance.endDate')}</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Separator />

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('dietAppliance.activePlan')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('dietAppliance.makePlanVisible')}
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 me-2" />
                  {planId ? t('dietAppliance.updatePlan') : t('dietAppliance.createPlan')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DietAppliance;
