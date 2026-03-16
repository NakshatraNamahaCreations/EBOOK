import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contentReducer from './slices/contentSlice';

const appReducer = combineReducers({
  auth: authReducer,
  content: contentReducer,
});

// Root reducer: wipe entire state on RESET_STORE
const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_STORE') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({ reducer: rootReducer });

export const resetStore = () => ({ type: 'RESET_STORE' as const });

export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = typeof store.dispatch;
