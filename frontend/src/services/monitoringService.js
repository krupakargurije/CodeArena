import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const fetchWithRetry = async (url, options = {}, retryCount = 0) => {
    try {
        const response = await fetch(url, options);
        if ((response.status === 502 || response.status === 503) && retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return fetchWithRetry(url, options, retryCount + 1);
        }
        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES && (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
    }
};

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
    };
};

export const getSystemOverview = async () => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/overview`, { headers });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch system overview');
    return await response.json();
};

export const getServicesHealth = async () => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/services`, { headers });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch services health');
    return await response.json();
};

export const getJudge0Operations = async () => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/judge0`, { headers });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch Judge0 metrics');
    return await response.json();
};

export const getSubmissionAnalytics = async (range = '24h') => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/submissions?range=${range}`, { headers });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch submission analytics');
    return await response.json();
};

export const getApiPerformance = async () => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/performance`, { headers });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch API performance metrics');
    return await response.json();
};

export const getRealtimeActivity = async () => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/activity`, { headers });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch real-time activity');
    return await response.json();
};

export const getIncidents = async (status = 'ACTIVE', page = 0, size = 20) => {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams({ status, page, size });
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/incidents?${query.toString()}`, { headers });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch incidents');
    return await response.json();
};

export const acknowledgeIncident = async (id, note = '') => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/incidents/${id}/acknowledge`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ note })
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to acknowledge incident');
    return await response.json();
};

export const resolveIncident = async (id, resolutionNote = '') => {
    const headers = await getAuthHeaders();
    const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/monitoring/incidents/${id}/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ resolutionNote })
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to resolve incident');
    return await response.json();
};
