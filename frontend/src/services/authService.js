import { supabase } from './supabaseClient';

// Map Supabase user to App user structure
const mapUser = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email.split('@')[0],
        rating: user.user_metadata?.rating || 1200,
        problemsSolved: user.user_metadata?.problemsSolved || 0,
        roles: ['ROLE_USER'],
    };
};

export const signup = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
            data: {
                username: userData.username,
                rating: 1200,
                problemsSolved: 0,
            },
        },
    });

    if (error) throw error;
    return {
        data: {
            token: data.session?.access_token,
            user: mapUser(data.user),
        }
    };
};

export const login = async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username, // Assuming username field contains email for Supabase
        password: credentials.password,
    });

    if (error) throw error;
    return {
        data: {
            token: data.session?.access_token,
            user: mapUser(data.user),
        }
    };
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return { data: mapUser(user) };
};

export const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });

    if (error) throw error;
    return { data };
};
