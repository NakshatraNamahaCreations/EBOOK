import api from './api';

export const paymentService = {
  async createBookOrder(bookId: string, purchaseType: 'ebook' | 'audiobook' | 'combo' = 'ebook') {
    const res = await api.post(`/reader/books/${bookId}/purchase`, { purchaseType });
    return res.data as any;
  },
  async verifyPayment(
    bookId: string,
    data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }
  ) {
    const res = await api.post(`/reader/books/${bookId}/verify-payment`, data);
    return res.data as any;
  },
  async getPurchaseStatus(bookId: string, purchaseType?: 'ebook' | 'audiobook' | 'combo') {
    const params = purchaseType ? { purchaseType } : {};
    const res = await api.get(`/reader/books/${bookId}/purchase-status`, { params });
    return res.data as any;
  },
  async getMyPurchases() {
    const res = await api.get('/reader/purchases');
    return res.data as any[];
  },
};
