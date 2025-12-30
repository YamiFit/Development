import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const SPORTS_OPTIONS = [
  'Basketball',
  'Boxing',
  'Diving',
  'Football',
  'Golf',
  'Handball',
  'Judo',
  'Swimming',
  'Tennis',
  'Table Tennis',
];

const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Weight Loss' },
  { value: 'gain_muscle', label: 'Muscle Gain' },
  { value: 'maintain', label: 'Maintenance' },
  { value: 'general_health', label: 'Endurance' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Light' },
  { value: 'moderately_active', label: 'Moderate' },
  { value: 'very_active', label: 'Heavy' },
];

const WORK_TYPES = [
  { value: 'sedentary_office', label: 'Desk Job' },
  { value: 'light_activity', label: 'Field Work' },
  { value: 'manual_labor', label: 'Manual Labor' },
  { value: 'heavy_labor', label: 'Mixed Activity' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
];

export default function HealthProfileForm({ onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    height: '',
    current_weight: '',
    age: '',
    gender: '',
    sport: '',
    goal: '',
    activity_level: '',
    work_type: '',
    medical_conditions: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.height || formData.height <= 0) {
      newErrors.height = 'Height is required';
    }
    if (!formData.current_weight || formData.current_weight <= 0) {
      newErrors.current_weight = 'Weight is required';
    }
    if (!formData.age || formData.age <= 0 || formData.age > 120) {
      newErrors.age = 'Valid age is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.sport) {
      newErrors.sport = 'Sport is required';
    }
    if (!formData.goal) {
      newErrors.goal = 'Fitness goal is required';
    }
    if (!formData.activity_level) {
      newErrors.activity_level = 'Activity level is required';
    }
    if (!formData.work_type) {
      newErrors.work_type = 'Work type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convert medical conditions to array format
      const medicalConditionsArray = formData.medical_conditions
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const submissionData = {
        ...formData,
        height: parseFloat(formData.height),
        current_weight: parseFloat(formData.current_weight),
        age: parseInt(formData.age, 10),
        medical_conditions: medicalConditionsArray.length > 0 ? medicalConditionsArray : null,
      };

      onSubmit(submissionData);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Complete Your Health Profile</CardTitle>
        <CardDescription>
          Help us personalize your fitness journey by providing your health information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Height and Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm) *</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder="170"
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
                className={errors.height ? 'border-red-500' : ''}
              />
              {errors.height && (
                <p className="text-sm text-red-500">{errors.height}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70"
                value={formData.current_weight}
                onChange={(e) => handleChange('current_weight', e.target.value)}
                className={errors.current_weight ? 'border-red-500' : ''}
              />
              {errors.current_weight && (
                <p className="text-sm text-red-500">{errors.current_weight}</p>
              )}
            </div>
          </div>

          {/* Row 2: Age and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}
              >
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-500">{errors.gender}</p>
              )}
            </div>
          </div>

          {/* Row 3: Sport and Fitness Goal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sport">Sport *</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) => handleChange('sport', value)}
              >
                <SelectTrigger className={errors.sport ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS_OPTIONS.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sport && (
                <p className="text-sm text-red-500">{errors.sport}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Fitness Goal *</Label>
              <Select
                value={formData.goal}
                onValueChange={(value) => handleChange('goal', value)}
              >
                <SelectTrigger className={errors.goal ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {FITNESS_GOALS.map((goal) => (
                    <SelectItem key={goal.value} value={goal.value}>
                      {goal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.goal && (
                <p className="text-sm text-red-500">{errors.goal}</p>
              )}
            </div>
          </div>

          {/* Row 4: Activity Level and Work Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level *</Label>
              <Select
                value={formData.activity_level}
                onValueChange={(value) => handleChange('activity_level', value)}
              >
                <SelectTrigger className={errors.activity_level ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.activity_level && (
                <p className="text-sm text-red-500">{errors.activity_level}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="work">Work Type *</Label>
              <Select
                value={formData.work_type}
                onValueChange={(value) => handleChange('work_type', value)}
              >
                <SelectTrigger className={errors.work_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((work) => (
                    <SelectItem key={work.value} value={work.value}>
                      {work.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.work_type && (
                <p className="text-sm text-red-500">{errors.work_type}</p>
              )}
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="space-y-2">
            <Label htmlFor="medical">Medical Conditions (Optional)</Label>
            <Textarea
              id="medical"
              placeholder="Enter any medical conditions, separated by commas (e.g., Diabetes, Hypertension)"
              value={formData.medical_conditions}
              onChange={(e) => handleChange('medical_conditions', e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Separate multiple conditions with commas
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-yamifit-primary hover:bg-yamifit-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
