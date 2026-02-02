import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getProblem } from '../services/problemService';
import { getUserSolvedProblemIds } from '../services/submissionService';
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
                        setRoomData(prev => ({
                            ...prev,
                            status: 'COMPLETED',
                            winnerId: update.winnerId
                        }));
                        alert(`Room Ended! Winner: ${update.winnerId}`);
                    }
                });
            },
            debug: () => { } // Silence debug
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [roomId, roomData?.status]);

    useEffect(() => {
        if (!roomData?.startedAt) return;
        if (roomData.status === 'COMPLETED') return; // Stop timer if completed

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
    const [activeTab, setActiveTab] = useState('testcases');

    // Panel sizes and positions
    const [leftPanelWidth, setLeftPanelWidth] = useState(25);
    const [rightPanelWidth, setRightPanelWidth] = useState(25);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
    const [consolePosition, setConsolePosition] = useState('right'); // 'right' or 'bottom'
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // Collapse state for bottom panel
    const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
    const [prevConsoleHeight, setPrevConsoleHeight] = useState(200);
    const [showDiscussPanel, setShowDiscussPanel] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showLangDropdown && !event.target.closest('.language-selector-container')) {
                setShowLangDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showLangDropdown]);

    // Resizing states
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [isResizingBottom, setIsResizingBottom] = useState(false);

    const mainContainerRef = useRef(null);
    const editorContainerRef = useRef(null);
    const verticalContainerRef = useRef(null);

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
    useEffect(() => {
        setCode(CODE_TEMPLATES[language]);
    }, [language]);

    // Check if user has solved this problem
    useEffect(() => {
        const checkIfSolved = async () => {
            if (user?.id && id) {
                const result = await getUserSolvedProblemIds(user.id);
                setIsSolved(result.data.includes(parseInt(id)));
            }
        };
        checkIfSolved();
    }, [user, id, submissionResult]);

    const handleSubmit = () => {
        setActiveTab('console');
        dispatch(submitCodeThunk({
            problemId: parseInt(id),
            code,
            language,
            isSubmit: true,
        }));
    };

    const handleRun = () => {
        setActiveTab('console');
        dispatch(runCodeThunk({
            problemId: parseInt(id),
            code,
            language,
        }));
    };

    // Handle horizontal resize for left and right panels
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!mainContainerRef.current) return;
            const containerRect = mainContainerRef.current.getBoundingClientRect();

            if (isResizingLeft) {
                const newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
                if (newWidthPercent >= 15 && newWidthPercent <= 40) {
                    setLeftPanelWidth(newWidthPercent);
                }
            }

            if (isResizingRight) {
                const newWidthPercent = ((containerRect.right - e.clientX) / containerRect.width) * 100;
                if (newWidthPercent >= 15 && newWidthPercent <= 40) {
                    setRightPanelWidth(newWidthPercent);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
        };

        if (isResizingLeft || isResizingRight) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft, isResizingRight]);

    // Handle vertical resize for bottom panel
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingBottom || !verticalContainerRef.current) return;
            const containerRect = verticalContainerRef.current.getBoundingClientRect();
            // Use the bottom of the main container as the anchor
            const newHeight = containerRect.bottom - e.clientY;

            // Allow resizing up to 80% of container height or 800px
            const maxHeight = Math.min(containerRect.height * 0.8, 800);

            if (newHeight >= 100 && newHeight <= maxHeight) {
                setBottomPanelHeight(newHeight);
                // If dragging, we are no longer collapsed
                if (isConsoleCollapsed) {
                    setIsConsoleCollapsed(false);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizingBottom(false);
        };

        if (isResizingBottom) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingBottom]);

    const toggleConsolePosition = () => {
        setConsolePosition(prev => prev === 'right' ? 'bottom' : 'right');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-brand-blue text-xl animate-pulse">Loading problem...</div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-red-400 text-xl">Problem not found</div>
            </div>
        );
    }

    const getLanguageIcon = (lang) => {
        const icons = {
            python: '🐍',
            javascript: '🟨',
            java: '☕',
            cpp: '⚡'
        };
        return icons[lang] || '📄';
    };

    // Console Panel Component (reusable for both positions)
    const ConsolePanel = ({ className = '', style = {} }) => (
        <div className={`flex flex-col bg-[#12121a]/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden ${className}`} style={style}>
            {/* Tabs */}
            <div className="h-10 bg-[#0d0d12] border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setActiveTab('testcases');
                            if (isConsoleCollapsed) {
                                setIsConsoleCollapsed(false);
                                setBottomPanelHeight(prevConsoleHeight);
                            }
                        }}
                        className={`text-sm font-medium transition-colors ${activeTab === 'testcases'
                            ? 'text-white'
                            : 'text-dark-text-tertiary hover:text-white'
                            }`}
                    >
                        Test Cases
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('console');
                            if (isConsoleCollapsed) {
                                setIsConsoleCollapsed(false);
                                setBottomPanelHeight(prevConsoleHeight);
                            }
                        }}
                        className={`text-sm font-medium transition-colors ${activeTab === 'console'
                            ? 'text-white'
                            : 'text-dark-text-tertiary hover:text-white'
                            }`}
                    >
                        Console
                    </button>
                </div>

                {/* Position Toggle Button */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            if (isConsoleCollapsed) {
                                setBottomPanelHeight(prevConsoleHeight);
                            } else {
                                setPrevConsoleHeight(bottomPanelHeight);
                                setBottomPanelHeight(40); // Header height
                            }
                            setIsConsoleCollapsed(!isConsoleCollapsed);
                        }}
                        className="p-1.5 rounded-md hover:bg-white/5 text-dark-text-tertiary hover:text-white transition-colors"
                        title={isConsoleCollapsed ? "Expand" : "Collapse"}
                    >
                        {isConsoleCollapsed ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={toggleConsolePosition}
                        className="p-1.5 rounded-md hover:bg-white/5 text-dark-text-tertiary hover:text-white transition-colors"
                        title={consolePosition === 'right' ? 'Move to bottom' : 'Move to right'}
                    >
                        {consolePosition === 'right' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {activeTab === 'testcases' && (
                    <div className="space-y-4">
                        <div>
                            <div className="text-dark-text-tertiary text-xs mb-2">Input:</div>
                            <pre className="bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-white text-xs font-mono">
                                {problem.sampleInput || 's = "example"'}
                            </pre>
                        </div>
                        <div>
                            <div className="text-dark-text-tertiary text-xs mb-2">Expected Output:</div>
                            <pre className="bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-white text-xs font-mono">
                                {problem.sampleOutput || '"result"'}
                            </pre>
                        </div>
                    </div>
                )}

                {activeTab === 'console' && (
                    <div className="h-full">
                        {submitting ? (
                            <div className="flex items-center gap-2 text-cyan-400 text-sm">
                                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                Running...
                            </div>
                        ) : submissionResult ? (
                            <div className="space-y-3">
                                <div className={`font-medium text-sm ${submissionResult.status === 'ACCEPTED' ? 'text-green-400' :
                                    submissionResult.status === 'WRONG_ANSWER' ? 'text-red-400' :
                                        'text-yellow-400'
                                    }`}>
                                    Run log ({submissionResult.status === 'ACCEPTED' ? 'Successful' : submissionResult.status.replace(/_/g, ' ')})
                                </div>

                                <div className="bg-[#0a0a0f] border border-white/5 rounded-lg p-3 font-mono text-xs space-y-1">
                                    <div className="text-green-400">Successfully run: oc.</div>
                                    <div className="text-dark-text-secondary">Running log:</div>
                                    {submissionResult.executionTime && (
                                        <div className="text-dark-text-tertiary">Runtime: {submissionResult.executionTime} ms</div>
                                    )}
                                    {submissionResult.stdout && (
                                        <div className="text-white mt-2">Output: {submissionResult.stdout}</div>
                                    )}
                                    {submissionResult.stderr && (
                                        <div className="text-red-400 mt-2">Error: {submissionResult.stderr}</div>
                                    )}
                                    {submissionResult.compile_error && (
                                        <div className="text-red-400 mt-2">Compile Error: {submissionResult.compile_error}</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-dark-text-tertiary text-sm">
                                Run your code to see console output here.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
                {/* Top Header Bar */}


                {/* Main Content Area */}
                <div ref={mainContainerRef} className="flex-1 flex overflow-hidden p-3 gap-3">
                    {/* Left Panel - Problem Description */}
                    <div
                        style={{ width: `${leftPanelWidth}%` }}
                        className="flex flex-col gap-3 overflow-hidden flex-shrink-0"
                    >
                        {/* Problem Header Card */}
                        <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-xl border border-white/5 p-4">
                            <div className="text-dark-text-tertiary text-xs font-medium mb-1">Problem</div>
                            <h1 className="text-white font-semibold text-lg leading-tight">
                                Problem {id}: {problem.title}
                            </h1>
                            {isSolved && (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                                    ✓ Solved
                                </span>
                            )}
                        </div>

                        {/* Problem Description Card */}
                        <div className="flex-1 bg-[#12121a]/80 backdrop-blur-xl rounded-xl border border-white/5 p-5 overflow-y-auto custom-scrollbar">
                            {/* Difficulty & Stats Header - Mobile only (since desktop header is above) or Inline below title */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${(problem.difficulty || '').toLowerCase() === 'hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    (problem.difficulty || '').toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                    }`}>
                                    {problem.difficulty || 'Easy'}
                                </span>

                                {problem.acceptanceRate !== undefined && (
                                    <div className="flex items-center gap-1.5 text-dark-text-secondary">
                                        <span className="text-dark-text-tertiary">Acceptance:</span>
                                        <span className="font-medium text-white">{problem.acceptanceRate}%</span>
                                    </div>
                                )}
                            </div>

                            <div className="prose prose-invert max-w-none mb-6">
                                <p className="text-dark-text-secondary text-sm leading-7">
                                    {problem.description}
                                </p>
                            </div>

                            {/* Input Format */}
                            {problem.inputFormat && (
                                <div className="mb-5">
                                    <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-brand-blue rounded-full"></span>
                                        Input Format
                                    </h3>
                                    <div className="text-dark-text-secondary text-sm leading-relaxed whitespace-pre-wrap pl-3 border-l border-white/5 ml-0.5 font-mono bg-[#0a0a0f]/30 p-2 rounded-r-lg">
                                        {problem.inputFormat?.replace(/\\n/g, '\n')}
                                    </div>
                                </div>
                            )}

                            {/* Output Format */}
                            {problem.outputFormat && (
                                <div className="mb-5">
                                    <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-brand-blue rounded-full"></span>
                                        Output Format
                                    </h3>
                                    <div className="text-dark-text-secondary text-sm leading-relaxed whitespace-pre-wrap pl-3 border-l border-white/5 ml-0.5 font-mono bg-[#0a0a0f]/30 p-2 rounded-r-lg">
                                        {problem.outputFormat?.replace(/\\n/g, '\n')}
                                    </div>
                                </div>
                            )}

                            {/* Constraints */}
                            {problem.constraints && (
                                <div className="mb-6">
                                    <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
                                        Constraints
                                    </h3>
                                    <div className="bg-[#0a0a0f]/50 border border-white/5 rounded-lg p-3">
                                        <code className="text-dark-text-secondary text-xs font-mono whitespace-pre-wrap block leading-relaxed">
                                            {problem.constraints?.replace(/\\n/g, '\n')}
                                        </code>
                                    </div>
                                </div>
                            )}

                            {/* Sample Input Section */}
                            <div className="mb-5">
                                <h3 className="text-white font-semibold text-sm mb-2">Sample Input</h3>
                                <div className="relative group">
                                    <pre className="bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-gray-300 text-xs font-mono overflow-x-auto custom-scrollbar">
                                        {problem.sampleInput || ''}
                                    </pre>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(problem.sampleInput || '')}
                                        className="absolute top-2 right-2 p-1.5 rounded bg-white/5 text-dark-text-tertiary hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Copy Input"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Sample Output Section */}
                            <div className="mb-6">
                                <h3 className="text-white font-semibold text-sm mb-2">Sample Output</h3>
                                <pre className="bg-[#0a0a0f] border border-white/5 rounded-lg p-3 text-gray-300 text-xs font-mono overflow-x-auto custom-scrollbar">
                                    {problem.sampleOutput || ''}
                                </pre>
                            </div>

                            {/* Explanation */}
                            {problem.explanation && (
                                <div className="mb-6 bg-brand-blue/5 border border-brand-blue/10 rounded-lg p-4">
                                    <h3 className="text-brand-blue font-semibold text-sm mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Explanation
                                    </h3>
                                    <p className="text-dark-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                        {problem.explanation?.replace(/\\n/g, '\n')}
                                    </p>
                                </div>
                            )}

                            {/* Tags */}
                            {problem.tags && problem.tags.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-white/5">
                                    <div className="flex flex-wrap gap-2">
                                        {problem.tags.map((tag, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded bg-[#1e1e24] text-dark-text-tertiary text-[10px] border border-white/5 hover:border-white/10 transition-colors cursor-default">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Left Resize Handle */}
                    <div
                        onMouseDown={() => setIsResizingLeft(true)}
                        className={`w-1 rounded-full cursor-col-resize transition-colors flex-shrink-0 ${isResizingLeft ? 'bg-brand-blue' : 'bg-transparent hover:bg-white/20'
                            }`}
                    />

                    {/* Center + Right Area */}
                    <div ref={verticalContainerRef} className="flex-1 flex flex-col gap-3 overflow-hidden">
                        <div className="flex-1 flex gap-3 overflow-hidden">
                            {/* Center Panel - Code Editor */}
                            <div
                                ref={editorContainerRef}
                                className={`flex flex-col bg-[#12121a]/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden ${consolePosition === 'right' ? 'flex-1' : 'flex-1'
                                    }`}
                            >
                                {/* Editor Header with File Tab */}
                                <div className="h-10 bg-[#0d0d12] border-b border-white/5 flex items-center px-2 flex-shrink-0 gap-3">

                                    {/* Left: Run, Submit, File Tab */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleRun}
                                            disabled={submitting}
                                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                                            title="Run Code"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-medium hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-brand-blue/20"
                                        >
                                            {submitting ? '...' : 'Submit'}
                                        </button>

                                        {/* File Tab */}
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-t-lg border-b-2 border-brand-blue ml-2">
                                            <span className="text-xs">{getLanguageIcon(language)}</span>
                                            <span className="text-white text-xs font-medium">main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}</span>
                                            <span className="text-dark-text-tertiary text-xs">×</span>
                                        </div>
                                    </div>

                                    {/* Right: Timer, Status, Language Selector, Discuss */}
                                    <div className="ml-auto flex items-center gap-3 px-2 relative language-selector-container">

                                        {/* Room Timer & Status */}
                                        {roomData && (
                                            <div className="flex items-center gap-3 mr-2">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1a24] rounded-lg border border-white/5">
                                                    <div className={`w-2 h-2 rounded-full ${roomData.status === 'COMPLETED' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                                                    <span className="text-white font-mono text-sm tracking-wider">{elapsedTime}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${roomData.status === 'COMPLETED' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                                    }`}>
                                                    {roomData.status === 'COMPLETED' ? 'ENDED' : 'ACTIVE'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Language Selector */}
                                        <button
                                            onClick={() => setShowLangDropdown(!showLangDropdown)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a24] border border-white/10 hover:border-brand-blue/50 text-xs text-white transition-all hover:bg-white/5"
                                        >
                                            <span>{getLanguageIcon(language)}</span>
                                            <span className="capitalize">{language === 'cpp' ? 'C++' : language}</span>
                                            <svg className={`w-3 h-3 text-dark-text-tertiary transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {showLangDropdown && (
                                            <div className="absolute top-full right-0 mt-2 w-40 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl">
                                                {['python', 'javascript', 'java', 'cpp'].map((lang) => (
                                                    <button
                                                        key={lang}
                                                        onClick={() => {
                                                            setLanguage(lang);
                                                            setShowLangDropdown(false);
                                                        }}
                                                        className={`w-full px-4 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${language === lang ? 'text-brand-blue bg-brand-blue/5' : 'text-dark-text-secondary hover:text-white'
                                                            }`}
                                                    >
                                                        <span>{getLanguageIcon(lang)}</span>
                                                        <span className="capitalize">{lang === 'cpp' ? 'C++' : lang}</span>
                                                        {language === lang && (
                                                            <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {roomId ? (
                                            <button
                                                onClick={() => setShowDiscussPanel(!showDiscussPanel)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${showDiscussPanel
                                                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                                                    : 'bg-white/5 border border-white/10 text-dark-text-secondary hover:bg-white/10'
                                                    }`}
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                {showDiscussPanel ? 'Console' : 'Discuss'}
                                            </button>
                                        ) : (
                                            <span className="text-dark-text-tertiary text-xs">◇ Visual Studio Dark</span>
                                        )}
                                    </div>
                                </div>

                                {/* Monaco Editor */}
                                <div className="flex-1 overflow-hidden">
                                    <CodeEditor
                                        code={code}
                                        onChange={(value) => setCode(value || '')}
                                        language={language}
                                    />
                                </div>
                            </div>

                            {/* Right Panel - Console or Discussion (when position is 'right') */}
                            {consolePosition === 'right' && (
                                <>
                                    {/* Right Resize Handle */}
                                    <div
                                        onMouseDown={() => setIsResizingRight(true)}
                                        className={`w-1 rounded-full cursor-col-resize transition-colors flex-shrink-0 ${isResizingRight ? 'bg-brand-blue' : 'bg-transparent hover:bg-white/20'
                                            }`}
                                    />
                                    {/* Show DiscussPanel when in room AND toggled, otherwise ConsolePanel */}
                                    {roomId && showDiscussPanel ? (
                                        <div style={{ width: `${rightPanelWidth}%`, flexShrink: 0 }} className="h-full">
                                            <DiscussPanel roomId={roomId} />
                                        </div>
                                    ) : (
                                        <ConsolePanel style={{ width: `${rightPanelWidth}%`, flexShrink: 0 }} />
                                    )}
                                </>
                            )}

                            {/* Discuss Panel on right side (when console is bottom AND in room AND toggled) */}
                            {roomId && showDiscussPanel && consolePosition === 'bottom' && (
                                <>
                                    <div className="w-1 rounded-full cursor-col-resize bg-transparent hover:bg-white/20 flex-shrink-0" />
                                    <div style={{ width: '25%', flexShrink: 0 }} className="h-full">
                                        <DiscussPanel roomId={roomId} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bottom Panel - Console (when position is 'bottom') */}
                        {consolePosition === 'bottom' && (
                            <>
                                {/* Bottom Resize Handle */}
                                <div
                                    onMouseDown={() => setIsResizingBottom(true)}
                                    className={`h-1 rounded-full cursor-row-resize transition-colors flex-shrink-0 ${isResizingBottom ? 'bg-brand-blue' : 'bg-transparent hover:bg-white/20'
                                        }`}
                                />
                                <ConsolePanel style={{ height: `${bottomPanelHeight}px`, flexShrink: 0 }} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProblemDetail;
