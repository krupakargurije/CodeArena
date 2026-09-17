// Spring backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Helper to get current user info from localStorage
const getCurrentUser = () => {
    const authData = localStorage.getItem('supabase.auth.token');
    if (!authData) return null;

    try {
        const parsed = JSON.parse(authData);
        return {
            id: parsed.user?.id,
            username: parsed.user?.user_metadata?.username || parsed.user?.email?.split('@')[0] || 'User'
        };
    } catch (e) {
        console.error('Could not parse auth data');
        return null;
    }
};

// Get all discussions
export const getAllDiscussions = async () => {
    console.log('getAllDiscussions: Called');

    try {
        const response = await fetch(`${API_BASE_URL}/api/discussions`);

        if (response.ok) {
            const discussions = await response.json();
            console.log('getAllDiscussions: Success', discussions);
            return { data: discussions };
        } else {
            const errorText = await response.text();
            console.error('getAllDiscussions: Failed:', response.status, errorText);
            throw new Error('Failed to fetch discussions');
        }
    } catch (e) {
        console.error('getAllDiscussions error:', e);
        throw e;
    }
};

// Get single discussion by ID (includes replies)
export const getDiscussionById = async (id) => {
    console.log('getDiscussionById: Called for id:', id);

    try {
        const response = await fetch(`${API_BASE_URL}/api/discussions/${id}`);

        if (response.ok) {
            const discussion = await response.json();
            console.log('getDiscussionById: Success', discussion);
            return { data: discussion };
        } else {
            const errorText = await response.text();
            console.error('getDiscussionById: Failed:', response.status, errorText);
            throw new Error('Discussion not found');
        }
    } catch (e) {
        console.error('getDiscussionById error:', e);
        throw e;
    }
};

// Create a new discussion
export const createDiscussion = async (discussionData) => {
    console.log('createDiscussion: Starting...');

    const user = getCurrentUser();
    if (!user?.id) {
        console.error('createDiscussion: No user logged in');
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/discussions?userId=${user.id}&username=${encodeURIComponent(user.username)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: discussionData.title,
                content: discussionData.content,
                tags: discussionData.tags || []
            })
        });

        if (response.ok) {
            const discussion = await response.json();
            console.log('createDiscussion: Success', discussion);
            return { data: discussion };
        } else {
            const errorText = await response.text();
            console.error('createDiscussion: Failed:', response.status, errorText);
            throw new Error('Failed to create discussion: ' + errorText);
        }
    } catch (e) {
        console.error('createDiscussion error:', e);
        throw e;
    }
};

// Delete a discussion (author only)
export const deleteDiscussion = async (id) => {
    console.log('deleteDiscussion: Called for id:', id);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/discussions/${id}?userId=${user.id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('deleteDiscussion: Success');
            return { data: { success: true } };
        } else {
            const errorText = await response.text();
            console.error('deleteDiscussion: Failed:', response.status, errorText);
            throw new Error(errorText || 'Failed to delete discussion');
        }
    } catch (e) {
        console.error('deleteDiscussion error:', e);
        throw e;
    }
};

// Add a reply to a discussion
export const addReply = async (discussionId, replyData) => {
    console.log('addReply: Called for discussion:', discussionId);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/discussions/${discussionId}/replies?userId=${user.id}&username=${encodeURIComponent(user.username)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: replyData.content
            })
        });

        if (response.ok) {
            const reply = await response.json();
            console.log('addReply: Success', reply);
            return { data: reply };
        } else {
            const errorText = await response.text();
            console.error('addReply: Failed:', response.status, errorText);
            throw new Error('Failed to add reply: ' + errorText);
        }
    } catch (e) {
        console.error('addReply error:', e);
        throw e;
    }
};

// Delete a reply (author only)
export const deleteReply = async (discussionId, replyId) => {
    console.log('deleteReply: Called for reply:', replyId);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/discussions/${discussionId}/replies/${replyId}?userId=${user.id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('deleteReply: Success');
            return { data: { success: true } };
        } else {
            const errorText = await response.text();
            console.error('deleteReply: Failed:', response.status, errorText);
            throw new Error(errorText || 'Failed to delete reply');
        }
    } catch (e) {
        console.error('deleteReply error:', e);
        throw e;
    }
};
