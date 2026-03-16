import api from './api';
import { Content, ContentType, Banner, Category, Progress } from '../types';

export const contentService = {
  async getContent(params?: {
    content_type?: ContentType;
    is_trending?: boolean;
    is_featured?: boolean;
    is_new_release?: boolean;
    category_id?: string;
    limit?: number;
  }) {
    const response = await api.get<Content[]>('/reader/content', { params });
    return (response.data as any) || [];
  },

  async getContentById(id: string) {
    const response = await api.get<Content>(`/reader/content/${id}`);
    return response.data;
  },

  async getAudiobookById(id: string) {
    const response = await api.get<Content>(`/reader/audiobook/${id}`);
    return response.data;
  },

  async getBanners() {
    const response = await api.get<Banner[]>('/reader/banners');
    return (response.data as any) || [];
  },

  async getCategories() {
    const response = await api.get<Category[]>('/reader/categories');
    return (response.data as any) || [];
  },

  async searchContent(query: string, contentType?: ContentType) {
    const response = await api.get<Content[]>('/reader/search', {
      params: { q: query, content_type: contentType },
    });
    return (response.data as any) || [];
  },

  // userId param kept for backward compatibility — backend uses JWT auth token
  async getUserLibrary(_userId: string, page = 1, limit = 20) {
    const response = await api.get('/reader/library', { params: { page, limit } });
    const res = response.data as any;
    return { data: (res?.data || res || []) as Content[], pagination: res?.pagination || null };
  },

  async addToLibrary(_userId: string, contentId: string, contentType: ContentType) {
    const response = await api.post(`/reader/library/${contentId}`, {
      content_type: contentType,
    });
    return response.data;
  },

  async removeFromLibrary(_userId: string, contentId: string) {
    const response = await api.delete(`/reader/library/${contentId}`);
    return response.data;
  },

  async getWishlist(_userId: string, page = 1, limit = 20) {
    const response = await api.get('/reader/wishlist', { params: { page, limit } });
    const res = response.data as any;
    return { data: (res?.data || res || []) as Content[], pagination: res?.pagination || null };
  },

  async addToWishlist(_userId: string, contentId: string, contentType?: ContentType) {
    const response = await api.post(`/reader/wishlist/${contentId}`, {
      content_type: contentType || 'book',
    });
    return response.data;
  },

  async removeFromWishlist(_userId: string, contentId: string) {
    const response = await api.delete(`/reader/wishlist/${contentId}`);
    return response.data;
  },

  async getProgress(_userId: string, contentId?: string) {
    if (contentId) {
      const response = await api.get<Progress>(`/reader/progress/${contentId}`);
      return response.data;
    }
    const response = await api.get<Progress[]>('/reader/progress');
    return (response.data as any) || [];
  },

  async saveProgress(progress: Progress) {
    const response = await api.post<Progress>('/reader/progress', {
      content_id: progress.content_id,
      content_type: progress.content_type,
      current_chapter_id: progress.current_chapter_id,
      current_position: progress.current_position,
      total_progress: progress.total_progress,
      completed: progress.completed,
    });
    return response.data;
  },

  async getChapterStatus(bookId: string) {
    const response = await api.get(`/reader/books/${bookId}/chapter-status`);
    return response.data;
  },
};
