import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Backend returns camelCase keys, which match our frontend component expectations.
// So we don't need complex mapping unless keys differ.
const mapBackendProblem = (problem) => ({
    ...problem,
    // Backend : Frontend
    // createdAt : createdAt (Matches)
    // acceptanceRate : acceptanceRate (Matches)
    // inputFormat : inputFormat (Matches)
});

export const getProblems = async () => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/problems`);
        if (!response.ok) throw new Error('Failed to fetch problems from backend');

        const data = await response.json();
        return { data: data };
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
};

export const getProblem = async (id) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/problems/${id}`);
        if (!response.ok) throw new Error('Failed to fetch problem from backend');

        const data = await response.json();
        return { data: data };
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
};

export const createProblem = async (problemData) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error('No auth token');

    const response = await fetch(`${BACKEND_URL}/api/problems`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(problemData)
    });

    if (!response.ok) throw new Error('Failed to create problem');
    const data = await response.json();
    return { data };
};

export const updateProblem = async (id, problemData) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error('No auth token');

    const response = await fetch(`${BACKEND_URL}/api/problems/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(problemData)
    });

    if (!response.ok) throw new Error('Failed to update problem');
    const data = await response.json();
    return { data };
};

export const deleteProblem = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error('No auth token');

    const response = await fetch(`${BACKEND_URL}/api/problems/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Failed to delete problem');
};
