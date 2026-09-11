export type SavingsCategory =
  "Gastronomia" | "Experiências" | "Alojamento" | "Lazer";

export type SavingsRecord = {
  id: string;
  businessName: string;
  businessSlug: string;
  category: SavingsCategory;
  redeemedAt: string;
  totalBillAmount: number;
  discountAmount: number;
};

export type MemberSummaryData = {
  subscriptionStatus: "active" | "inactive" | "pending";
  validUntil?: string | null;
  usedBenefits: number;
  availableBenefits: number;
  totalBenefits: number;
  potentialSavings?: number | null;
};
