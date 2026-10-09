import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const fetchWithRetry = async (url, options = {}, retryCount = 0) => {
    try {
        const response = await fetch(url, options);
        if ((response.status === 502 || response.status === 503) && retryCount < MAX_RETRIES) {
            console.log(`Backend returned ${response.status}, retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return fetchWithRetry(url, options, retryCount + 1);
        }
        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES && (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
            console.log(`Network error, retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
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

/**
 * Fetch paginated and filtered audit logs from Spring Boot backend.
 *
 * @param {Object} params - Query parameters
 * @param {string} [params.action] - Filter by action type (e.g. GRANT_ADMIN, CREATE_PROBLEM)
 * @param {string} [params.actorId] - Filter by actor ID
 * @param {string} [params.entityType] - Filter by entity type (e.g. USER, PROBLEM)
 * @param {string} [params.entityId] - Filter by entity ID
 * @param {string} [params.from] - Filter start ISO timestamp
 * @param {string} [params.to] - Filter end ISO timestamp
 * @param {number} [params.page=0] - 0-based page number
 * @param {number} [params.size=20] - Page size
 * @returns {Promise<Object>} Spring Data Page object with content, totalElements, etc.
 */
export const getAuditLogs = async (params = {}) => {
    try {
        const headers = await getAuthHeaders();
        const query = new URLSearchParams();

        if (params.action) query.append('action', params.action);
        if (params.actorId) query.append('actorId', params.actorId);
        if (params.entityType) query.append('entityType', params.entityType);
        if (params.entityId) query.append('entityId', params.entityId);
        if (params.from) query.append('from', params.from);
        if (params.to) query.append('to', params.to);
        if (params.page !== undefined) query.append('page', params.page);
        if (params.size !== undefined) query.append('size', params.size);

        const url = `${BACKEND_URL}/api/admin/audit-logs${query.toString() ? `?${query.toString()}` : ''}`;
        const response = await fetchWithRetry(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to fetch audit logs (${response.status})`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('getAuditLogs error:', error);
        throw error;
    }
};

/**
 * Fetch a single audit log entry by its primary key ID.
 *
 * @param {number|string} id - Audit log ID
 * @returns {Promise<Object>} The audit log object
 */
export const getAuditLogById = async (id) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/audit-logs/${id}`, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to fetch audit log #${id}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`getAuditLogById error (${id}):`, error);
        throw error;
    }
};
