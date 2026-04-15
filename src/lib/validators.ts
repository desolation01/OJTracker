import { z } from "zod";

export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/);
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const createEntrySchema = z
  .object({
    date: dateKeySchema,
    hours: z.number().int().min(0).max(24),
    minutes: z.number().int().min(0).max(59),
    timeIn: timeSchema.optional().or(z.literal("")),
    timeOut: timeSchema.optional().or(z.literal("")),
    note: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((value) => value.hours * 60 + value.minutes > 0, {
    message: "Total duration must be greater than 0.",
    path: ["hours"],
  });

export const updateEntrySchema = z
  .object({
    hours: z.number().int().min(0).max(24).optional(),
    minutes: z.number().int().min(0).max(59).optional(),
    timeIn: timeSchema.optional().or(z.literal("")),
    timeOut: timeSchema.optional().or(z.literal("")),
    note: z.string().max(500).optional().or(z.literal("")),
  })
  .refine(
    (value) => {
      if (value.hours === undefined && value.minutes === undefined) {
        return true;
      }
      return (value.hours ?? 0) * 60 + (value.minutes ?? 0) > 0;
    },
    {
      message: "Total duration must be greater than 0.",
      path: ["hours"],
    },
  );

export const bulkEntrySchema = z.object({
  startDate: dateKeySchema,
  endDate: dateKeySchema,
});

export const updateSettingsSchema = z.object({
  targetHours: z.number().int().min(1).max(5000).optional(),
  defaultHoursPerDay: z.number().min(0.5).max(24).optional(),
  defaultStartTime: timeSchema.optional(),
  defaultEndTime: timeSchema.optional(),
  daysOff: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  holidays: z.array(dateKeySchema).optional(),
  timezone: z.string().min(3).max(100).optional(),
  ojtStartDate: dateKeySchema.nullable().optional(),
});
