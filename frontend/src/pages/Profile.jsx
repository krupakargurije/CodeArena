import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserProfile, updateProfile, uploadProfilePicture } from '../services/userService';
import { getUserSubmissions } from '../services/submissionService';
import { getProblems } from '../services/problemService';
import { logout } from '../store/authSlice';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';
import {
    ProgressStatsCard,
    DifficultyBreakdownCard,
    ActivityHeatmapCard,
    RecentActivityCard
} from '../components/profile';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const { theme, toggleTheme } = useTheme();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    const [editForm, setEditForm] = useState({
        name: '',
        bio: '',
        username: '',
        country: '',
        organization: ''
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(0);

    // Fetch data function with debounce
    const fetchData = async (force = false) => {
        if (!user?.id) {
            console.log('Profile: Waiting for user data...');
            return;
        }

        // Debounce fetches - don't refetch within 2 seconds
        const now = Date.now();
        if (!force && now - lastFetchTime < 2000) {
            console.log('Profile: Skipping fetch (debounce)');
            return;
        }
        setLastFetchTime(now);

        try {
            setLoading(true);
            console.log('Profile: Fetching data for user:', user.id);

            const [profileRes, submissionsRes, problemsRes] = await Promise.all([
                getUserProfile(user.id),
                getUserSubmissions(user.id),
                getProblems()
            ]);

            console.log('Profile: Data loaded successfully');
            console.log('Profile: Submissions received:', submissionsRes.data?.length);
            console.log('Profile: Problems received:', problemsRes.data?.length);

            if (submissionsRes.data?.length > 0) {
                console.log('Profile: Sample submission:', submissionsRes.data[0]);
            }

            setProfile(profileRes.data);
            setSubmissions(submissionsRes.data || []);
            setProblems(problemsRes.data || []);

            setEditForm({
                name: profileRes.data.name || '',
                bio: profileRes.data.bio || '',
                username: profileRes.data.username || '',
                country: profileRes.data.country || '',
                organization: profileRes.data.organization || ''
            });
        } catch (error) {
            console.error('Profile: Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch when component mounts or user changes
    useEffect(() => {
        if (user?.id) {
            console.log('Profile: User available, fetching data...');
            fetchData(true); // Force fetch on mount
        }
    }, [user?.id]);

    // Refetch when navigating back to profile
    useEffect(() => {
        if (user?.id && location.key) {
            console.log('Profile: Navigation detected, refetching...');
            fetchData();
        }
    }, [location.key]);

    const handleEditToggle = () => {
        if (isEditing) {
            setEditForm({
                name: profile.name || '',
                bio: profile.bio || '',
                username: profile.username || '',
                country: profile.country || '',
                organization: profile.organization || ''
            });
            setPreviewImage(null);
            setSelectedFile(null);
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage({ type: '', text: '' });

        try {
            console.log('handleSave: Starting profile save...');

            let avatarUrl = profile?.avatarUrl || null;
            if (selectedFile) {
                setIsUploading(true);
                console.log('handleSave: Uploading profile picture...');
                const uploadResult = await uploadProfilePicture(selectedFile);
                avatarUrl = uploadResult.data.url;
                setIsUploading(false);
                console.log('handleSave: Profile picture uploaded successfully');
            }

            const updateData = {
                name: editForm.name || null,
                bio: editForm.bio || null,
                username: editForm.username,
                country: editForm.country || null,
                organization: editForm.organization || null,
                avatar_url: avatarUrl
            };

            console.log('handleSave: Updating profile with data:', updateData);
            const result = await updateProfile(updateData);

            console.log('handleSave: Profile updated successfully:', result.data);
            setProfile(result.data);
            setIsEditing(false);
            setPreviewImage(null);
            setSelectedFile(null);

            setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            console.error('handleSave: Failed to update profile:', error);
            setSaveMessage({
                type: 'error',
                text: error.message || 'Failed to update profile. Please try again.'
            });
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    };

    const handleLogout = async () => {
        console.log('handleLogout: Starting logout process...');

        try {
            supabase.auth.signOut().then(({ error }) => {
                if (error) console.error('handleLogout: Supabase signOut error:', error);
                else console.log('handleLogout: Supabase signOut successful');
            }).catch(err => {
                console.error('handleLogout: Exception during Supabase signOut:', err);
            });

        } catch (error) {
            console.error('handleLogout: Exception triggering signOut:', error);
        }

        try {
            console.log('handleLogout: Clearing Redux state...');
            dispatch(logout());

            console.log('handleLogout: Clearing additional localStorage items...');
            Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase') || key.includes('auth') || key === 'token' || key === 'user') {
                    localStorage.removeItem(key);
                }
            });

            console.log('handleLogout: Navigating to login page...');
            navigate('/login', { replace: true });

            console.log('handleLogout: Logout complete');
        } catch (error) {
            console.error('handleLogout: Error during local cleanup:', error);
            window.location.href = '/login';
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
                    <div className="text-brand-orange text-xl">Loading profile...</div>
                </div>
            </div>
        );
    }

    const displayName = profile?.name || profile?.username || user?.username || 'User';
    const avatarSrc = previewImage || profile?.avatarUrl;

    return (
        <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary">
            {/* Background Gradient Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Theme Toggle */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-xl transition-all duration-200 glass hover:scale-105 active:scale-95"
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Profile Header Card */}
                <div className="glass rounded-2xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-start gap-8">
                        {/* Avatar Section */}
                        <div className="flex-shrink-0">
                            <div className="relative group">
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt={displayName}
                                        className="w-32 h-32 rounded-2xl object-cover border-4 border-brand-orange/30 shadow-lg shadow-brand-orange/20 transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center border-4 border-brand-orange/30 shadow-lg shadow-brand-orange/20 transition-transform duration-300 group-hover:scale-105">
                                        <span className="text-4xl font-bold text-white">{getInitials(displayName)}</span>
                                    </div>
                                )}
                                {isEditing && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        disabled={isUploading}
                                    >
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            </div>
                            {isUploading && <p className="text-xs text-brand-orange mt-2 text-center">Uploading...</p>}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold dark:text-dark-text-primary text-light-text-primary mb-1">
                                        {displayName}
                                    </h1>
                                    <p className="dark:text-dark-text-secondary text-light-text-secondary flex items-center gap-2">
                                        <span className="text-brand-orange">@</span>
                                        {profile?.username || user?.username || 'user'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEditToggle}
                                        className="btn-secondary flex items-center gap-2"
                                        disabled={isSaving}
                                    >
                                        {isEditing ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Cancel
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </>
                                        )}
                                    </button>
                                    {isEditing && (
                                        <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
                                            {isSaving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Save
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Save Message */}
                            {saveMessage.text && (
                                <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${saveMessage.type === 'success'
                                    ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                                    : 'bg-red-500/10 border border-red-500/50 text-red-400'
                                    }`}>
                                    {saveMessage.type === 'success' ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    {saveMessage.text}
                                </div>
                            )}

                            {/* Stats Pills */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange/20 to-orange-500/20 border border-brand-orange/30">
                                    <span className="text-lg font-bold text-brand-orange">{profile?.rating || user?.rating || 1200}</span>
                                    <span className="text-sm dark:text-dark-text-secondary text-light-text-secondary">Rating</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                                    <span className="text-lg font-bold text-green-400">{profile?.problemsSolved || user?.problemsSolved || 0}</span>
                                    <span className="text-sm dark:text-dark-text-secondary text-light-text-secondary">Solved</span>
                                </div>
                            </div>

                            {/* Edit Form or Profile Info */}
                            {isEditing ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Name</label>
                                        <input type="text" name="name" value={editForm.name} onChange={handleInputChange} className="input w-full" placeholder="Your name" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Country</label>
                                        <input type="text" name="country" value={editForm.country} onChange={handleInputChange} className="input w-full" placeholder="Your country" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Organization</label>
                                        <input type="text" name="organization" value={editForm.organization} onChange={handleInputChange} className="input w-full" placeholder="Your organization" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Bio</label>
                                        <textarea name="bio" value={editForm.bio} onChange={handleInputChange} className="input w-full" rows="3" placeholder="Tell us about yourself" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {profile?.bio && (
                                        <p className="dark:text-dark-text-secondary text-light-text-secondary">{profile.bio}</p>
                                    )}
                                    <div className="flex flex-wrap gap-4">
                                        {profile?.country && (
                                            <p className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary flex items-center gap-1">
                                                <span>📍</span> {profile.country}
                                            </p>
                                        )}
                                        {profile?.organization && (
                                            <p className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary flex items-center gap-1">
                                                <span>🏢</span> {profile.organization}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <ProgressStatsCard
                        submissions={submissions}
                        problems={problems}
                    />
                    <DifficultyBreakdownCard submissions={submissions} problems={problems} />
                </div>

                {/* Activity Heatmap */}
                <div className="mb-8">
                    <ActivityHeatmapCard submissions={submissions} />
                </div>

                {/* Recent Submissions */}
                <div className="mb-8">
                    <RecentActivityCard submissions={submissions} />
                </div>

                {/* Logout Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="px-6 py-3 rounded-xl border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
