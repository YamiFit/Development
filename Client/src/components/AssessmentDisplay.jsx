import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Dumbbell, AlertTriangle, Heart, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AssessmentDisplay({ healthProfile }) {
  const { t } = useTranslation();
  
  // Check if we have any assessment data
  const hasAssessmentData = healthProfile && (
    healthProfile.general_assessment || 
    healthProfile.bmi_category || 
    healthProfile.motivational_message ||
    healthProfile.daily_calorie_target
  );

  if (!hasAssessmentData) {
    return null;
  }

  // Parse JSONB fields if they are strings
  const parseJSONField = (field) => {
    if (!field) return null;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return null;
      }
    }
    return field;
  };

  // Get translated BMI category
  const getBMICategoryLabel = (category) => {
    const categoryMap = {
      'underweight': t('assessment.underweight'),
      'normal': t('assessment.normal'),
      'overweight': t('assessment.overweight'),
      'obese': t('assessment.obese'),
    };
    return categoryMap[category?.toLowerCase()] || category;
  };

  const recommendedExercises = parseJSONField(healthProfile.recommended_exercises);
  const nutritionTips = parseJSONField(healthProfile.nutrition_tips);
  const weeklyPlan = parseJSONField(healthProfile.weekly_plan);
  const warnings = parseJSONField(healthProfile.warnings);

  return (
    <div className="space-y-6 mb-8">
      {/* Motivational Message */}
      {healthProfile.motivational_message && (
        <Card className="bg-gradient-to-r from-yamifit-primary/10 to-yamifit-secondary/10 border-yamifit-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Heart className="h-6 w-6 text-yamifit-primary flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg font-medium text-gray-800">
                  {healthProfile.motivational_message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Status */}
      {(healthProfile.bmi_category || healthProfile.general_assessment) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-yamifit-primary" />
              {t('assessment.yourHealthAssessment')}
            </CardTitle>
            <CardDescription>{t('assessment.basedOnProfile')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthProfile.bmi_category && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{t('assessment.bmiCategory')}</p>
                  <Badge variant={
                    healthProfile.bmi_category === 'normal' ? 'default' :
                    healthProfile.bmi_category === 'underweight' ? 'secondary' :
                    'destructive'
                  } className="text-lg px-4 py-2">
                    {getBMICategoryLabel(healthProfile.bmi_category)}
                  </Badge>
                </div>
              </div>
            )}
            {healthProfile.general_assessment && (
              <p className="text-gray-700">{healthProfile.general_assessment}</p>
            )}
          </CardContent>
        </Card>
      )}


      {/* Daily Targets */}
      <Card>
        <CardHeader>
          <CardTitle>{t('assessment.yourDailyTargets')}</CardTitle>
          <CardDescription>{t('assessment.aiRecommendedGoals')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {healthProfile.daily_calorie_target && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{t('assessment.calories')}</p>
                <p className="text-xl font-semibold text-yamifit-primary">
                  {healthProfile.daily_calorie_target}
                </p>
              </div>
            )}
            {healthProfile.daily_protein_target && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{t('assessment.protein')}</p>
                <p className="text-xl font-semibold text-yamifit-primary">
                  {healthProfile.daily_protein_target}
                </p>
              </div>
            )}
            {healthProfile.daily_carbs_target && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{t('assessment.carbs')}</p>
                <p className="text-xl font-semibold text-yamifit-primary">
                  {healthProfile.daily_carbs_target}
                </p>
              </div>
            )}
            {healthProfile.daily_fats_target && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{t('assessment.fats')}</p>
                <p className="text-xl font-semibold text-yamifit-primary">
                  {healthProfile.daily_fats_target}
                </p>
              </div>
            )}
            {healthProfile.daily_water_target && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{t('assessment.water')}</p>
                <p className="text-xl font-semibold text-yamifit-primary">
                  {healthProfile.daily_water_target}
                </p>
              </div>
            )}
            {healthProfile.target_weight && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{t('assessment.targetWeight')}</p>
                <p className="text-xl font-semibold text-yamifit-primary">
                  {healthProfile.target_weight} {t('units.kg')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Exercises */}
      {recommendedExercises && Array.isArray(recommendedExercises) && recommendedExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-yamifit-primary" />
              {t('assessment.recommendedExercises')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {recommendedExercises.map((exercise, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{exercise.name}</h4>
                    <Badge variant="outline">{exercise.type}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-medium">{t('assessment.frequency')}:</span> {exercise.frequency}
                    </div>
                    <div>
                      <span className="font-medium">{t('assessment.duration')}:</span> {exercise.duration}
                    </div>
                    <div>
                      <span className="font-medium">{t('assessment.intensity')}:</span> {exercise.intensity}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{exercise.benefits}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutrition Tips */}
      {nutritionTips && Array.isArray(nutritionTips) && nutritionTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yamifit-primary" />
              {t('assessment.nutritionTips')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {nutritionTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yamifit-primary mt-1">•</span>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings && Array.isArray(warnings) && warnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              {t('assessment.importantReminders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">⚠</span>
                  <span className="text-orange-900">{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weekly Plan */}
      {weeklyPlan && (
        <Card>
          <CardHeader>
            <CardTitle>{t('assessment.yourWeeklyPlan')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyPlan.description && (
              <p className="text-gray-700">{weeklyPlan.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              {weeklyPlan.calorieTarget && (
                <div>
                  <p className="text-sm text-gray-600">{t('assessment.calorieTarget')}</p>
                  <p className="text-lg font-semibold">{weeklyPlan.calorieTarget}</p>
                </div>
              )}
              {weeklyPlan.workoutDays && (
                <div>
                  <p className="text-sm text-gray-600">{t('assessment.workoutDays')}</p>
                  <p className="text-lg font-semibold">{weeklyPlan.workoutDays}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
