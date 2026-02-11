import { supabase } from './supabaseClient';

// Backend URL - use environment variable for production, localhost for development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Retry configuration for handling Render free tier cold starts
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

/**
 * Fetch with automatic retry for handling backend cold starts (502 errors)
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} retryCount - Current retry count (internal use)
 * @returns {Promise<Response>} - The fetch response
 */
const fetchWithRetry = async (url, options = {}, retryCount = 0) => {
    try {
        const response = await fetch(url, options);

        // If we get a 502/503, backend might be waking up - retry
        if ((response.status === 502 || response.status === 503) && retryCount < MAX_RETRIES) {
            console.log(`Backend returned ${response.status}, retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return fetchWithRetry(url, options, retryCount + 1);
        }

        return response;
    } catch (error) {
        // Network errors (backend completely down) - retry
        if (retryCount < MAX_RETRIES && (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
            console.log(`Network error, backend may be waking up. Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
    }
};

const mapProfile = (profile) => ({
    ...profile,
    problemsSolved: profile.problems_solved,
    createdAt: profile.created_at,
    avatarUrl: profile.avatar_url,
});

export const getUserProfile = async (userId) => {
    try {
        console.log('getUserProfile: Starting with userId:', userId);

        if (!userId) {
            console.error('getUserProfile: No userId provided');
            throw new Error('No user ID provided');
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        try {
            // Try direct fetch first
            console.log('getUserProfile: Attempting direct REST fetch...');
            const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            });

            if (fetchResponse.ok) {
                const fetchData = await fetchResponse.json();
                if (fetchData && fetchData.length > 0) {
                    console.log('getUserProfile: Direct fetch SUCCESS');
                    return { data: mapProfile(fetchData[0]) };
                }
            }
        } catch (e) {
            console.warn('getUserProfile: Direct fetch error, falling back to client', e);
        }

        // Fallback to Supabase client
        console.log('getUserProfile: Using Supabase client...');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (!data) {
            console.log('getUserProfile: Profile not found, returning empty');
            // Return a default profile structure
            return {
                data: {
                    id: userId,
                    username: 'User',
                    rating: 1200,
                    problemsSolved: 0
                }
            };
        }

        if (error) {
            console.error('getUserProfile: Supabase client error:', error);
            throw error;
        }

        console.log('getUserProfile: SUCCESS');
        return { data: mapProfile(data) };
    } catch (error) {
        console.error('getUserProfile: Fatal error:', error);
        throw error;
    }
};

export const updateProfile = async (profileData) => {
    try {
        console.log('updateProfile: Starting update with data:', profileData);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('updateProfile: Session error:', sessionError);
            throw new Error('Failed to get session: ' + sessionError.message);
        }

        if (!session?.user) {
            console.error('updateProfile: No active session found');
            throw new Error('No user logged in. Please log in again.');
        }

        console.log('updateProfile: Session found for user:', session.user.id);

        // Update the profile
        const { data, error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', session.user.id)
            .select()
            .single();

        if (error) {
            console.error('updateProfile: Supabase update error:', error);

            // Provide more specific error messages
            if (error.code === 'PGRST116') {
                throw new Error('Profile not found. Please try logging out and back in.');
            } else if (error.code === '42501') {
                throw new Error('Permission denied. Please check your account permissions.');
            } else {
                throw new Error(`Failed to update profile: ${error.message}`);
            }
        }

        if (!data) {
            console.error('updateProfile: No data returned after update');
            throw new Error('Profile update returned no data');
        }

        console.log('updateProfile: Profile updated successfully:', data);
        return { data: mapProfile(data) };
    } catch (error) {
        console.error('updateProfile: Fatal error:', error);
        throw error;
    }
};

export const uploadProfilePicture = async (file) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    return { data: { path: data.path, url: publicUrl } };
};

export const deleteProfilePicture = async (avatarPath) => {
    if (!avatarPath) return;

    const { error } = await supabase.storage
        .from('avatars')
        .remove([avatarPath]);

    if (error) throw error;
};

export const getLeaderboard = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
        console.log('Attempting direct REST fetch for leaderboard...');
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&order=rating.desc&limit=50`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            console.log('Direct fetch leaderboard SUCCESS:', fetchData);
            return { data: fetchData.map(mapProfile) };
        } else {
            console.error('Direct fetch failed with status:', fetchResponse.status);
        }
    } catch (e) {
        console.warn('Direct fetch failed, falling back to client', e);
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('rating', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Supabase client error:', error);
            throw error;
        }

        console.log('Supabase client SUCCESS:', data);
        return { data: data ? data.map(mapProfile) : [] };
    } catch (error) {
        console.error('getLeaderboard failed:', error);
        throw error;
    }
};

// Admin Functions

export const checkIsAdmin = async () => {
    try {
        console.log('checkIsAdmin: Checking admin status via Supabase (Direct DB)...');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            console.warn('checkIsAdmin: No active session');
            return false;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('checkIsAdmin: Supabase error:', error);
            return false;
        }

        console.log('checkIsAdmin: Status:', data?.is_admin);
        return data?.is_admin === true;
    } catch (error) {
        console.error('checkIsAdmin: Exception:', error);
        return false;
    }
};

// Helper to get auth headers with JWT from Supabase session
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
    };
};

export const grantAdminPermission = async (userEmail) => {
    try {
        console.log('Granting admin via Spring Boot backend...');
        const headers = await getAuthHeaders();

        // 0. Lookup user in Supabase first to get ID/Username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, email')
            .eq('email', userEmail)
            .single();

        if (profileError || !profile) {
            console.error('User lookup in Supabase failed:', profileError);
            throw new Error(`User not found in Supabase: ${userEmail}`);
        }

        // 1. Backend Update (Source of Truth for API) - Send full profile for Provisioning
        const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/users/grant-admin`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                email: userEmail,
                userId: profile.id,
                username: profile.username || userEmail.split('@')[0]
            })
        });

        if (response.ok) {
            console.log('Backend grant admin SUCCESS');

            // 2. Supabase Update (Source of Truth for Frontend UI Checks)
            console.log('Syncing admin status to Supabase profiles...');
            const { error: supabaseError } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('email', userEmail);

            if (supabaseError) {
                console.error('Failed to sync admin status to Supabase:', supabaseError);
                return {
                    data: {
                        success: true,
                        warning: 'Backend updated but Supabase sync failed. Please refresh the page.'
                    }
                };
            } else {
                console.log('Supabase profile synced successfully');
                return { data: { success: true } };
            }
        } else {
            const errorText = await response.text();
            console.error('Backend grant admin failed:', response.status, errorText);
            throw new Error(errorText || 'Failed to grant admin permission');
        }
    } catch (error) {
        console.error('grantAdminPermission error:', error);
        throw error;
    }
};

export const revokeAdminPermission = async (userEmail) => {
    // Prevent revoking super admin
    if (userEmail === 'krupakargurija177@gmail.com') {
        throw new Error('Cannot revoke super admin permissions');
    }

    try {
        console.log('Revoking admin via Spring Boot backend...');
        const headers = await getAuthHeaders();

        // 1. Backend Update
        const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/users/revoke-admin`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email: userEmail })
        });

        if (response.ok) {
            const text = await response.text();
            const data = text ? JSON.parse(text) : {};
            console.log('Backend revoke admin SUCCESS');

            // 2. Supabase Update
            console.log('Syncing revoke status to Supabase profiles...');
            const { error: supabaseError } = await supabase
                .from('profiles')
                .update({ is_admin: false })
                .eq('email', userEmail);

            if (supabaseError) {
                console.error('Failed to sync revoke status to Supabase:', supabaseError);
                return {
                    data: {
                        success: true,
                        warning: 'Backend updated but Supabase sync failed. Please refresh the page.'
                    }
                };
            } else {
                console.log('Supabase profile synced successfully');
                return { data: { success: true } };
            }
        } else {
            const errorText = await response.text();
            console.error('Backend revoke admin failed:', response.status, errorText);
            throw new Error(errorText || 'Failed to revoke admin permission');
        }
    } catch (error) {
        console.error('revokeAdminPermission error:', error);
        throw error;
    }
};

export const getAllAdmins = async () => {
    // Not implemented in backend yet, using getAllUsers filter in frontend
    return getAllUsers();
};

export const getAllUsers = async () => {
    try {
        console.log('Fetching users from Spring Boot backend...');
        const headers = await getAuthHeaders();
        const response = await fetchWithRetry(`${BACKEND_URL}/api/admin/users`, {
            headers
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Backend fetch users SUCCESS:', data);
            return { data: data ? data.map(mapProfile) : [] };
        } else {
            console.error('Backend fetch failed:', response.status);
            throw new Error('Failed to fetch users from backend');
        }
    } catch (error) {
        console.error('getAllUsers error:', error);
        throw error;
    }
};

