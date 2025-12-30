/**
 * Coach My Clients Page
 * Displays all active clients assigned to the coach
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Search,
  AlertCircle,
  Scale,
  Target,
  Activity,
  User,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import { getCoachClients } from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';

const CoachMyClients = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const { data, error } = await getCoachClients();

        if (error) throw error;

        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: t('common.error'),
          description: t('coachClients.failedToLoadClients'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user?.id, toast]);

  // Filter clients by search query
  const filteredClients = clients.filter((assignment) => {
    const clientName = assignment.user?.full_name || assignment.user?.email || '';
    return clientName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get goal label
  const getGoalLabel = (goal) => {
    const goals = {
      lose_weight: t('goals.loseWeight'),
      gain_muscle: t('goals.gainMuscle'),
      maintain: t('goals.maintain'),
      general_health: t('goals.generalHealth'),
    };
    return goals[goal] || goal || t('coachClients.notSet');
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Render loading skeleton
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
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
              <Users className="h-8 w-8 text-primary" />
              {t('coachClients.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('coachClients.activeClientsCount', { count: clients.length })}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('coachClients.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>

        {/* Empty State */}
        {clients.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('coachClients.noClientsYet')}</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {t('coachClients.noClientsDescription')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Search Results */}
        {clients.length > 0 && filteredClients.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('common.noResultsFound')}</h3>
              <p className="text-muted-foreground text-center">
                {t('coachClients.noSearchResults', { query: searchQuery })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((assignment) => {
            const client = assignment.user;
            const health = assignment.health_profile;

            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        {client?.avatar_url ? (
                          <AvatarImage src={client.avatar_url} alt={client.full_name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(client?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {client?.full_name || t('coachClients.unknownClient')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {client?.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {t('coachClients.active')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Health Metrics Summary */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {health?.current_weight && (
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span>{health.current_weight} kg</span>
                      </div>
                    )}
                    {health?.height && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>{health.height} cm</span>
                      </div>
                    )}
                    {health?.target_weight && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{t('coachClients.goal')}: {health.target_weight} kg</span>
                      </div>
                    )}
                    {health?.goal && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{getGoalLabel(health.goal)}</span>
                      </div>
                    )}
                  </div>

                  {/* No Health Data Warning */}
                  {!health && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{t('coachClients.healthProfileNotCompleted')}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => navigate(`/coach/clients/${assignment.user_id}/chat`)}
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 me-1" />
                      {t('coachClients.chat')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/coach/clients/${assignment.user_id}/plan`)}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 me-1" />
                      {t('coachClients.plan')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/coach/clients/${assignment.user_id}/appointments`)}
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4 me-1" />
                      {t('coachClients.book')}
                    </Button>
                  </div>

                  {/* View Full Profile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/coach/clients/${assignment.user_id}`)}
                  >
                    <User className="h-4 w-4 me-2" />
                    {t('coachClients.viewFullProfile')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default CoachMyClients;
