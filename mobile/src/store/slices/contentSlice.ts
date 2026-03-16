import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contentService } from '../../services/content.service';
import { Content, Banner, Category, Progress } from '../../types';

interface ContentState {
  banners: Banner[];
  trendingBooks: Content[];
  trendingAudiobooks: Content[];
  trendingPodcasts: Content[];
  newReleases: Content[];
  featured: Content[];
  categories: Category[];
  library: Content[];
  wishlist: Content[];
  progress: Progress[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ContentState = {
  banners: [],
  trendingBooks: [],
  trendingAudiobooks: [],
  trendingPodcasts: [],
  newReleases: [],
  featured: [],
  categories: [],
  library: [],
  wishlist: [],
  progress: [],
  isLoading: false,
  error: null,
};

export const fetchHomeData = createAsyncThunk('content/fetchHomeData', async () => {
  const [banners, trendingBooks, trendingAudiobooks, trendingPodcasts, newReleases, featured, categories] =
    await Promise.all([
      contentService.getBanners(),
      contentService.getContent({ content_type: 'book' as any, is_trending: true }),
      contentService.getContent({ content_type: 'audiobook' as any, limit: 10 }),
      contentService.getContent({ content_type: 'podcast' as any, limit: 10 }),
      contentService.getContent({ is_new_release: true }),
      contentService.getContent({ is_featured: true }),
      contentService.getCategories(),
    ]);

  return {
    banners,
    trendingBooks,
    trendingAudiobooks,
    trendingPodcasts,
    newReleases,
    featured,
    categories,
  };
});

export const fetchLibrary = createAsyncThunk('content/fetchLibrary', async (userId: string) => {
  const result = await contentService.getUserLibrary(userId, 1, 100);
  return result.data;
});

export const fetchWishlist = createAsyncThunk('content/fetchWishlist', async (userId: string) => {
  const result = await contentService.getWishlist(userId, 1, 100);
  return result.data;
});

export const fetchProgress = createAsyncThunk('content/fetchProgress', async (userId: string) => {
  return await contentService.getProgress(userId) as Progress[];
});

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addToWishlist: (state, action: PayloadAction<Content>) => {
      if (!state.wishlist.find((item) => item.id === action.payload.id)) {
        state.wishlist.push(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.wishlist = state.wishlist.filter((item) => item.id !== action.payload);
    },
    addToLibrary: (state, action: PayloadAction<Content>) => {
      if (!state.library.find((item) => item.id === action.payload.id)) {
        state.library.push(action.payload);
      }
    },
    removeFromLibrary: (state, action: PayloadAction<string>) => {
      state.library = state.library.filter((item) => item.id !== action.payload);
    },
    resetContent: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHomeData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.banners = action.payload.banners;
        state.trendingBooks = action.payload.trendingBooks;
        state.trendingAudiobooks = action.payload.trendingAudiobooks;
        state.trendingPodcasts = action.payload.trendingPodcasts;
        state.newReleases = action.payload.newReleases;
        state.featured = action.payload.featured;
        state.categories = action.payload.categories;
      })
      .addCase(fetchHomeData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load content';
      })
      .addCase(fetchLibrary.fulfilled, (state, action) => {
        state.library = action.payload;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.wishlist = action.payload;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      });
  },
});

export const { clearError, addToWishlist, removeFromWishlist, addToLibrary, removeFromLibrary, resetContent } = contentSlice.actions;
export default contentSlice.reducer;
