import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateProfile, uploadProfilePicture } from '../services/userService';
import { getUserSubmissions } from '../services/submissionService';
import { logout } from '../store/authSlice';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { theme, toggleTheme } = useTheme();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [submissions, setSubmissions] = useState([]);
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

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) {
                console.log('Profile: Waiting for user data...');
                return;
            }

            try {
                setLoading(true);
                console.log('Profile: Fetching data for user:', user.id);

                const [profileRes, submissionsRes] = await Promise.all([
                    getUserProfile(user.id),
                    getUserSubmissions(user.id)
                ]);

                console.log('Profile: Data loaded successfully');
                setProfile(profileRes.data);
                setSubmissions(submissionsRes.data);

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

        fetchData();
    }, [user]);

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

            // Show success message
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
            // Attempt Supabase signout but don't wait for it to prevent hanging
            // if the client is unresponsive.
            supabase.auth.signOut().then(({ error }) => {
                if (error) console.error('handleLogout: Supabase signOut error:', error);
                else console.log('handleLogout: Supabase signOut successful');
            }).catch(err => {
                console.error('handleLogout: Exception during Supabase signOut:', err);
            });

        } catch (error) {
            console.error('handleLogout: Exception triggering signOut:', error);
        }

        // Always clear local state immediately
        try {
            console.log('handleLogout: Clearing Redux state...');
            dispatch(logout());

            console.log('handleLogout: Clearing additional localStorage items...');
            // Clear any remaining auth-related items
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
            // Force navigation even if cleanup fails
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
                <div className="text-brand-orange text-xl">Loading profile...</div>
            </div>
        );
    }

    const displayName = profile?.name || profile?.username || user?.username || 'User';
    const avatarSrc = previewImage || profile?.avatarUrl;

    return (
        <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-end mb-6">
                    <button onClick={toggleTheme} className="p-3 rounded-lg transition-all duration-200 dark:bg-dark-bg-secondary dark:hover:bg-dark-bg-tertiary bg-light-bg-secondary hover:bg-light-bg-tertiary border dark:border-dark-border-primary border-light-border-primary" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                        )}
                    </button>
                </div>

                <div className="panel p-8 mb-8">
                    <div className="flex items-start gap-8">
                        <div className="flex-shrink-0">
                            <div className="relative">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt={displayName} className="w-32 h-32 rounded-full object-cover border-4 border-brand-orange/30" />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-brand-orange flex items-center justify-center border-4 border-brand-orange/30">
                                        <span className="text-4xl font-bold text-white">{getInitials(displayName)}</span>
                                    </div>
                                )}
                                {isEditing && (
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-brand-orange hover:bg-brand-orange/80 text-white rounded-full p-2 transition-colors" disabled={isUploading}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            </div>
                            {isUploading && <p className="text-xs text-brand-orange mt-2 text-center">Uploading...</p>}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold dark:text-dark-text-primary text-light-text-primary mb-2">{displayName}</h1>
                                    <p className="dark:text-dark-text-secondary text-light-text-secondary">@{profile?.username || user?.username || 'user'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleEditToggle} className="btn-secondary" disabled={isSaving}>{isEditing ? 'Cancel' : 'Edit Profile'}</button>
                                    {isEditing && <button onClick={handleSave} className="btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>}
                                </div>
                            </div>

                            {/* Save Message */}
                            {saveMessage.text && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${saveMessage.type === 'success'
                                    ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                                    : 'bg-red-500/10 border border-red-500/50 text-red-400'
                                    }`}>
                                    {saveMessage.text}
                                </div>
                            )}

                            <div className="flex gap-6 mb-4">
                                <div>
                                    <div className="text-2xl font-bold text-brand-orange">{profile?.rating || user?.rating || 1200}</div>
                                    <div className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">Rating</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold dark:text-dark-text-primary text-light-text-primary">{profile?.problemsSolved || user?.problemsSolved || 0}</div>
                                    <div className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">Problems Solved</div>
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    <div><label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Name</label><input type="text" name="name" value={editForm.name} onChange={handleInputChange} className="input w-full" placeholder="Your name" /></div>
                                    <div><label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Bio</label><textarea name="bio" value={editForm.bio} onChange={handleInputChange} className="input w-full" rows="3" placeholder="Tell us about yourself" /></div>
                                    <div><label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Country</label><input type="text" name="country" value={editForm.country} onChange={handleInputChange} className="input w-full" placeholder="Your country" /></div>
                                    <div><label className="block text-sm font-medium dark:text-dark-text-secondary text-light-text-secondary mb-1">Organization</label><input type="text" name="organization" value={editForm.organization} onChange={handleInputChange} className="input w-full" placeholder="Your organization" /></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {profile?.bio && <p className="dark:text-dark-text-secondary text-light-text-secondary">{profile.bio}</p>}
                                    {profile?.country && <p className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">📍 {profile.country}</p>}
                                    {profile?.organization && <p className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">🏢 {profile.organization}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="panel p-8">
                    <h2 className="text-2xl font-bold dark:text-dark-text-primary text-light-text-primary mb-6">Recent Submissions</h2>
                    {submissions && submissions.length > 0 ? (
                        <div className="space-y-4">
                            {submissions.slice(0, 10).map((submission) => (
                                <div key={submission.id} className="card p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium dark:text-dark-text-primary text-light-text-primary">{submission.problemTitle || `Problem #${submission.problemId}`}</h3>
                                        <p className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">{new Date(submission.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${submission.status === 'Accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{submission.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="dark:text-dark-text-tertiary text-light-text-tertiary text-center py-8">No submissions yet</p>
                    )}
                </div>

                <div className="mt-8 flex justify-center">
                    <button onClick={handleLogout} className="px-6 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors">Logout</button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
