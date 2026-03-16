import api from './api';
import { CoinTransaction } from '../types';

export const walletService = {
  // userId param kept for backward compatibility — backend uses JWT auth token
  async getBalance(_userId: string) {
    const response = await api.get('/reader/wallet');
    const wallet = response.data as any;
    return { coin_balance: wallet?.availableCoins ?? 0 };
  },

  async addCoins(_userId: string, coins: number) {
    const response = await api.post('/reader/wallet/add-coins', { coins });
    return response.data;
  },

  async getTransactions(_userId: string, page = 1, limit = 20) {
    const response = await api.get('/reader/wallet/transactions', { params: { page, limit } });
    const result = response.data as any;
    const transactions = (result?.transactions || result || []) as CoinTransaction[];
    const pagination = result?.pagination || null;
    return { transactions, pagination };
  },

  async getCoinPacks() {
    const response = await api.get('/reader/wallet/packs');
    return (response.data as any) || [];
  },

  async unlockContent(contentType: string, contentId: string, coinCost: number) {
    const response = await api.post('/reader/wallet/unlock', {
      contentType,
      contentId,
      coinCost,
    });
    return response.data;
  },
};
