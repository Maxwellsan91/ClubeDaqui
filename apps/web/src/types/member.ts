export type SavingsCategory =
  "Gastronomia" | "Experiências" | "Alojamento" | "Lazer";

export type SavingsRecord = {
  id: string;
  redemptionId?: string;
  businessName: string;
  businessSlug: string;
  category: SavingsCategory;
  redeemedAt: string;
  totalBillAmount: number;
  discountAmount: number;
};

export type MemberRedemption = {
  id: string;
  benefitTitle: string;
  businessName: string;
  businessSlug: string;
  category: SavingsCategory;
  redeemedAt: string;
  financial: {
    totalBillAmount: number;
    discountAmount: number;
    recordedAt: string;
  } | null;
};

export type MemberSummaryData = {
  fullName?: string | null;
  role?: string;
  subscriptionStatus: "active" | "inactive" | "pending";
  validUntil?: string | null;
  usedBenefits: number;
  availableBenefits: number;
  totalBenefits: number;
  potentialSavings?: number | null;
};
