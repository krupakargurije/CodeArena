import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    isLoading: true, // Start in loading state until Supabase confirms
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        loginSuccess: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAdmin = action.payload.isAdmin || false;
            state.isLoading = false;
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('isAdmin', action.payload.isAdmin || false);
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.isAdmin = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAdmin');
            // Also clear Supabase auth token
            localStorage.removeItem('supabase.auth.token');
        },
        loadUser: (state) => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            if (token && user) {
                state.token = token;
                state.user = JSON.parse(user);
                state.isAuthenticated = true;
                state.isAdmin = isAdmin;
            }
        },
        setAdminStatus: (state, action) => {
            state.isAdmin = action.payload;
            localStorage.setItem('isAdmin', action.payload);
        },
    },
});

export const { loginSuccess, logout, loadUser, setAdminStatus, setLoading } = authSlice.actions;
export default authSlice.reducer;
