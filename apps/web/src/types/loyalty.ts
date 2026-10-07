// Contratos de dados dos Selos Daqui (espelham os RPC do backend).

export type LoyaltyNextReward = {
  rewardId: string;
  title: string;
  requiredStamps: number;
  stampsRemaining: number;
};

export type LoyaltyOverviewItem = {
  programId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  programName: string;
  currentStamps: number;
  nextReward: LoyaltyNextReward | null;
  availableRewardsCount: number;
};

export type LoyaltyRewardItem = {
  rewardId: string;
  title: string;
  description: string | null;
  requiredStamps: number;
  rewardType: string;
  reached: boolean;
};

export type LoyaltyAvailableReward = {
  rewardRedemptionId: string;
  rewardId: string;
  title: string;
  unlockedAt: string;
  expiresAt: string | null;
};

export type LoyaltyRedeemedReward = {
  rewardRedemptionId: string;
  title: string;
  redeemedAt: string;
};

export type LoyaltyHistoryItem = {
  visitId: string;
  visitDate: string | null;
  sourceType: string;
  stampIssued: boolean;
};

export type LoyaltyDetail = {
  programId: string;
  programName: string;
  description: string | null;
  currentStamps: number;
  nextReward: LoyaltyNextReward | null;
  rewards: LoyaltyRewardItem[];
  availableRewards: LoyaltyAvailableReward[];
  redeemedRewards: LoyaltyRedeemedReward[];
  history: LoyaltyHistoryItem[];
};

export type LoyaltyPublicSummary = {
  programId: string;
  programName: string;
  description: string | null;
  currentStamps: number | null;
  rewards: {
    title: string;
    description: string | null;
    requiredStamps: number;
  }[];
};