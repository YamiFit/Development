import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, Mail, MessageSquare, ShoppingBag, Calendar, TrendingUp } from 'lucide-react';

export default function NotificationsTab() {
  const { t } = useTranslation();
  const {
    notificationPreferences,
    notificationsLoading,
    authLoading,
    updateNotificationPreferences,
  } = useSettings();

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email_notifications: true,
    push_notifications: true,
    meal_reminders: true,
    water_reminders: true,
    order_updates: true,
    subscription_expiry: true,
    weight_updates: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load notification preferences when available
  useEffect(() => {
    if (notificationPreferences) {
      setFormData({
        email_notifications: notificationPreferences.email_notifications ?? true,
        push_notifications: notificationPreferences.push_notifications ?? true,
        meal_reminders: notificationPreferences.meal_reminders ?? true,
        water_reminders: notificationPreferences.water_reminders ?? true,
        order_updates: notificationPreferences.order_updates ?? true,
        subscription_expiry: notificationPreferences.subscription_expiry ?? true,
        weight_updates: notificationPreferences.weight_updates ?? true,
      });
      setIsInitialized(true);
    }
  }, [notificationPreferences]);

  const handleToggle = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await updateNotificationPreferences(formData);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message || t('settingsNotifications.updateFailed'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        description: t('settingsNotifications.updateSuccess'),
      });
    }

    setIsSaving(false);
  };

  if ((authLoading || notificationsLoading) && !isInitialized) {
    return (
      <div className="bg-white rounded-xl p-6 shadow border flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const notificationSettings = [
    {
      section: t('settingsNotifications.generalNotifications'),
      items: [
        {
          key: 'email_notifications',
          icon: Mail,
          label: t('settingsNotifications.emailNotifications'),
          description: t('settingsNotifications.emailNotificationsDesc'),
        },
        {
          key: 'push_notifications',
          icon: Bell,
          label: t('settingsNotifications.pushNotifications'),
          description: t('settingsNotifications.pushNotificationsDesc'),
        },
      ],
    },
    {
      section: t('settingsNotifications.healthTracking'),
      items: [
        {
          key: 'meal_reminders',
          icon: MessageSquare,
          label: t('settingsNotifications.mealReminders'),
          description: t('settingsNotifications.mealRemindersDesc'),
        },
        {
          key: 'water_reminders',
          icon: MessageSquare,
          label: t('settingsNotifications.waterReminders'),
          description: t('settingsNotifications.waterRemindersDesc'),
        },
        {
          key: 'weight_updates',
          icon: TrendingUp,
          label: t('settingsNotifications.weightUpdates'),
          description: t('settingsNotifications.weightUpdatesDesc'),
        },
      ],
    },
    {
      section: t('settingsNotifications.ordersSubscriptions'),
      items: [
        {
          key: 'order_updates',
          icon: ShoppingBag,
          label: t('settingsNotifications.orderUpdates'),
          description: t('settingsNotifications.orderUpdatesDesc'),
        },
        {
          key: 'subscription_expiry',
          icon: Calendar,
          label: t('settingsNotifications.subscriptionExpiry'),
          description: t('settingsNotifications.subscriptionExpiryDesc'),
        },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow border">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settingsNotifications.title')}</h2>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {notificationSettings.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {section.section}
            </h3>

            <div className="space-y-4">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-gray-50 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="mt-0.5 flex-shrink-0">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={item.key}
                          className="font-medium cursor-pointer text-sm sm:text-base"
                        >
                          {item.label}
                        </Label>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <Switch
                      id={item.key}
                      checked={formData[item.key]}
                      onCheckedChange={(checked) => handleToggle(item.key, checked)}
                      className="flex-shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            type="submit"
            disabled={isSaving || notificationsLoading}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('settingsNotifications.saving')}
              </>
            ) : (
              t('settingsNotifications.savePreferences')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
