import api from './api';

export interface ReferralEntry {
  _id: string;
  refereeId: { name?: string; email?: string } | null;
  referralCode: string;
  status: 'pending' | 'completed' | 'expired';
  rewardGiven: boolean;
  rewardAmount: number;
  createdAt: string;
}

export interface ReferralStats {
  total: number;
  successful: number;
  pending: number;
  totalRewards: number;
}

export interface ReferralData {
  referralCode: string;
  referrals: ReferralEntry[];
  stats: ReferralStats;
}

const getMyReferrals = async (): Promise<ReferralData> => {
  const res = await api.get('/reader/referrals');
  return res.data as ReferralData;
};

export const referralService = { getMyReferrals };
