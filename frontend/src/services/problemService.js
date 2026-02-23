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

export const getTestCases = async (problemId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${BACKEND_URL}/api/problems/${problemId}/testcases`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Failed to fetch test cases');
    const data = await response.json();
    return { data };
};

export const getSampleTestCases = async (problemId) => {
    try {
        // Fetch problem to get testCasesUrl
        const problemRes = await fetch(`${BACKEND_URL}/api/problems/${problemId}`);
        if (!problemRes.ok) return { data: [] };
        const problem = await problemRes.json();

        if (!problem.testCasesUrl) {
            // Fallback to single sample fields
            if (problem.sampleInput || problem.sampleOutput) {
                return { data: [{ input: problem.sampleInput || '', expectedOutput: problem.sampleOutput || '' }] };
            }
            return { data: [] };
        }

        // Download and parse the ZIP to extract sample_ prefixed files
        const JSZip = (await import('jszip')).default;
        const response = await fetch(problem.testCasesUrl);
        if (!response.ok) return { data: [] };

        const blob = await response.blob();
        const zip = await JSZip.loadAsync(blob);

        const inputs = {};
        const outputs = {};

        for (const [filename, file] of Object.entries(zip.files)) {
            if (file.dir) continue;
            let name = filename;
            if (name.includes('/')) name = name.substring(name.lastIndexOf('/') + 1);

            // Only extract sample_ files
            if (!name.startsWith('sample_')) continue;

            const content = await file.async('string');
            const cleanName = name.replace('sample_', '');

            if (cleanName.endsWith('.in')) {
                inputs[cleanName.slice(0, -3)] = content;
            } else if (cleanName.endsWith('.out')) {
                outputs[cleanName.slice(0, -4)] = content;
            }
        }

        const cases = Object.keys(inputs)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => ({
                input: inputs[key] || '',
                expectedOutput: outputs[key] || ''
            }));

        // If no sample_ files found, fallback to single sample fields
        if (cases.length === 0 && (problem.sampleInput || problem.sampleOutput)) {
            return { data: [{ input: problem.sampleInput || '', expectedOutput: problem.sampleOutput || '' }] };
        }

        return { data: cases };
    } catch (err) {
        console.error('Failed to load sample test cases from ZIP:', err);
        return { data: [] };
    }
};

export const addTestCase = async (problemId, testCaseData) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${BACKEND_URL}/api/problems/${problemId}/testcases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testCaseData)
    });

    if (!response.ok) throw new Error('Failed to add test case');
    const data = await response.json();
    return { data };
};

export const deleteTestCase = async (problemId, testCaseId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${BACKEND_URL}/api/problems/${problemId}/testcases/${testCaseId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Failed to delete test case');
};
