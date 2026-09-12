import type {
  MemberRedemption,
  MemberSummaryData,
  SavingsRecord,
} from "./member";

export type MemberSummaryResponse = { data: MemberSummaryData };
export type MemberSavingsResponse = {
  data: { records: SavingsRecord[]; potentialSavings?: number | null };
};
export type RecordFinancialsRequest = {
  total_bill_amount: number;
  discount_amount: number;
};
export type MemberRedemptionsResponse = { data: MemberRedemption[] };
