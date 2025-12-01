import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import problemReducer from './problemSlice';
import submissionReducer from './submissionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        problems: problemReducer,
        submissions: submissionReducer,
    },
});

export default store;
