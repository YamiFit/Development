/**
 * WorkingHoursManager Component
 * Manage provider's weekly working hours and delivery slots
 */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import TimeSlotPicker from "../shared/TimeSlotPicker";
import { setWorkingHours } from "@/store/slices/providerSlice";
import { selectWorkingHours, selectProviderProfile } from "@/store/selectors";
import { batchUpdateWorkingHours } from "@/services/api/providers.service";
import {
  DAYS_OF_WEEK,
  DEFAULT_WORKING_HOURS,
} from "@/config/provider.constants";
import { formatDayOfWeek } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";

const WorkingHoursManager = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const providerProfile = useSelector(selectProviderProfile);
  const storedWorkingHours = useSelector(selectWorkingHours);

  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize weekly schedule
  useEffect(() => {
    if (storedWorkingHours.length > 0) {
      // Use stored hours from Redux
      const schedule = DAYS_OF_WEEK.map((day) => {
        const existingHours = storedWorkingHours.find(
          (h) => h.day_of_week === day.value
        );
        if (existingHours) {
        }
        return (
          existingHours || {
            day_of_week: day.value,
            ...DEFAULT_WORKING_HOURS,
          }
        );
      });
      setWeeklySchedule(schedule);
    } else {
      // Initialize with defaults
      const defaultSchedule = DAYS_OF_WEEK.map((day) => ({
        day_of_week: day.value,
        ...DEFAULT_WORKING_HOURS,
      }));
      setWeeklySchedule(defaultSchedule);
    }
  }, [storedWorkingHours]);

  // Handle toggle open/closed
  const handleToggleOpen = (dayIndex) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      is_open: !newSchedule[dayIndex].is_open,
    };
    setWeeklySchedule(newSchedule);
    setHasChanges(true);
  };

  // Handle time change
  const handleTimeChange = (dayIndex, field, value) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      [field]: value,
    };
    setWeeklySchedule(newSchedule);
    setHasChanges(true);
  };

  // Handle add delivery slot
  const handleAddSlot = (dayIndex) => {
    const newSchedule = [...weeklySchedule];
    const currentSlots = newSchedule[dayIndex].delivery_slots || [];
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      delivery_slots: [...currentSlots, ""],
    };
    setWeeklySchedule(newSchedule);
    setHasChanges(true);
  };

  // Handle remove delivery slot
  const handleRemoveSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...weeklySchedule];
    const currentSlots = [...(newSchedule[dayIndex].delivery_slots || [])];
    currentSlots.splice(slotIndex, 1);
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      delivery_slots: currentSlots,
    };
    setWeeklySchedule(newSchedule);
    setHasChanges(true);
  };

  // Handle slot value change
  const handleSlotChange = (dayIndex, slotIndex, value) => {
    const newSchedule = [...weeklySchedule];
    const currentSlots = [...(newSchedule[dayIndex].delivery_slots || [])];
    currentSlots[slotIndex] = value;
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      delivery_slots: currentSlots,
    };
    setWeeklySchedule(newSchedule);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!providerProfile?.id) {
      toast({
        title: "Error",
        description: "Provider profile not found",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await batchUpdateWorkingHours(
        providerProfile.id,
        weeklySchedule
      );

      if (error) throw error;

      // Update Redux state
      dispatch(setWorkingHours(data));
      setHasChanges(false);

      toast({
        title: "Success",
        description: "Working hours updated successfully",
      });
    } catch (err) {
      console.error("❌ Error saving working hours:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update working hours",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {weeklySchedule.map((dayHours, index) => {
        const dayInfo = DAYS_OF_WEEK[index];

        return (
          <Card key={dayInfo.value}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {formatDayOfWeek(dayInfo.value)}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`open-${index}`}
                      className="text-sm cursor-pointer"
                    >
                      {dayHours.is_open ? "Open" : "Closed"}
                    </Label>
                    <Switch
                      id={`open-${index}`}
                      checked={dayHours.is_open}
                      onCheckedChange={() => handleToggleOpen(index)}
                    />
                  </div>
                </div>

                {/* Hours Selection */}
                {dayHours.is_open && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`open-time-${index}`}>
                          Opening Time
                        </Label>
                        <TimeSlotPicker
                          value={dayHours.open_time || "09:00"}
                          onChange={(value) =>
                            handleTimeChange(index, "open_time", value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`close-time-${index}`}>
                          Closing Time
                        </Label>
                        <TimeSlotPicker
                          value={dayHours.close_time || "17:00"}
                          onChange={(value) =>
                            handleTimeChange(index, "close_time", value)
                          }
                        />
                      </div>
                    </div>

                    {/* Delivery Slots */}
                    <div className="space-y-2">
                      <Label className="text-sm">Delivery Time Slots</Label>
                      <div className="space-y-2">
                        {(dayHours.delivery_slots || []).map(
                          (slot, slotIndex) => (
                            <div key={slotIndex} className="flex gap-2">
                              <Input
                                value={slot}
                                onChange={(e) =>
                                  handleSlotChange(
                                    index,
                                    slotIndex,
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., 09:00-12:00"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleRemoveSlot(index, slotIndex)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSlot(index)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? "Saving..." : "Save Working Hours"}
        </Button>
      </div>
    </div>
  );
};

export default WorkingHoursManager;
