import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import authReducer from './slices/authSlice';
import contentReducer from './slices/contentSlice';

// Safe storage wrapper: prevents "window is not defined" during SSR on web
const safeStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    return AsyncStorage.removeItem(key);
  },
};

const authPersistConfig = {
  key: 'auth',
  storage: safeStorage,
  whitelist: ['user', 'token', 'isAuthenticated'],
};

const contentPersistConfig = {
  key: 'content',
  storage: safeStorage,
  whitelist: ['library', 'wishlist', 'progress'],
};

const appReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  content: persistReducer(contentPersistConfig, contentReducer),
});

// Root reducer: wipe entire state on RESET_STORE
const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_STORE') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export const resetStore = () => ({ type: 'RESET_STORE' as const });

export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = typeof store.dispatch;
