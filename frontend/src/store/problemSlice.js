import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProblems } from '../services/problemService';

export const fetchProblems = createAsyncThunk(
    'problems/fetchProblems',
    async () => {
        const response = await getProblems();
        return response.data;
    }
);

const problemSlice = createSlice({
    name: 'problems',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProblems.pending, (state) => {
                state.loading = true;
                state.error = null; // Clear error on new request
            })
            .addCase(fetchProblems.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.error = null; // Ensure error is cleared on success
            })
            .addCase(fetchProblems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export default problemSlice.reducer;
