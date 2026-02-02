import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import * as userService from '../services/userService';
import { getUserSubmissions } from '../services/submissionService';
import { getProblems } from '../services/problemService';
import { logout } from '../store/authSlice';
import ActivityHeatmapCard from '../components/profile/ActivityHeatmapCard';
import RecentActivityCard from '../components/profile/RecentActivityCard';
import ProgressStatsCard from '../components/profile/ProgressStatsCard';
import DifficultyBreakdownCard from '../components/profile/DifficultyBreakdownCard';

const Profile = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [problems, setProblems] = useState([]);
    const [profileData, setProfileData] = useState({
        name: '',
        bio: '',
        username: '',
        avatarUrl: '',
        rating: 0,
        solvedCount: 0,
        country: '',
        organization: '',
    });
    const [editData, setEditData] = useState({ ...profileData });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchProfileData();
        fetchSubmissions();
        fetchProblemsList();
    }, [isAuthenticated, user, navigate]);

    const fetchProfileData = async () => {
        if (!user?.id) return;

        try {
            const response = await userService.getUserProfile(user.id);
            const data = response.data;
            setProfileData({
                name: data.name || data.username || user?.email?.split('@')[0] || '',
                bio: data.bio || '',
                username: data.username || user?.email?.split('@')[0] || '',
                avatarUrl: data.avatarUrl || data.avatar_url || '',
                rating: data.rating || 1200,
                solvedCount: data.problemsSolved || data.solvedCount || data.solved_count || 0,
                country: data.country || '',
                organization: data.organization || '',
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        if (!user?.id) return;
        try {
            const response = await getUserSubmissions(user.id);
            setSubmissions(response.data || []);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        }
    };

    const fetchProblemsList = async () => {
        try {
            const response = await getProblems();
            setProblems(response.data || []);
        } catch (error) {
            console.error('Failed to fetch problems:', error);
        }
    };

    const handleEdit = () => {
        setEditData({ ...profileData });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setAvatarPreview(null);
        setAvatarFile(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let avatarUrl = profileData.avatarUrl;

            if (avatarFile) {
                const fileName = `avatars/${user.id}/${Date.now()}-${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile, { upsert: true });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                    avatarUrl = urlData.publicUrl;
                }
            }

            await userService.updateProfile({
                username: editData.username,
                name: editData.name,
                bio: editData.bio,
                country: editData.country,
                organization: editData.organization,
                avatar_url: avatarUrl,
            });

            setProfileData({ ...editData, avatarUrl });
            setIsEditing(false);
            setAvatarPreview(null);
            setAvatarFile(null);
        } catch (error) {
            alert(error.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(logout());
        navigate('/login');
    };

    // Calculate rank based on rating
    const getRank = (rating) => {
        if (rating >= 2400) return { name: 'GRANDMASTER', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        if (rating >= 2000) return { name: 'MASTER', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
        if (rating >= 1600) return { name: 'EXPERT', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
        if (rating >= 1200) return { name: 'SPECIALIST', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
        if (rating >= 800) return { name: 'PUPIL', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' };
        return { name: 'NEWBIE', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
    };

    const rank = getRank(profileData.rating);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const avatarDisplay = avatarPreview || profileData.avatarUrl;

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header Card */}
                <div className="relative group bg-[#12121a]/80 backdrop-blur-xl rounded-2xl border border-white/5 p-8 mb-8 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-brand-blue/5">
                    {/* Gradient overlay at top */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brand-blue/10 via-brand-blue/5 to-transparent opacity-60" />

                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div
                                className={`relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#0a0a0f] shadow-2xl ${isEditing ? 'cursor-pointer hover:border-brand-blue/50' : ''} transition-colors`}
                                onClick={handleAvatarClick}
                            >
                                {avatarDisplay ? (
                                    <img src={avatarDisplay} alt="Avatar" className="w-full h-full object-cover transform group-hover/avatar:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#1e1e24] to-[#12121a] flex items-center justify-center text-4xl font-bold text-white/20">
                                        {(profileData.name || profileData.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                        <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {/* Offline/Online Badge (Static for now) */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0a0a0f] rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left pt-2">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="text-3xl font-bold bg-transparent border-b border-white/20 text-white focus:outline-none focus:border-brand-blue text-center md:text-left"
                                        placeholder="Your name"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold text-white tracking-tight">
                                        {profileData.name || profileData.username}
                                    </h1>
                                )}
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider ${rank.color} ${rank.bg} border ${rank.border} shadow-[0_0_15px_-3px_currentColor]`}>
                                    {rank.name}
                                </span>
                            </div>

                            <p className="text-dark-text-secondary text-sm mb-4 font-mono opacity-80">@{profileData.username}</p>

                            {isEditing ? (
                                <textarea
                                    value={editData.bio}
                                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                    className="w-full bg-dark-bg-tertiary/50 border border-white/10 rounded-lg px-4 py-3 text-dark-text-secondary text-sm focus:outline-none focus:border-brand-blue resize-none transition-colors"
                                    placeholder="Write a short bio..."
                                    rows={2}
                                />
                            ) : (
                                <p className="text-dark-text-secondary text-sm max-w-xl leading-relaxed">
                                    {profileData.bio || <span className="italic text-dark-text-tertiary">No bio added yet.</span>}
                                </p>
                            )}

                            {/* Meta Info */}
                            {!isEditing && (profileData.country || profileData.organization) && (
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-xs text-dark-text-tertiary">
                                    {profileData.country && (
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {profileData.country}
                                        </div>
                                    )}
                                    {profileData.organization && (
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {profileData.organization}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex flex-col items-center md:items-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5 md:pl-8 md:border-l">
                            <div className="flex items-center gap-8">
                                <div className="text-center group/stat">
                                    <div className="text-3xl font-bold text-white tracking-tight group-hover/stat:text-brand-blue transition-colors duration-300">{profileData.rating}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-dark-text-tertiary mt-1">Rating</div>
                                </div>
                                <div className="w-[1px] h-10 bg-white/5" />
                                <div className="text-center group/stat">
                                    <div className="text-3xl font-bold text-white tracking-tight group-hover/stat:text-green-500 transition-colors duration-300">{profileData.solvedCount}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-dark-text-tertiary mt-1">Solved</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            className="px-6 py-2.5 rounded-xl bg-dark-bg-tertiary border border-white/10 text-white text-sm font-medium hover:bg-dark-bg-elevated transition-all hover:scale-105 active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-medium hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-brand-blue/20"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="px-6 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm font-medium hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
                                        >
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all hover:scale-105 active:scale-95"
                                            title="Logout"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Fields when editing */}
                    {isEditing && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="space-y-2">
                                <label className="block text-xs uppercase tracking-wide text-dark-text-tertiary font-semibold">Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-tertiary">@</span>
                                    <input
                                        type="text"
                                        value={editData.username}
                                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                        className="w-full pl-7 pr-3 py-2.5 bg-dark-bg-tertiary/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue focus:bg-dark-bg-tertiary/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs uppercase tracking-wide text-dark-text-tertiary font-semibold">Country</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={editData.country}
                                        onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-dark-bg-tertiary/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue focus:bg-dark-bg-tertiary/50 transition-all"
                                        placeholder="e.g., India"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs uppercase tracking-wide text-dark-text-tertiary font-semibold">Organization</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={editData.organization}
                                        onChange={(e) => setEditData({ ...editData, organization: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-dark-bg-tertiary/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue focus:bg-dark-bg-tertiary/50 transition-all"
                                        placeholder="e.g., University"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <ProgressStatsCard submissions={submissions} />
                    <DifficultyBreakdownCard submissions={submissions} problems={problems} />
                </div>

                {/* Activity & Recent */}
                <div className="grid grid-cols-1 gap-6">
                    <ActivityHeatmapCard submissions={submissions} />
                    <RecentActivityCard submissions={submissions} />
                </div>
            </div>
        </div>
    );
};

export default Profile;
