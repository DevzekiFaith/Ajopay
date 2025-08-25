import { z } from "zod";

export const OnboardingSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(2, "Enter your full name"),
  phone: z
    .string({ required_error: "Phone is required" })
    .min(7, "Enter a valid phone number"),
  shopName: z
    .string({ required_error: "Shop/market name is required" })
    .min(2, "Enter your shop/market name"),
  bvn: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : undefined)),
  referralCode: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : undefined)),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;
