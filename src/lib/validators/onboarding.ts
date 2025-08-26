import { z } from "zod";

export const OnboardingSchema = z.object({
  fullName: z
    .string({ message: "Full name is required" })
    .trim()
    .min(2, "Enter your full name"),
  phone: z
    .string({ message: "Phone is required" })
    .trim()
    .min(7, "Enter a valid phone number"),
  shopName: z
    .string({ message: "Shop/market name is required" })
    .trim()
    .min(2, "Enter your shop/market name"),
  bvn: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  referralCode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;
