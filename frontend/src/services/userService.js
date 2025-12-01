import { supabase } from './supabaseClient';

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        console.error('No active session found');
        throw new Error('No user logged in');
    }

    console.log('Updating profile for user:', session.user.id);
    console.log('Profile data:', profileData);

    const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id)
        .select()
        .single();

    if (error) {
        console.error('Supabase update error:', error);
        throw error;
    }

    console.log('Profile updated successfully:', data);
    return { data: mapProfile(data) };
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
