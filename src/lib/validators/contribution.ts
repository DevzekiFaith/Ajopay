import { z } from "zod";

export const ContributionSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .int("Amount must be a whole number")
    .min(200, "Minimum is ₦200"),
  proofUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export type ContributionInput = z.infer<typeof ContributionSchema>;
