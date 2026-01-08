import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProblem } from '../services/problemService';
import { getUserSolvedProblemIds } from '../services/submissionService';
import { submitCodeThunk, runCodeThunk } from '../store/submissionSlice';
import CodeEditor from '../components/CodeEditor';

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

const ProblemDetail = ({ problemIdProp }) => {
    const { id: paramId } = useParams();
    const id = problemIdProp || paramId;
    const dispatch = useDispatch();
    const { current: submissionResult, loading: submitting } = useSelector((state) => state.submissions);
    const { user } = useSelector((state) => state.auth);
    const [isSolved, setIsSolved] = useState(false);

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(CODE_TEMPLATES['javascript']);
    const [activeTab, setActiveTab] = useState('testcase');
    const [consoleHeight, setConsoleHeight] = useState(256);
    const [isResizing, setIsResizing] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
    const containerRef = useRef(null);
    const mainContainerRef = useRef(null);

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
        setActiveTab('result');
        dispatch(submitCodeThunk({
            problemId: parseInt(id),
            code,
            language,
            isSubmit: true,
        }));
    };

    const handleRun = () => {
        setActiveTab('result');
        dispatch(runCodeThunk({
            problemId: parseInt(id),
            code,
            language,
        }));
    };

    const startResize = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const startHorizontalResize = (e) => {
        e.preventDefault();
        setIsResizingHorizontal(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newHeight = containerRect.bottom - e.clientY;

            const minHeight = 150;
            const maxHeight = containerRect.height - 200;

            if (newHeight >= minHeight && newHeight <= maxHeight) {
                setConsoleHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {
        const handleHorizontalMouseMove = (e) => {
            if (!isResizingHorizontal || !mainContainerRef.current) return;

            const containerRect = mainContainerRef.current.getBoundingClientRect();
            const newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            const minWidth = 30;
            const maxWidth = 70;

            if (newWidthPercent >= minWidth && newWidthPercent <= maxWidth) {
                setLeftPanelWidth(newWidthPercent);
            }
        };

        const handleHorizontalMouseUp = () => {
            setIsResizingHorizontal(false);
        };

        if (isResizingHorizontal) {
            document.addEventListener('mousemove', handleHorizontalMouseMove);
            document.addEventListener('mouseup', handleHorizontalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleHorizontalMouseMove);
            document.removeEventListener('mouseup', handleHorizontalMouseUp);
        };
    }, [isResizingHorizontal]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-primary flex items-center justify-center">
                <div className="text-primary-400 text-xl">Loading problem...</div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen bg-dark-primary flex items-center justify-center">
                <div className="text-red-400 text-xl">Problem not found</div>
            </div>
        );
    }

    const getDifficultyBadge = (difficulty) => {
        const badges = {
            EASY: 'badge-easy',
            MEDIUM: 'badge-medium',
            HARD: 'badge-hard',
        };
        return badges[difficulty] || 'badge-medium';
    };

    return (
        <div className="h-screen dark:bg-dark-bg-primary bg-light-bg-primary flex flex-col">
            <div ref={mainContainerRef} className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem Description */}
                <div style={{ width: `${leftPanelWidth}%` }} className="border-r dark:border-dark-border-primary border-light-border-primary overflow-y-auto">
                    <div className="p-8">
                        <div className="mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <h1 className="text-3xl font-bold dark:text-dark-text-primary text-light-text-primary">
                                    {problem.title}
                                </h1>
                                <span className={getDifficultyBadge(problem.difficulty)}>
                                    {problem.difficulty}
                                </span>
                                {isSolved && (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500 text-white text-sm font-semibold shadow-lg shadow-green-500/30">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Solved
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {problem.tags?.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 text-sm rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="max-w-none">
                            <h3 className="text-xl font-semibold dark:text-dark-text-primary text-light-text-primary mb-3">Description</h3>
                            <p className="dark:text-dark-text-secondary text-light-text-secondary whitespace-pre-wrap">{problem.description}</p>

                            {problem.inputFormat && (
                                <>
                                    <h3 className="text-xl font-semibold dark:text-dark-text-primary text-light-text-primary mt-6 mb-3">Input Format</h3>
                                    <p className="dark:text-dark-text-secondary text-light-text-secondary whitespace-pre-wrap">{problem.inputFormat}</p>
                                </>
                            )}

                            {problem.outputFormat && (
                                <>
                                    <h3 className="text-xl font-semibold dark:text-dark-text-primary text-light-text-primary mt-6 mb-3">Output Format</h3>
                                    <p className="dark:text-dark-text-secondary text-light-text-secondary whitespace-pre-wrap">{problem.outputFormat}</p>
                                </>
                            )}

                            {problem.constraints && (
                                <>
                                    <h3 className="text-xl font-semibold dark:text-dark-text-primary text-light-text-primary mt-6 mb-3">Constraints</h3>
                                    <p className="dark:text-dark-text-secondary text-light-text-secondary whitespace-pre-wrap">{problem.constraints}</p>
                                </>
                            )}

                            {problem.sampleInput && (
                                <div className="mt-6">
                                    <h3 className="text-xl font-semibold dark:text-dark-text-primary text-light-text-primary mb-3">Sample Input</h3>
                                    <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-4 rounded-lg dark:text-dark-text-primary text-light-text-primary overflow-x-auto">
                                        {problem.sampleInput}
                                    </pre>
                                </div>
                            )}

                            {problem.sampleOutput && (
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold dark:text-dark-text-primary text-light-text-primary mb-3">Sample Output</h3>
                                    <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-4 rounded-lg dark:text-dark-text-primary text-light-text-primary overflow-x-auto">
                                        {problem.sampleOutput}
                                    </pre>
                                </div>
                            )}

                            {problem.explanation && (
                                <>
                                    <h3 className="text-xl font-semibold dark:text-dark-text-primary text-light-text-primary mt-6 mb-3">Explanation</h3>
                                    <p className="dark:text-dark-text-secondary text-light-text-secondary whitespace-pre-wrap">{problem.explanation}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Vertical Resize Handle */}
                <div
                    onMouseDown={startHorizontalResize}
                    className={`w-1 dark:bg-dark-border-primary bg-light-border-primary hover:bg-brand-orange cursor-ew-resize transition-colors flex-shrink-0 ${isResizingHorizontal ? 'bg-brand-orange' : ''
                        }`}
                    style={{ userSelect: 'none' }}
                />

                {/* Right Panel - Code Editor + Console */}
                <div ref={containerRef} style={{ width: `${100 - leftPanelWidth}%` }} className="flex flex-col overflow-hidden">
                    {/* Editor Header */}
                    <div className="dark:bg-dark-bg-secondary bg-light-bg-secondary border-b dark:border-dark-border-primary border-light-border-primary py-4 px-3 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold dark:text-dark-text-secondary text-light-text-secondary uppercase tracking-wider">Language:</span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary dark:text-dark-text-primary text-light-text-primary px-4 py-2 text-sm rounded-lg border dark:border-dark-border-primary border-light-border-primary focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent hover:border-brand-orange/50 transition-all duration-200 cursor-pointer font-medium shadow-sm"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRun}
                                disabled={submitting}
                                className="px-5 py-2 text-sm font-medium dark:bg-dark-bg-tertiary bg-light-bg-tertiary dark:text-dark-text-primary text-light-text-primary rounded-lg hover:bg-brand-orange/10 border dark:border-dark-border-primary border-light-border-primary hover:border-brand-orange/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {submitting ? '⏳ Running...' : '▶ Run Code'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] transform"
                            >
                                {submitting ? '⏳ Submitting...' : '✓ Submit'}
                            </button>
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div className="relative pt-1 pr-1" style={{ flex: 1, overflow: 'hidden' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-dark-primary/50 to-dark-secondary/30 pointer-events-none" />
                        <CodeEditor
                            code={code}
                            onChange={(value) => setCode(value || '')}
                            language={language}
                        />
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResize}
                        className={`h-1 dark:bg-dark-border-primary bg-light-border-primary hover:bg-brand-orange cursor-ns-resize transition-colors ${isResizing ? 'bg-brand-orange' : ''
                            }`}
                        style={{ userSelect: 'none' }}
                    />

                    {/* Console Panel - Resizable */}
                    <div style={{ height: `${consoleHeight}px` }} className="border-t dark:border-dark-border-primary border-light-border-primary dark:bg-dark-bg-secondary bg-light-bg-secondary flex flex-col">
                        {/* Console Tabs */}
                        <div className="flex border-b dark:border-dark-border-primary border-light-border-primary">
                            <button
                                onClick={() => setActiveTab('testcase')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'testcase'
                                    ? 'text-brand-orange border-b-2 border-brand-orange dark:bg-dark-bg-tertiary/50 bg-light-bg-tertiary/50'
                                    : 'dark:text-dark-text-secondary text-light-text-secondary dark:hover:text-dark-text-primary hover:text-light-text-primary'
                                    }`}
                            >
                                Testcase
                            </button>
                            <button
                                onClick={() => setActiveTab('result')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'result'
                                    ? 'text-brand-orange border-b-2 border-brand-orange dark:bg-dark-bg-tertiary/50 bg-light-bg-tertiary/50'
                                    : 'dark:text-dark-text-secondary text-light-text-secondary dark:hover:text-dark-text-primary hover:text-light-text-primary'
                                    }`}
                            >
                                Test Result
                            </button>
                        </div>

                        {/* Console Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'testcase' && (
                                <div className="dark:text-dark-text-secondary text-light-text-secondary text-sm">
                                    <div className="mb-2 font-semibold dark:text-dark-text-primary text-light-text-primary">Input:</div>
                                    <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-3 rounded dark:text-dark-text-primary text-light-text-primary mb-4">
                                        {problem.sampleInput || 'No test case available'}
                                    </pre>
                                    <div className="mb-2 font-semibold dark:text-dark-text-primary text-light-text-primary">Expected Output:</div>
                                    <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-3 rounded dark:text-dark-text-primary text-light-text-primary">
                                        {problem.sampleOutput || 'No expected output available'}
                                    </pre>
                                </div>
                            )}

                            {activeTab === 'result' && (
                                <div>
                                    {submitting ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="text-brand-orange">Running code...</div>
                                        </div>
                                    ) : submissionResult ? (
                                        <div className="space-y-3">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold ${submissionResult.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' :
                                                submissionResult.status === 'WRONG_ANSWER' ? 'bg-red-500/20 text-red-400' :
                                                    submissionResult.status === 'COMPILATION_ERROR' ? 'bg-orange-500/20 text-orange-400' :
                                                        submissionResult.status === 'RUNTIME_ERROR' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {submissionResult.status === 'ACCEPTED' && '✓'}
                                                {submissionResult.status === 'WRONG_ANSWER' && '✗'}
                                                {submissionResult.status === 'COMPILATION_ERROR' && '⚠'}
                                                {submissionResult.status === 'RUNTIME_ERROR' && '⚠'}
                                                {submissionResult.status.replace(/_/g, ' ')}
                                            </div>

                                            {submissionResult.compile_error && (
                                                <div>
                                                    <div className="text-red-400 font-semibold mb-2 text-sm">Compilation Error:</div>
                                                    <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-3 rounded text-red-400 text-xs font-mono overflow-x-auto">
                                                        {submissionResult.compile_error}
                                                    </pre>
                                                </div>
                                            )}

                                            {submissionResult.stdout && (
                                                <div>
                                                    <div className="text-green-400 font-semibold mb-2 text-sm">Output:</div>
                                                    <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-3 rounded text-green-600 dark:text-green-400 text-xs font-mono overflow-x-auto">
                                                        {submissionResult.stdout}
                                                    </pre>
                                                </div>
                                            )}

                                            {submissionResult.stderr && (
                                                <div>
                                                    <div className="text-yellow-400 font-semibold mb-2 text-sm">Error:</div>
                                                    <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-3 rounded text-yellow-600 dark:text-yellow-400 text-xs font-mono overflow-x-auto">
                                                        {submissionResult.stderr}
                                                    </pre>
                                                </div>
                                            )}

                                            {submissionResult.status === 'ACCEPTED' && (
                                                <div className="flex gap-4 text-sm dark:text-dark-text-secondary text-light-text-secondary">
                                                    <div>Runtime: <span className="dark:text-dark-text-primary text-light-text-primary">{submissionResult.executionTime}ms</span></div>
                                                    <div>Memory: <span className="dark:text-dark-text-primary text-light-text-primary">{(submissionResult.memoryUsed / 1024).toFixed(2)}MB</span></div>
                                                </div>
                                            )}

                                            {submissionResult.status === 'WRONG_ANSWER' && (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-green-400 font-semibold mb-2 text-sm">Expected Output:</div>
                                                            <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-3 rounded text-green-600 dark:text-green-400 text-xs font-mono overflow-x-auto">
                                                                {submissionResult.expectedOutput || problem.sampleOutput}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <div className="text-red-400 font-semibold mb-2 text-sm">Your Output:</div>
                                                            <pre className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary p-3 rounded text-red-600 dark:text-red-400 text-xs font-mono overflow-x-auto">
                                                                {submissionResult.actualOutput || submissionResult.stdout || '(empty)'}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="dark:text-dark-text-tertiary text-light-text-tertiary text-sm text-center py-8">
                                            Click "Run Code" to see the output here
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemDetail;

