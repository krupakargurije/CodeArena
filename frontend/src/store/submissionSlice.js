import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { submitCode, runCode } from '../services/submissionService';

export const submitCodeThunk = createAsyncThunk(
    'submissions/submitCode',
    async (submissionData) => {
        const response = await submitCode(submissionData);
        return response.data;
    }
);

export const runCodeThunk = createAsyncThunk(
    'submissions/runCode',
    async (codeData) => {
        const response = await runCode(codeData);
        return response.data;
    }
);

const submissionSlice = createSlice({
    name: 'submissions',
    initialState: {
        current: null,
        history: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrent: (state) => {
            state.current = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Submit code (saves to database)
            .addCase(submitCodeThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitCodeThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.current = action.payload;
                state.history.unshift(action.payload);
            })
            .addCase(submitCodeThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Run code (doesn't save to database)
            .addCase(runCodeThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(runCodeThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.current = action.payload;
            })
            .addCase(runCodeThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export const { clearCurrent } = submissionSlice.actions;
export default submissionSlice.reducer;
