import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getProblem } from '../services/problemService';
import { getUserSolvedProblemIds, getUserSubmissions } from '../services/submissionService';
import { submitCodeThunk, runCodeThunk } from '../store/submissionSlice';
import CodeEditor from '../components/CodeEditor';
import DiscussPanel from '../components/DiscussPanel';

// Default code templates for each language
const CODE_TEMPLATES = {
    javascript: `// JavaScript Solution
// Write your code here
`,
    python: `# Python Solution
# Write your code here
`,
    java: `// Java Solution
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args){
        // Write your code here
    }
}
`,
    cpp: `// C++ Solution
#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your code here
    return 0;
}
`
};

const ProblemDetail = ({ problemIdProp, roomId, roomData }) => {
    const { id: paramId } = useParams();
    const id = problemIdProp || paramId;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Timer Logic
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    // WebSocket for Room Status
    useEffect(() => {
        if (!roomData || roomData.status === 'COMPLETED' || !roomId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/ws`),
            onConnect: () => {
                client.subscribe(`/topic/room/${roomId}/status`, (message) => {
                    const update = JSON.parse(message.body);
                    if (update.status === 'COMPLETED') {
                        alert(`Room Ended! Winner: ${update.winnerId}`);
                    }
                });
            },
            debug: () => { }
        });

        client.activate();
        return () => { client.deactivate(); };
    }, [roomId, roomData?.status]);

    useEffect(() => {
        if (!roomData?.startedAt) return;
        if (roomData.status === 'COMPLETED') return;

        const updateTimer = () => {
            const start = new Date(roomData.startedAt).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, now - start);
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setElapsedTime(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, [roomData]);

    const { current: submissionResult, loading: submitting } = useSelector((state) => state.submissions);
    const { user } = useSelector((state) => state.auth);
    const [isSolved, setIsSolved] = useState(false);

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(CODE_TEMPLATES['python']);
    const [leftTab, setLeftTab] = useState('description'); // 'description' | 'submissions'
    const [bottomTab, setBottomTab] = useState('testcase'); // 'testcase' | 'result'
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showDiscussPanel, setShowDiscussPanel] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [showResetModal, setShowResetModal] = useState(false);

    // Panel sizing
    const [leftPanelWidth, setLeftPanelWidth] = useState(45); // percentage
    const [bottomPanelHeight, setBottomPanelHeight] = useState(200); // px
    const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);
    const [prevBottomHeight, setPrevBottomHeight] = useState(200);
    const MIN_BOTTOM_HEIGHT = 40; // header-only height
    const MAX_BOTTOM_PERCENT = 0.6; // max 60% of right column

    // Resize states
    const [isResizingH, setIsResizingH] = useState(false);
    const [isResizingV, setIsResizingV] = useState(false);
    const mainRef = useRef(null);
    const rightColRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (showLangDropdown && !e.target.closest('.lang-dropdown-container')) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showLangDropdown]);

    // Fetch problem
    useEffect(() => {
        if (!id) return;
        const fetchProblem = async () => {
            try {
                const response = await getProblem(id);
                setProblem(response.data);
            } catch (error) {
                console.error('Failed to fetch problem:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id]);

    // Update code template when language changes
    useEffect(() => { setCode(CODE_TEMPLATES[language]); }, [language]);

    // Check if user solved this problem
    useEffect(() => {
        const checkIfSolved = async () => {
            if (user?.id && id) {
                const result = await getUserSolvedProblemIds(user.id);
                setIsSolved(result.data.includes(parseInt(id)));
            }
        };
        checkIfSolved();
    }, [user, id, submissionResult]);

    // Fetch submissions for this problem when tab switches or after a new submission
    useEffect(() => {
        const fetchSubmissions = async () => {
            if (leftTab !== 'submissions' || !user?.id) return;
            setLoadingSubmissions(true);
            try {
                const result = await getUserSubmissions(user.id);
                // Filter to only this problem's submissions
                const problemSubs = (result.data || []).filter(s => String(s.problem_id || s.problemId) === String(id));
                setSubmissions(problemSubs);
            } catch (err) {
                console.error('Failed to fetch submissions:', err);
            } finally {
                setLoadingSubmissions(false);
            }
        };
        fetchSubmissions();
    }, [leftTab, user, id, submissionResult]);

    // Horizontal resize (left/right panels)
    useEffect(() => {
        if (!isResizingH) return;
        const onMove = (e) => {
            if (!mainRef.current) return;
            const rect = mainRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            if (pct >= 20 && pct <= 70) setLeftPanelWidth(pct);
        };
        const onUp = () => setIsResizingH(false);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizingH]);

    // Vertical resize (bottom panel)
    useEffect(() => {
        if (!isResizingV) return;
        const onMove = (e) => {
            if (!rightColRef.current) return;
            const rect = rightColRef.current.getBoundingClientRect();
            const newH = rect.bottom - e.clientY;
            const maxH = rect.height * MAX_BOTTOM_PERCENT;
            if (newH >= 80 && newH <= maxH) {
                setBottomPanelHeight(newH);
                if (isBottomCollapsed) setIsBottomCollapsed(false);
            }
        };
        const onUp = () => setIsResizingV(false);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizingV, isBottomCollapsed]);

    const handleSubmit = () => {
        setBottomTab('result');
        if (isBottomCollapsed) {
            setIsBottomCollapsed(false);
            setBottomPanelHeight(prevBottomHeight);
        }
        dispatch(submitCodeThunk({ problemId: parseInt(id), code, language, isSubmit: true }));
    };

    const handleRun = () => {
        setBottomTab('result');
        if (isBottomCollapsed) {
            setIsBottomCollapsed(false);
            setBottomPanelHeight(prevBottomHeight);
        }
        dispatch(runCodeThunk({ problemId: parseInt(id), code, language }));
    };

    const toggleBottomPanel = () => {
        if (isBottomCollapsed) {
            setBottomPanelHeight(prevBottomHeight);
        } else {
            setPrevBottomHeight(bottomPanelHeight);
            setBottomPanelHeight(MIN_BOTTOM_HEIGHT);
        }
        setIsBottomCollapsed(!isBottomCollapsed);
    };

    const getLanguageIcon = (lang) => {
        const icons = { python: '🐍', javascript: '🟨', java: '☕', cpp: '⚡' };
        return icons[lang] || '📄';
    };

    const getFileExt = (lang) => {
        const exts = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp' };
        return exts[lang] || lang;
    };

    // Loading / Not found states
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
                <div className="text-lg animate-pulse" style={{ color: 'var(--brand-primary)' }}>Loading problem...</div>
            </div>
        );
    }
    if (!problem) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
                <div className="text-lg" style={{ color: 'var(--brand-primary)' }}>Problem not found</div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden font-sans" style={{ background: 'var(--bg-page)' }}>
            {/* ═══════════════ TOP TOOLBAR ═══════════════ */}
            <div className="h-14 backdrop-blur-xl flex items-center px-4 gap-3 flex-shrink-0 z-20 relative" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Left group: Logo + Problem list nav */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 transition-colors hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                        <img src="/logo.png" alt="CodeArena" className="w-8 h-8" />
                        <span className="font-semibold text-lg hidden sm:block">CodeArena</span>
                    </Link>
                    <div className="w-px h-5" style={{ background: 'var(--border-subtle)' }} />
                    <Link to="/problems" className="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:opacity-80 rounded-lg transition-all" style={{ color: 'var(--text-secondary)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Problem List
                    </Link>
                    <button onClick={() => navigate(`/problems/${Math.max(1, parseInt(id) - 1)}`)} className="p-1.5 hover:opacity-80 rounded-lg transition-all" title="Previous" style={{ color: 'var(--text-secondary)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => navigate(`/problems/${parseInt(id) + 1}`)} className="p-1.5 hover:opacity-80 rounded-lg transition-all" title="Next" style={{ color: 'var(--text-secondary)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Center group: Run + Submit (absolutely centered) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <button
                        onClick={handleRun}
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all disabled:opacity-50 hover:brightness-110"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                        <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        Run
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-5 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-green-600/20"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
                <div className="flex-1" />

                {/* Right group: Room timer, Language, User */}
                <div className="flex items-center gap-3">
                    {roomData && (
                        <div className="flex items-center gap-2 mr-1">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                <div className={`w-1.5 h-1.5 rounded-full ${roomData.status === 'COMPLETED' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                                <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{elapsedTime}</span>
                            </div>
                        </div>
                    )}

                    {roomId && (
                        <button
                            onClick={() => setShowDiscussPanel(!showDiscussPanel)}
                            className={`p-2 rounded-lg text-sm transition-all ${showDiscussPanel ? 'text-brand-blue' : 'hover:opacity-80'}`}
                            style={{
                                background: showDiscussPanel ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: showDiscussPanel ? '' : 'var(--text-secondary)'
                            }}
                            title="Discuss"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    )}

                    {/* Language Selector — LeetCode style */}
                    <div className="relative lang-dropdown-container">
                        <button
                            onClick={() => setShowLangDropdown(!showLangDropdown)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:opacity-80 rounded-lg transition-all"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <span>{getLanguageIcon(language)}</span>
                            <span className="font-medium">{language === 'cpp' ? 'C++' : language.charAt(0).toUpperCase() + language.slice(1)}</span>
                            <svg className={`w-3.5 h-3.5 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showLangDropdown && (
                            <div className="absolute top-full right-0 mt-1.5 w-44 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                {['python', 'javascript', 'java', 'cpp'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => { setLanguage(lang); setShowLangDropdown(false); }}
                                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors ${language === lang ? 'text-brand-blue bg-brand-blue/5' : 'hover:opacity-80'}`}
                                        style={language !== lang ? { color: 'var(--text-secondary)' } : {}}
                                    >
                                        <span>{getLanguageIcon(lang)}</span>
                                        <span>{lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}</span>
                                        {language === lang && <svg className="w-4 h-4 ml-auto text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User Avatar — matching original Navbar */}
                    {/* User Avatar — matching original Navbar */}
                    {user && (
                        <Link to="/profile" className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:opacity-80">
                            <div className="w-8 h-8 rounded-full overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                                {user?.avatarUrl || user?.avatar_url ? (
                                    <img src={user.avatarUrl || user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-brand-blue to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                        {(user?.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {user?.username || 'Profile'}
                            </span>
                        </Link>
                    )}
                </div>
            </div>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <div ref={mainRef} className="flex-1 flex overflow-hidden">

                {/* ──── LEFT PANEL: Problem Description ──── */}
                <div style={{ width: `${leftPanelWidth}%`, borderRight: '1px solid var(--border-subtle)' }} className="flex flex-col overflow-hidden flex-shrink-0">
                    {/* Left Panel Tabs */}
                    <div className="h-10 flex items-center px-3 gap-1 flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <button
                            onClick={() => setLeftTab('description')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${leftTab === 'description' ? '' : 'hover:opacity-80'}`}
                            style={leftTab === 'description' ? { color: 'var(--text-primary)', background: 'var(--bg-tertiary)' } : { color: 'var(--text-secondary)' }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Description
                        </button>
                        <button
                            onClick={() => setLeftTab('submissions')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${leftTab === 'submissions' ? '' : 'hover:opacity-80'}`}
                            style={leftTab === 'submissions' ? { color: 'var(--text-primary)', background: 'var(--bg-tertiary)' } : { color: 'var(--text-secondary)' }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Submissions
                        </button>
                    </div>

                    {/* Left Panel Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: 'var(--bg-page)' }}>
                        {leftTab === 'description' && (
                            <div className="p-5">
                                {/* Problem Title */}
                                <h1 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                                    {id}. {problem.title}
                                    {isSolved && <span className="ml-2 text-green-400 text-sm">✓ Solved</span>}
                                </h1>

                                {/* Difficulty & Stats */}
                                <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
                                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${(problem.difficulty || '').toLowerCase() === 'hard' ? 'bg-red-500/15 text-red-400' :
                                        (problem.difficulty || '').toLowerCase() === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                                            (problem.difficulty || '').toLowerCase() === 'cakewalk' ? 'bg-cyan-500/15 text-cyan-400' :
                                                'bg-green-500/15 text-green-400'
                                        }`}>
                                        {problem.difficulty || 'Easy'}
                                    </span>
                                    {problem.acceptanceRate !== undefined && (
                                        <span style={{ color: 'var(--text-secondary)' }}>Acceptance: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{problem.acceptanceRate}%</span></span>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="text-sm leading-7 mb-6 whitespace-pre-wrap" style={{ color: 'var(--text-tertiary)' }}>
                                    {problem.description}
                                </div>

                                {/* Input Format */}
                                {problem.inputFormat && (
                                    <div className="mb-5">
                                        <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Input Format</h3>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono p-3 rounded-lg border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                            {problem.inputFormat?.replace(/\\n/g, '\n')}
                                        </div>
                                    </div>
                                )}

                                {/* Output Format */}
                                {problem.outputFormat && (
                                    <div className="mb-5">
                                        <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Output Format</h3>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono p-3 rounded-lg border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                            {problem.outputFormat?.replace(/\\n/g, '\n')}
                                        </div>
                                    </div>
                                )}

                                {/* Constraints */}
                                {problem.constraints && (
                                    <div className="mb-5">
                                        <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Constraints</h3>
                                        <div className="border rounded-lg p-3" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}>
                                            <code className="text-xs font-mono whitespace-pre-wrap block leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                {problem.constraints?.replace(/\\n/g, '\n')}
                                            </code>
                                        </div>
                                    </div>
                                )}

                                {/* Example 1: Sample Input */}
                                <div className="mb-4">
                                    <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Example 1:</h3>
                                    <div className="border rounded-lg p-3 space-y-2" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}>
                                        <div>
                                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Input: </span>
                                            <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{problem.sampleInput || ''}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Output: </span>
                                            <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{problem.sampleOutput || ''}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Explanation */}
                                {problem.explanation && (
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Explanation:</h3>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                                            {problem.explanation?.replace(/\\n/g, '\n')}
                                        </p>
                                    </div>
                                )}

                                {/* Tags */}
                                {problem.tags && problem.tags.length > 0 && (
                                    <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                                        <div className="flex flex-wrap gap-1.5">
                                            {problem.tags.map((tag, idx) => (
                                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] border" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {leftTab === 'submissions' && (
                            <div className="p-4">
                                {loadingSubmissions ? (
                                    <div className="flex items-center gap-2 text-cyan-400 text-sm py-4 justify-center">
                                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                        Loading...
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <div className="text-gray-500 text-sm text-center py-8">No submissions yet for this problem.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {submissions.map((sub, idx) => (
                                            <div key={sub.id || idx} className="flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors cursor-pointer"
                                                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={`text-xs font-semibold ${sub.status === 'ACCEPTED' ? 'text-green-400' :
                                                        sub.status === 'WRONG_ANSWER' ? 'text-red-400' :
                                                            sub.status === 'COMPILATION_ERROR' ? 'text-orange-400' :
                                                                sub.status === 'RUNTIME_ERROR' ? 'text-orange-400' : 'text-yellow-400'
                                                        }`}>
                                                        {sub.status === 'ACCEPTED' ? '✓ Accepted' : (sub.status || 'Unknown').replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                                        {sub.submittedAt || sub.submitted_at ? new Date(sub.submittedAt || sub.submitted_at).toLocaleString() : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    <span className="capitalize">{sub.language || '—'}</span>
                                                    {sub.executionTime !== undefined && sub.executionTime !== null && (
                                                        <span>{sub.executionTime} ms</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ──── HORIZONTAL RESIZE HANDLE ──── */}
                <div
                    onMouseDown={() => setIsResizingH(true)}
                    className={`w-[3px] cursor-col-resize flex-shrink-0 transition-colors hover:bg-blue-500/50 ${isResizingH ? 'bg-blue-500' : 'bg-transparent'}`}
                />

                {/* ──── RIGHT PANEL: Code Editor + Bottom Panel + Discuss Sidebar ──── */}
                <div ref={rightColRef} className="flex-1 flex overflow-hidden">

                    {/* Editor + Bottom Column */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Code Editor Header */}
                        <div className="h-10 flex items-center px-3 flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div className="flex items-center gap-0.5">
                                <span className="text-xs mr-1.5" style={{ color: 'var(--text-tertiary)' }}>{'</>'}</span>
                                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Code</span>
                            </div>
                            <div className="ml-4 flex items-center gap-2 px-2.5 py-1 rounded border-t-2 border-brand-blue" style={{ background: 'var(--bg-page)' }}>
                                <span className="text-xs">{getLanguageIcon(language)}</span>
                                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>main.{getFileExt(language)}</span>
                            </div>
                            <div className="ml-auto flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                                <button
                                    onClick={() => setShowResetModal(true)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:opacity-80"
                                    style={{ color: 'var(--text-secondary)' }}
                                    title="Reset Code"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 overflow-hidden">
                            <CodeEditor
                                code={code}
                                onChange={(value) => setCode(value || '')}
                                language={language}
                                onCursorChange={setCursorPos}
                            />
                        </div>

                        {/* ──── VERTICAL RESIZE HANDLE ──── */}
                        <div
                            onMouseDown={() => setIsResizingV(true)}
                            className={`h-[3px] cursor-row-resize flex-shrink-0 transition-colors hover:bg-blue-500/50 ${isResizingV ? 'bg-blue-500' : 'bg-transparent'}`}
                        />

                        {/* ──── BOTTOM PANEL: Testcase / Result ──── */}
                        <div
                            style={{
                                height: isBottomCollapsed ? `${MIN_BOTTOM_HEIGHT}px` : `${bottomPanelHeight}px`,
                                background: 'var(--bg-page)',
                                borderTop: '1px solid var(--border-subtle)'
                            }}
                            className="flex flex-col flex-shrink-0 overflow-hidden"
                        >
                            {/* Bottom Panel Header */}
                            <div className="h-10 flex items-center px-3 flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setBottomTab('testcase');
                                            if (isBottomCollapsed) {
                                                setIsBottomCollapsed(false);
                                                setBottomPanelHeight(prevBottomHeight);
                                            }
                                        }}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${bottomTab === 'testcase' ? '' : 'hover:opacity-80'}`}
                                        style={bottomTab === 'testcase' ? { color: 'var(--text-primary)', background: 'var(--bg-tertiary)' } : { color: 'var(--text-secondary)' }}
                                    >
                                        ✓ Testcase
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBottomTab('result');
                                            if (isBottomCollapsed) {
                                                setIsBottomCollapsed(false);
                                                setBottomPanelHeight(prevBottomHeight);
                                            }
                                        }}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${bottomTab === 'result' ? '' : 'hover:opacity-80'}`}
                                        style={bottomTab === 'result' ? { color: 'var(--text-primary)', background: 'var(--bg-tertiary)' } : { color: 'var(--text-secondary)' }}
                                    >
                                        ↗ Test Result
                                    </button>
                                </div>

                                <div className="ml-auto">
                                    <button
                                        onClick={toggleBottomPanel}
                                        className="p-1 hover:opacity-80 rounded transition-all"
                                        style={{ color: 'var(--text-secondary)' }}
                                        title={isBottomCollapsed ? 'Expand' : 'Collapse'}
                                    >
                                        {isBottomCollapsed ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Panel Content */}
                            {!isBottomCollapsed && (
                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                    {bottomTab === 'testcase' && (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Input:</div>
                                                <pre className="rounded-lg p-3 text-xs font-mono" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                                    {problem.sampleInput || 'No sample input'}
                                                </pre>
                                            </div>
                                            <div>
                                                <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Expected Output:</div>
                                                <pre className="rounded-lg p-3 text-xs font-mono" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                                    {problem.sampleOutput || 'No sample output'}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {bottomTab === 'result' && (
                                        <div>
                                            {submitting ? (
                                                <div className="flex items-center gap-2 text-cyan-400 text-sm">
                                                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                                    Running...
                                                </div>
                                            ) : submissionResult ? (
                                                <div className="space-y-4">
                                                    {/* Status Badge */}
                                                    <div className="flex items-center gap-2">
                                                        {submissionResult.status === 'ACCEPTED' ? (
                                                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        )}
                                                        <span className={`font-bold text-lg ${submissionResult.status === 'ACCEPTED' ? 'text-green-400' :
                                                            submissionResult.status === 'WRONG_ANSWER' ? 'text-red-400' : 'text-yellow-400'
                                                            }`}>
                                                            {submissionResult.status === 'ACCEPTED' ? 'Accepted' :
                                                                submissionResult.status === 'WRONG_ANSWER' ? 'Wrong Answer' :
                                                                    submissionResult.status === 'RUNTIME_ERROR' ? 'Runtime Error' :
                                                                        submissionResult.status === 'COMPILATION_ERROR' ? 'Compilation Error' :
                                                                            submissionResult.status?.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>

                                                    {/* Stats Row */}
                                                    <div className="flex items-center gap-4 text-xs">
                                                        {submissionResult.executionTime !== undefined && (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                                                <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                <span style={{ color: 'var(--text-secondary)' }}>Runtime</span>
                                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{submissionResult.executionTime} ms</span>
                                                            </div>
                                                        )}
                                                        {submissionResult.testCasesPassed !== undefined && (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                                                <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                                <span style={{ color: 'var(--text-secondary)' }}>Test Cases</span>
                                                                <span className={`font-medium ${submissionResult.testCasesPassed === submissionResult.totalTestCases ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {submissionResult.testCasesPassed}/{submissionResult.totalTestCases}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Error Message */}
                                                    {submissionResult.errorMessage && (
                                                        <div>
                                                            <div className="text-xs text-red-400 font-medium mb-1.5 flex items-center gap-1.5">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                                                Error
                                                            </div>
                                                            <pre className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-red-300 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                                                                {submissionResult.errorMessage}</pre>
                                                        </div>
                                                    )}

                                                    {/* Stdout */}
                                                    {submissionResult.stdout && (
                                                        <div>
                                                            <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Stdout</div>
                                                            <pre className="rounded-lg p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                                                {submissionResult.stdout}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 text-sm">
                                                    Run or submit your code to see results here.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ──── DISCUSS SIDEBAR (only in rooms, toggled) ──── */}
                    {roomId && showDiscussPanel && (
                        <>
                            <div className="w-px flex-shrink-0" style={{ background: 'var(--border-subtle)' }} />
                            <div className="w-[280px] flex-shrink-0 h-full overflow-hidden border-l" style={{ borderColor: 'var(--border-subtle)' }}>
                                <DiscussPanel roomId={roomId} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Reset Code Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowResetModal(false)}>
                    <div className="rounded-2xl shadow-2xl w-[360px] p-6" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Reset Code</h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Are you sure you want to reset your code to the default template? Your current code will be lost.</p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="px-4 py-2 text-sm font-medium hover:opacity-80 rounded-lg transition-all"
                                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setCode(CODE_TEMPLATES[language]); setShowResetModal(false); }}
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProblemDetail;
