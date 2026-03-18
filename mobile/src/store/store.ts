import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import contentReducer from './slices/contentSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'isAuthenticated'],
};

const contentPersistConfig = {
  key: 'content',
  storage: AsyncStorage,
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
