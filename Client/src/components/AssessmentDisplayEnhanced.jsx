import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Droplets, Flame, Dumbbell, AlertTriangle, Heart, Info, X, 
  TrendingUp, Apple, Target, Calendar, User, Scale, Ruler,
  Plus, Coffee, Sun, Moon, Cookie
} from 'lucide-react';
import useIntakeTracking from '@/hooks/useIntakeTracking';

export default function AssessmentDisplayEnhanced({ healthProfile }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [selectedCard, setSelectedCard] = useState(null);
  const [mealForm, setMealForm] = useState({
    mealType: 'breakfast',
    mealName: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });
  const [addingMeal, setAddingMeal] = useState(false);
  const [addingWater, setAddingWater] = useState(false);

  // Get intake tracking data
  const {
    dailyIntake,
    meals,
    waterEntries,
    weeklyProgress,
    addMeal,
    addWater,
    updateExercise
  } = useIntakeTracking();

  // Parse JSONB fields if they are strings
  const parseJSONField = (field) => {
    if (!field) return null;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return null;
      }
    }
    return field;
  };

  // Helper function to get localized field based on language
  const getLocalizedField = (baseField, arabicField) => {
    if (isArabic && arabicField) {
      return arabicField;
    }
    return baseField;
  };

  // Get data from health profile with correct column names - use Arabic versions when language is Arabic
  const recommendedExercises = parseJSONField(
    getLocalizedField(healthProfile?.recommended_exercises, healthProfile?.recommended_exercises_arabic)
  ) || [];
  const nutritionTips = parseJSONField(
    getLocalizedField(healthProfile?.nutrition_tips, healthProfile?.nutrition_tips_arabic)
  ) || [];
  const weeklyPlan = parseJSONField(
    getLocalizedField(healthProfile?.weekly_plan, healthProfile?.weekly_plan_arabic)
  ) || [];
  const warnings = parseJSONField(
    getLocalizedField(healthProfile?.warnings, healthProfile?.warnings_arabic)
  ) || [];
  const motivationalMessage = getLocalizedField(
    healthProfile?.motivational_message, 
    healthProfile?.motivational_message_arabic
  );

  // Health data from Supabase with CORRECT column names (ai_*)
  const healthData = {
    calories: { 
      current: dailyIntake.calories_consumed || 0,
      target: parseInt(healthProfile?.ai_calorie_target) || 2000, 
      unit: 'kcal' 
    },
    protein: { 
      current: parseFloat(dailyIntake.protein_consumed) || 0, 
      target: parseInt(healthProfile?.ai_protein_target) || 120, 
      unit: 'g' 
    },
    carbs: { 
      current: parseFloat(dailyIntake.carbs_consumed) || 0, 
      target: parseInt(healthProfile?.ai_carbs_target) || 250, 
      unit: 'g' 
    },
    fats: { 
      current: parseFloat(dailyIntake.fats_consumed) || 0, 
      target: parseInt(healthProfile?.ai_fats_target) || 65, 
      unit: 'g' 
    },
    water: { 
      current: (dailyIntake.water_consumed || 0) / 1000,
      // Handle ai_water_target - could be in ml (>100) or liters (<10)
      target: (() => {
        const waterTarget = parseFloat(healthProfile?.ai_water_target) || 2500;
        return waterTarget > 100 ? waterTarget / 1000 : waterTarget; // Convert ml to L if needed
      })(),
      unit: 'L', 
      glasses: 8,
      currentMl: dailyIntake.water_consumed || 0
    },
    bmi: {
      value: healthProfile?.bmi || 0,
      category: healthProfile?.bmi_category || 'unknown',
      assessment: healthProfile?.general_assessment || '',
      details: healthProfile?.bmi_category === 'overweight' 
        ? t('assessment.bmiOverweightDetails', 'BMI between 25-29.9 is considered overweight. Focus on gradual, sustainable weight loss.')
        : healthProfile?.bmi_category === 'normal'
        ? t('assessment.bmiNormalDetails', 'Your BMI is in the healthy range. Maintain your current lifestyle!')
        : healthProfile?.bmi_category === 'underweight'
        ? t('assessment.bmiUnderweightDetails', 'BMI below 18.5 is underweight. Consider increasing caloric intake.')
        : t('assessment.bmiObeseDetails', 'BMI above 30 is considered obese. Please consult with a healthcare professional.')
    },
    exercises: recommendedExercises.length > 0 
      ? recommendedExercises.map(ex => {
          // Handle different formats
          if (typeof ex === 'string') return { name: ex, type: 'Exercise', duration: '30 min', calories: 100 };
          return {
            name: ex.name || ex.title || ex.exercise || '',
            type: ex.type || ex.category || 'Exercise',
            duration: ex.duration || ex.time || '30 min',
            calories: ex.calories || ex.caloriesBurned || 100
          };
        })
      : [
          { name: t('exercises.briskWalking', 'Brisk Walking'), type: 'Cardio', duration: '30 min', calories: 150 },
          { name: t('exercises.pushUps', 'Push Ups'), type: 'Strength', duration: '15 min', calories: 80 },
          { name: t('exercises.stretching', 'Stretching'), type: 'Flexibility', duration: '10 min', calories: 30 }
        ],
    nutritionTips: nutritionTips.length > 0 
      ? nutritionTips.map(item => {
          // Handle different formats: string, object with tip/reason, or object with title/description
          if (typeof item === 'string') return { tip: item, reason: '' };
          return { 
            tip: item.tip || item.title || item.name || item.text || '',
            reason: item.reason || item.description || item.details || ''
          };
        })
      : [
          { tip: t('nutrition.moreProtein', 'Eat more protein-rich foods'), reason: t('nutrition.moreProteinReason', 'Helps build muscle and keeps you full longer') },
          { tip: t('nutrition.reduceSugar', 'Reduce processed sugar'), reason: t('nutrition.reduceSugarReason', 'Prevents energy crashes and weight gain') },
          { tip: t('nutrition.moreVegetables', 'Increase vegetables intake'), reason: t('nutrition.moreVegetablesReason', 'Provides essential vitamins and fiber') }
        ],
    warnings: warnings,
    motivation: motivationalMessage || t('motivation.default', "You've taken the first step towards a healthier life! 💚 Keep going!"),
    userInfo: {
      weight: healthProfile?.current_weight,
      targetWeight: healthProfile?.target_weight,
      height: healthProfile?.height,
      age: healthProfile?.age,
      gender: healthProfile?.gender,
      goal: healthProfile?.goal,
      activityLevel: healthProfile?.activity_level
    }
  };

  // Build weekly progress from database or default plan
  const buildWeeklyProgress = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const defaultActivities = {
      0: { activity: 'Rest', duration: '—' },
      1: { activity: 'Cardio', duration: '30 min' },
      2: { activity: 'Strength', duration: '45 min' },
      3: { activity: 'Rest/Stretching', duration: '15 min' },
      4: { activity: 'Cardio', duration: '30 min' },
      5: { activity: 'Strength', duration: '45 min' },
      6: { activity: 'Active Recovery', duration: '20 min' }
    };

    if (weeklyProgress && weeklyProgress.length > 0) {
      return weeklyProgress.map(day => ({
        day: day.day_name || days[day.day_number],
        activity: day.activity_type || defaultActivities[day.day_number]?.activity,
        duration: day.duration_minutes ? `${day.duration_minutes} min` : defaultActivities[day.day_number]?.duration,
        completed: day.completion_percentage || 0,
        target: 100,
        date: day.log_date
      }));
    }

    if (weeklyPlan.length > 0) {
      return weeklyPlan;
    }

    return days.map((day, i) => ({
      day: t(`days.${day.toLowerCase()}`, day),
      activity: defaultActivities[i]?.activity,
      duration: defaultActivities[i]?.duration,
      completed: 0,
      target: 100
    }));
  };

  const weeklyData = buildWeeklyProgress();
  const getPercentage = (current, target) => Math.min((current / target) * 100, 100);

  // Handle adding a meal
  const handleAddMeal = async (e) => {
    e.preventDefault();
    setAddingMeal(true);
    
    const success = await addMeal({
      mealType: mealForm.mealType,
      mealName: mealForm.mealName,
      calories: parseInt(mealForm.calories) || 0,
      protein: parseFloat(mealForm.protein) || 0,
      carbs: parseFloat(mealForm.carbs) || 0,
      fats: parseFloat(mealForm.fats) || 0
    });

    if (success) {
      setMealForm({ mealType: 'breakfast', mealName: '', calories: '', protein: '', carbs: '', fats: '' });
    }
    setAddingMeal(false);
  };

  // Handle adding water
  const handleAddWater = async (amount = 250) => {
    setAddingWater(true);
    await addWater(amount);
    setAddingWater(false);
  };

  // Handle exercise completion toggle
  const handleExerciseToggle = async (day) => {
    if (!day.date) return;
    const newPercentage = day.completed >= 100 ? 0 : 100;
    await updateExercise({
      date: day.date,
      activityType: day.activity,
      durationMinutes: parseInt(day.duration) || 30,
      completionPercentage: newPercentage,
      completed: newPercentage >= 100
    });
  };

  // Water Glass Component
  const WaterGlass = ({ filled, onClick }) => (
    <button
      onClick={onClick}
      disabled={addingWater}
      className="relative w-10 h-14 flex items-end justify-center cursor-pointer hover:scale-105 transition-transform disabled:opacity-50"
    >
      <div className="absolute inset-0 border-2 border-[#3BB273] rounded-b-xl rounded-t-sm bg-gradient-to-b from-white/20 to-white/5" style={{ borderTopWidth: '1px' }} />
      <div className={`absolute bottom-0 left-0 right-0 rounded-b-xl transition-all duration-700 ${filled ? 'bg-gradient-to-t from-[#3BB273] to-[#3BB273]/80' : 'bg-transparent'}`}
        style={{ height: filled ? '85%' : '0%', boxShadow: filled ? 'inset 0 -2px 12px rgba(59, 178, 115, 0.4)' : 'none' }}>
        {filled && <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-full" />}
      </div>
      <div className="absolute top-2 left-1 w-1 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full" />
      {!filled && <div className="absolute inset-0 flex items-center justify-center"><Plus className="text-[#3BB273]/50" size={16} /></div>}
    </button>
  );

  // Weekly Progress Chart Component
  const WeeklyChart = ({ data }) => {
    const maxHeight = 160;
    const barWidth = 32;
    const gap = 12;
    const chartWidth = data.length * (barWidth + gap);

    return (
      <div className="bg-gradient-to-br from-[#F4F7F5] to-white p-5 rounded-2xl border border-[#3BB273]/20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="text-[#3BB273]" size={20} />
            <h3 className="font-bold text-[#2D3142] text-base">{t('assessment.weeklyProgress', 'Weekly Progress')}</h3>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#3BB273]"></div><span className="text-[#2D3142]/70">{t('assessment.completed', 'Completed')}</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#3BB273]/20"></div><span className="text-[#2D3142]/70">{t('assessment.target', 'Target')}</span></div>
          </div>
        </div>

        <div className="relative overflow-x-auto pb-2">
          <svg width={chartWidth} height={maxHeight + 50} className="mx-auto">
            {[0, 50, 100].map((value, i) => {
              const y = maxHeight - (value / 100) * maxHeight;
              return <g key={i}><line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#EAF0ED" strokeWidth="1" /></g>;
            })}
            {data.map((day, index) => {
              const x = index * (barWidth + gap) + gap;
              const completedHeight = (day.completed / 100) * maxHeight;
              return (
                <g key={index} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleExerciseToggle(day)}>
                  <rect x={x} y={0} width={barWidth} height={maxHeight} fill="#3BB273" opacity="0.1" rx="6" />
                  <rect x={x} y={maxHeight - completedHeight} width={barWidth} height={completedHeight} fill="#3BB273" rx="6" />
                  {day.completed >= 100 && (
                    <g transform={`translate(${x + barWidth/2 - 6}, ${maxHeight - completedHeight - 18})`}>
                      <circle cx="6" cy="6" r="8" fill="#3BB273" />
                      <path d="M 3 6 L 5 8 L 9 4" stroke="white" strokeWidth="1.5" fill="none" />
                    </g>
                  )}
                  <text x={x + barWidth / 2} y={maxHeight + 16} fontSize="11" fontWeight="bold" fill="#2D3142" textAnchor="middle">{day.day}</text>
                  <text x={x + barWidth / 2} y={maxHeight + 30} fontSize="9" fill="#2D3142" opacity="0.5" textAnchor="middle">{day.activity?.split(' ')[0]?.substring(0, 8)}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-center text-xs text-[#2D3142]/50 mb-4">{t('assessment.clickToToggle', 'Click on a day to toggle completion')}</p>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#3BB273]/10">
          <div className="text-center"><p className="text-xl font-bold text-[#3BB273]">{data.filter(d => d.completed >= 100).length}</p><p className="text-xs text-[#2D3142]/60">{t('assessment.daysCompleted', 'Days Done')}</p></div>
          <div className="text-center"><p className="text-xl font-bold text-[#FF8C42]">{Math.round(data.reduce((sum, d) => sum + d.completed, 0) / data.length)}%</p><p className="text-xs text-[#2D3142]/60">{t('assessment.avgProgress', 'Avg Progress')}</p></div>
          <div className="text-center"><p className="text-xl font-bold text-[#2D3142]">{7 - data.filter(d => d.completed >= 100).length}</p><p className="text-xs text-[#2D3142]/60">{t('assessment.remaining', 'Remaining')}</p></div>
        </div>
      </div>
    );
  };

  // Modal component
  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-[#2D3142]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-[#3BB273]/5 to-white border-b border-[#EAF0ED] p-5 flex items-center justify-between rounded-t-3xl">
          <h3 className="font-bold text-xl text-[#2D3142]">{title}</h3>
          <button onClick={onClose} className="text-[#2D3142]/60 hover:text-[#2D3142] p-2 hover:bg-[#F4F7F5] rounded-full transition-all"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );

  // Card wrapper component
  const Card = ({ children, onClick, className = '', priority = false }) => (
    <div onClick={onClick} className={`bg-white rounded-2xl p-5 ${onClick ? 'cursor-pointer' : ''} transition-all duration-300 ${priority ? `shadow-lg shadow-[#3BB273]/20 ring-2 ring-[#3BB273]/20 ${onClick ? 'hover:shadow-xl' : ''}` : `shadow-md ${onClick ? 'hover:shadow-lg hover:-translate-y-0.5' : ''}`} ${className}`}>
      {children}
    </div>
  );

  // Circular Progress for calories
  const CircularProgress = ({ percentage, current, target, unit }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative w-40 h-40 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF8C42]/10 to-[#FF8C42]/5" />
        <svg className="w-full h-full -rotate-90 relative z-10">
          <circle cx="80" cy="80" r={radius} stroke="#EAF0ED" strokeWidth="12" fill="none" />
          <circle cx="80" cy="80" r={radius} stroke="#FF8C42" strokeWidth="12" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-[#2D3142]">{Math.round(current)}</p>
          <p className="text-xs text-[#2D3142]/60">/ {target} {unit}</p>
          <div className="mt-1 px-2 py-0.5 bg-[#FF8C42]/10 rounded-full"><p className="text-xs font-semibold text-[#FF8C42]">{Math.round(percentage)}%</p></div>
        </div>
      </div>
    );
  };

  // Linear progress bar
  const LinearProgress = ({ percentage, color = '#3BB273' }) => (
    <div className="w-full bg-[#EAF0ED] h-2 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: color }} />
    </div>
  );

  // Meal type icons
  const MealTypeIcon = ({ type }) => {
    switch (type) {
      case 'breakfast': return <Coffee className="text-[#FF8C42]" size={18} />;
      case 'lunch': return <Sun className="text-[#3BB273]" size={18} />;
      case 'dinner': return <Moon className="text-[#2D3142]" size={18} />;
      case 'snack': return <Cookie className="text-[#FF8C42]" size={18} />;
      default: return <Flame className="text-[#FF8C42]" size={18} />;
    }
  };

  const filledGlasses = Math.floor(healthData.water.currentMl / 250);
  const waterPercentage = getPercentage(healthData.water.current, healthData.water.target);

  const getBMICategoryColor = (category) => {
    switch(category?.toLowerCase()) {
      case 'normal': return '#3BB273';
      case 'underweight': return '#3B82F6';
      case 'overweight': return '#FF8C42';
      case 'obese': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-[#3BB273] to-[#3BB273]/80 rounded-xl shadow-lg shadow-[#3BB273]/30">
          <TrendingUp className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2D3142]">{t('dashboard.title', 'Health Dashboard')}</h1>
          <p className="text-sm text-[#2D3142]/60">{t('dashboard.subtitle', 'Track your daily goals and health status')}</p>
        </div>
      </div>

      {/* User Stats Row */}
      {healthData.userInfo.weight && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {healthData.userInfo.weight && (
            <Card className="text-center py-4">
              <Scale className="mx-auto text-[#3BB273] mb-2" size={20} />
              <p className="text-xl font-bold text-[#2D3142]">{healthData.userInfo.weight} <span className="text-sm font-normal">kg</span></p>
              <p className="text-xs text-[#2D3142]/60">{t('profile.currentWeight', 'Current Weight')}</p>
            </Card>
          )}
          {healthData.userInfo.targetWeight && (
            <Card className="text-center py-4">
              <Target className="mx-auto text-[#FF8C42] mb-2" size={20} />
              <p className="text-xl font-bold text-[#2D3142]">{healthData.userInfo.targetWeight} <span className="text-sm font-normal">kg</span></p>
              <p className="text-xs text-[#2D3142]/60">{t('profile.targetWeight', 'Target Weight')}</p>
            </Card>
          )}
          {healthData.userInfo.height && (
            <Card className="text-center py-4">
              <Ruler className="mx-auto text-[#2D3142]/70 mb-2" size={20} />
              <p className="text-xl font-bold text-[#2D3142]">{healthData.userInfo.height} <span className="text-sm font-normal">cm</span></p>
              <p className="text-xs text-[#2D3142]/60">{t('profile.height', 'Height')}</p>
            </Card>
          )}
          {healthData.userInfo.age && (
            <Card className="text-center py-4">
              <User className="mx-auto text-[#2D3142]/70 mb-2" size={20} />
              <p className="text-xl font-bold text-[#2D3142]">{healthData.userInfo.age} <span className="text-sm font-normal">{t('profile.years', 'yrs')}</span></p>
              <p className="text-xs text-[#2D3142]/60">{t('profile.age', 'Age')}</p>
            </Card>
          )}
        </div>
      )}

      {/* Priority Cards: Calories & Water */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Daily Calories Target */}
        <Card priority onClick={() => setSelectedCard('calories')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-gradient-to-br from-[#FF8C42] to-[#FF8C42]/80 rounded-xl shadow-lg shadow-[#FF8C42]/30">
                <Flame className="text-white" size={22} />
              </div>
              <div>
                <h2 className="font-bold text-[#2D3142] text-lg">{t('assessment.dailyCalories', 'Daily Calories')}</h2>
                <p className="text-xs text-[#2D3142]/60">{t('assessment.aiTarget', 'AI-Generated Target')}</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-[#FF8C42]/10 rounded-full">
              <p className="text-xs font-bold text-[#FF8C42]">{t('assessment.priority', 'PRIORITY')}</p>
            </div>
          </div>
          <CircularProgress percentage={getPercentage(healthData.calories.current, healthData.calories.target)} current={healthData.calories.current} target={healthData.calories.target} unit={healthData.calories.unit} />
          <div className="mt-4 p-3 bg-gradient-to-r from-[#FF8C42]/5 to-[#FF8C42]/10 rounded-xl border border-[#FF8C42]/20">
            <p className="text-center font-semibold text-[#2D3142] text-sm">{t('assessment.targetCalories', 'Your daily target')}: <span className="text-[#FF8C42]">{healthData.calories.target} kcal</span></p>
          </div>
          <p className="text-center text-xs text-[#2D3142]/50 mt-2">{t('assessment.clickToAdd', 'Click to add a meal')}</p>
        </Card>

        {/* Daily Water */}
        <Card priority onClick={() => setSelectedCard('water')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-gradient-to-br from-[#3BB273] to-[#3BB273]/80 rounded-xl shadow-lg shadow-[#3BB273]/30">
                <Droplets className="text-white" size={22} />
              </div>
              <div>
                <h2 className="font-bold text-[#2D3142] text-lg">{t('assessment.dailyWater', 'Daily Water')}</h2>
                <p className="text-xs text-[#2D3142]/60">{t('assessment.stayHydrated', 'Stay Hydrated')}</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-[#3BB273]/10 rounded-full">
              <p className="text-xs font-bold text-[#3BB273]">{t('assessment.priority', 'PRIORITY')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-bold text-[#2D3142]">{healthData.water.current.toFixed(1)}L</span>
              <span className="text-[#2D3142]/60 font-medium">/ {healthData.water.target}L</span>
            </div>
            <LinearProgress percentage={waterPercentage} color="#3BB273" />
            <div className="p-4 bg-gradient-to-br from-[#3BB273]/10 to-transparent rounded-xl border border-[#3BB273]/20">
              <p className="text-sm font-semibold text-[#3BB273] mb-3 text-center">{Math.min(filledGlasses, healthData.water.glasses)} / {healthData.water.glasses} {t('assessment.glasses', 'glasses')}</p>
              <div className="flex justify-center flex-wrap gap-2">
                {[...Array(healthData.water.glasses)].map((_, i) => (
                  <WaterGlass key={i} filled={i < filledGlasses} onClick={i >= filledGlasses ? () => handleAddWater(250) : undefined} />
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-[#2D3142]/50 mt-2">{t('assessment.clickGlass', 'Click an empty glass to add water')}</p>
        </Card>
      </div>

      {/* Macros Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'protein', label: t('assessment.protein', 'Protein'), color: '#3BB273', icon: '🥩' },
          { key: 'carbs', label: t('assessment.carbs', 'Carbs'), color: '#FF8C42', icon: '🍞' },
          { key: 'fats', label: t('assessment.fats', 'Fats'), color: '#2D3142', icon: '🥑' }
        ].map(({ key, label, color, icon }) => (
          <Card key={key} onClick={() => setSelectedCard('calories')}>
            <div className="text-center space-y-2">
              <div className="mx-auto w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center"><span className="text-xl">{icon}</span></div>
              <p className="text-xs font-semibold text-[#2D3142]/60 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-[#2D3142]">{Math.round(healthData[key].current)}<span className="text-xs text-[#2D3142]/50 font-normal">/{healthData[key].target}g</span></p>
              <LinearProgress percentage={getPercentage(healthData[key].current, healthData[key].target)} color={color} />
            </div>
          </Card>
        ))}
      </div>

      {/* BMI Assessment */}
      {healthData.bmi.value > 0 && (
        <Card onClick={() => setSelectedCard('bmi')} className="bg-gradient-to-br from-[#EAF0ED] to-white border border-[#3BB273]/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="text-[#3BB273]" size={20} />
                <h2 className="font-bold text-[#2D3142] text-lg">{t('assessment.bmiAssessment', 'BMI Assessment')}</h2>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold" style={{ color: getBMICategoryColor(healthData.bmi.category) }}>{healthData.bmi.value?.toFixed(1)}</span>
                <span className="px-3 py-1.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: getBMICategoryColor(healthData.bmi.category) }}>{t(`assessment.${healthData.bmi.category}`, healthData.bmi.category)}</span>
              </div>
              <p className="text-sm text-[#2D3142]/70 line-clamp-2">{healthData.bmi.assessment}</p>
            </div>
            <Info className="text-[#2D3142]/30 flex-shrink-0" size={18} />
          </div>
        </Card>
      )}

      {/* Exercises and Nutrition Tips */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card onClick={() => setSelectedCard('exercises')}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-[#3BB273]/20 to-[#3BB273]/10 rounded-lg"><Dumbbell className="text-[#3BB273]" size={20} /></div>
            <h2 className="font-bold text-[#2D3142]">{t('assessment.recommendedExercises', 'Recommended Exercises')}</h2>
          </div>
          <ul className="space-y-2">
            {healthData.exercises.slice(0, 3).map((ex, i) => (
              <li key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#F4F7F5] to-[#EAF0ED] rounded-xl border border-[#3BB273]/10">
                <div><p className="font-semibold text-[#2D3142] text-sm">{ex.name}</p><p className="text-xs text-[#2D3142]/60">{ex.type} • {ex.duration}</p></div>
                <span className="text-xs text-[#3BB273] font-bold bg-[#3BB273]/10 px-2 py-1 rounded-full">{ex.calories} cal</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card onClick={() => setSelectedCard('nutrition')}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-[#FF8C42]/20 to-[#FF8C42]/10 rounded-lg"><span className="text-xl">🥗</span></div>
            <h2 className="font-bold text-[#2D3142]">{t('assessment.nutritionTips', 'Nutrition Tips')}</h2>
          </div>
          <ul className="space-y-2">
            {healthData.nutritionTips.slice(0, 3).map((item, i) => (
              <li key={i} className="p-3 bg-gradient-to-r from-[#F4F7F5] to-[#EAF0ED] rounded-xl border border-[#FF8C42]/10">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C42] mt-1.5 flex-shrink-0" />
                  <div><p className="font-semibold text-[#2D3142] text-sm">{item.tip}</p><p className="text-xs text-[#2D3142]/60">{item.reason}</p></div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Weekly Plan */}
      <Card><WeeklyChart data={weeklyData} /></Card>

      {/* Warnings */}
      {healthData.warnings.length > 0 && (
        <Card className="bg-gradient-to-br from-[#FF8C42]/10 to-white border-2 border-[#FF8C42]/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#FF8C42]/20 rounded-lg flex-shrink-0"><AlertTriangle className="text-[#FF8C42]" size={20} /></div>
            <div className="flex-1">
              <h2 className="font-bold text-[#FF8C42] mb-3">{t('assessment.healthAlerts', 'Health Alerts')}</h2>
              <ul className="space-y-2">
                {healthData.warnings.map((warning, i) => (
                  <li key={i} className="p-3 bg-white rounded-xl border border-[#FF8C42]/20">
                    <p className="font-semibold text-[#2D3142] text-sm">{warning.message || warning}</p>
                    {warning.action && <p className="text-xs text-[#2D3142]/70 mt-1">{warning.action}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Motivation */}
      <div className="bg-gradient-to-r from-[#3BB273] to-[#3BB273]/80 text-white text-center shadow-xl shadow-[#3BB273]/30 rounded-2xl p-5">
        <Heart className="mx-auto mb-3" size={32} />
        <p className="text-lg font-bold leading-relaxed">{healthData.motivation}</p>
      </div>

      {/* Add Meal Modal */}
      {selectedCard === 'calories' && (
        <Modal title={t('assessment.addMeal', 'Add Meal')} onClose={() => setSelectedCard(null)}>
          <div className="space-y-5">
            <div className="flex justify-center mb-4">
              <CircularProgress percentage={getPercentage(healthData.calories.current, healthData.calories.target)} current={healthData.calories.current} target={healthData.calories.target} unit={healthData.calories.unit} />
            </div>

            {meals.length > 0 && (
              <div className="bg-[#F4F7F5] p-4 rounded-xl mb-4">
                <h4 className="font-bold text-[#2D3142] mb-3">{t('assessment.todaysMeals', "Today's Meals")}</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {meals.map((meal, i) => (
                    <li key={i} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <MealTypeIcon type={meal.meal_type} />
                        <div><p className="text-sm font-medium text-[#2D3142]">{meal.meal_name || meal.meal_type}</p><p className="text-xs text-[#2D3142]/50">P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g</p></div>
                      </div>
                      <span className="text-sm font-bold text-[#FF8C42]">{meal.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D3142] mb-2">{t('assessment.mealType', 'Meal Type')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                    <button key={type} type="button" onClick={() => setMealForm(prev => ({ ...prev, mealType: type }))}
                      className={`p-3 rounded-xl text-center transition-all ${mealForm.mealType === type ? 'bg-[#3BB273] text-white shadow-lg' : 'bg-[#F4F7F5] text-[#2D3142] hover:bg-[#EAF0ED]'}`}>
                      <MealTypeIcon type={type} /><p className="text-xs mt-1 capitalize">{t(`meals.categories.${type}`, type)}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D3142] mb-1">{t('assessment.mealName', 'Meal Name')} ({t('common.optional', 'optional')})</label>
                <input type="text" value={mealForm.mealName} onChange={(e) => setMealForm(prev => ({ ...prev, mealName: e.target.value }))} placeholder={t('assessment.mealNamePlaceholder', 'e.g., Grilled Chicken Salad')} className="w-full px-4 py-2 border border-[#EAF0ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3BB273]/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-[#2D3142] mb-1">{t('assessment.calories', 'Calories')} *</label><input type="number" value={mealForm.calories} onChange={(e) => setMealForm(prev => ({ ...prev, calories: e.target.value }))} placeholder="0" required className="w-full px-4 py-2 border border-[#EAF0ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50" /></div>
                <div><label className="block text-sm font-medium text-[#2D3142] mb-1">{t('assessment.protein', 'Protein')} (g)</label><input type="number" step="0.1" value={mealForm.protein} onChange={(e) => setMealForm(prev => ({ ...prev, protein: e.target.value }))} placeholder="0" className="w-full px-4 py-2 border border-[#EAF0ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3BB273]/50" /></div>
                <div><label className="block text-sm font-medium text-[#2D3142] mb-1">{t('assessment.carbs', 'Carbs')} (g)</label><input type="number" step="0.1" value={mealForm.carbs} onChange={(e) => setMealForm(prev => ({ ...prev, carbs: e.target.value }))} placeholder="0" className="w-full px-4 py-2 border border-[#EAF0ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3BB273]/50" /></div>
                <div><label className="block text-sm font-medium text-[#2D3142] mb-1">{t('assessment.fats', 'Fats')} (g)</label><input type="number" step="0.1" value={mealForm.fats} onChange={(e) => setMealForm(prev => ({ ...prev, fats: e.target.value }))} placeholder="0" className="w-full px-4 py-2 border border-[#EAF0ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3BB273]/50" /></div>
              </div>
              <button type="submit" disabled={addingMeal || !mealForm.calories} className="w-full py-3 bg-gradient-to-r from-[#FF8C42] to-[#FF8C42]/90 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {addingMeal ? (<><div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />{t('common.saving', 'Saving...')}</>) : (<><Plus size={20} />{t('assessment.addMeal', 'Add Meal')}</>)}
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Water Modal */}
      {selectedCard === 'water' && (
        <Modal title={t('assessment.waterDetails', 'Water Intake')} onClose={() => setSelectedCard(null)}>
          <div className="space-y-5">
            <div className="text-center p-5 bg-gradient-to-br from-[#3BB273]/10 to-white rounded-xl border border-[#3BB273]/20">
              <Droplets size={48} className="text-[#3BB273] mx-auto mb-3" />
              <p className="text-2xl font-bold text-[#2D3142]">{healthData.water.current.toFixed(1)}L / {healthData.water.target}L</p>
              <p className="text-sm text-[#2D3142]/60 mt-1">{healthData.water.currentMl} ml {t('assessment.consumed', 'consumed')}</p>
            </div>
            <div className="p-4 bg-[#F4F7F5] rounded-xl">
              <p className="text-sm font-semibold text-[#3BB273] mb-3 text-center">{t('assessment.clickToAddWater', 'Click an empty glass to add 250ml')}</p>
              <div className="flex justify-center gap-2">
                {[...Array(healthData.water.glasses)].map((_, i) => (<WaterGlass key={i} filled={i < filledGlasses} onClick={i >= filledGlasses ? () => handleAddWater(250) : undefined} />))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[250, 500, 1000].map(amount => (
                <button key={amount} onClick={() => handleAddWater(amount)} disabled={addingWater} className="p-3 bg-[#3BB273]/10 hover:bg-[#3BB273]/20 text-[#3BB273] font-semibold rounded-xl transition-all disabled:opacity-50">
                  <Plus className="mx-auto mb-1" size={18} />{amount}ml
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[{ icon: '💪', text: t('water.energy', 'Boosts Energy') }, { icon: '🧠', text: t('water.focus', 'Improves Focus') }, { icon: '✨', text: t('water.skin', 'Healthy Skin') }, { icon: '🔥', text: t('water.digestion', 'Aids Digestion') }].map((b, i) => (
                <div key={i} className="bg-[#F4F7F5] p-3 rounded-xl text-center"><div className="text-xl mb-1">{b.icon}</div><div className="text-xs font-semibold text-[#2D3142]/70">{b.text}</div></div>
              ))}
            </div>
            {waterEntries.length > 0 && (
              <div className="bg-[#F4F7F5] p-4 rounded-xl">
                <h4 className="font-bold text-[#2D3142] mb-2">{t('assessment.todaysLog', "Today's Log")}</h4>
                <div className="flex flex-wrap gap-2">
                  {waterEntries.map((entry, i) => (<span key={i} className="px-2 py-1 bg-[#3BB273]/20 text-[#3BB273] text-xs rounded-full">{entry.amount}ml @ {new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* BMI Modal */}
      {selectedCard === 'bmi' && healthData.bmi.value > 0 && (
        <Modal title={t('assessment.bmiAssessment', 'BMI Assessment')} onClose={() => setSelectedCard(null)}>
          <div className="space-y-5">
            <div className="text-center p-5 bg-gradient-to-br from-[#F4F7F5] to-white rounded-xl border">
              <div className="text-4xl font-bold mb-2" style={{ color: getBMICategoryColor(healthData.bmi.category) }}>{healthData.bmi.value?.toFixed(1)}</div>
              <span className="px-4 py-2 rounded-full text-sm font-bold text-white inline-block" style={{ backgroundColor: getBMICategoryColor(healthData.bmi.category) }}>{t(`assessment.${healthData.bmi.category}`, healthData.bmi.category)}</span>
            </div>
            <div className="relative h-3 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-400 rounded-full">
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow" style={{ left: `${Math.min((healthData.bmi.value / 40) * 100, 100)}%`, borderColor: getBMICategoryColor(healthData.bmi.category) }} />
            </div>
            <div className="flex justify-between text-xs text-[#2D3142]/50"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
            <div className="bg-[#F4F7F5] p-4 rounded-xl"><p className="text-sm text-[#2D3142]/70">{healthData.bmi.details}</p></div>
            {healthData.bmi.assessment && (<div className="bg-gradient-to-br from-[#3BB273]/5 to-white p-4 rounded-xl border border-[#3BB273]/10"><h4 className="font-bold text-[#2D3142] mb-2">{t('assessment.personalAssessment', 'Your Assessment')}</h4><p className="text-sm text-[#2D3142]/70">{healthData.bmi.assessment}</p></div>)}
          </div>
        </Modal>
      )}

      {/* Exercises Modal */}
      {selectedCard === 'exercises' && (
        <Modal title={t('assessment.recommendedExercises', 'Recommended Exercises')} onClose={() => setSelectedCard(null)}>
          <div className="space-y-3">
            {healthData.exercises.map((ex, i) => (
              <div key={i} className="p-4 bg-gradient-to-r from-[#F4F7F5] to-[#EAF0ED] rounded-xl border border-[#3BB273]/10">
                <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-[#2D3142]">{ex.name}</h4><span className="text-sm text-[#3BB273] font-bold bg-[#3BB273]/10 px-2 py-1 rounded-full">{ex.calories} cal</span></div>
                <div className="flex gap-4 text-sm text-[#2D3142]/60"><span>📍 {ex.type}</span><span>⏱️ {ex.duration}</span>{ex.frequency && <span>🔄 {ex.frequency}</span>}{ex.intensity && <span>💪 {ex.intensity}</span>}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Nutrition Tips Modal */}
      {selectedCard === 'nutrition' && (
        <Modal title={t('assessment.nutritionTips', 'Nutrition Tips')} onClose={() => setSelectedCard(null)}>
          <div className="space-y-3">
            {healthData.nutritionTips.map((item, i) => (
              <div key={i} className="p-4 bg-gradient-to-r from-[#F4F7F5] to-[#EAF0ED] rounded-xl border border-[#FF8C42]/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF8C42]/10 flex items-center justify-center flex-shrink-0"><span className="text-lg">💡</span></div>
                  <div><p className="font-bold text-[#2D3142]">{item.tip}</p><p className="text-sm text-[#2D3142]/60 mt-1">{item.reason}</p></div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
