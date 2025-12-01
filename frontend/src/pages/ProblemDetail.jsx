import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProblem } from '../services/problemService';
import { submitCodeThunk, runCodeThunk } from '../store/submissionSlice';
import CodeEditor from '../components/CodeEditor';

const ProblemDetail = ({ problemIdProp }) => {
    const { id: paramId } = useParams();
    const id = problemIdProp || paramId;
    const dispatch = useDispatch();
    const { current: submissionResult, loading: submitting } = useSelector((state) => state.submissions);

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('// Write your code here\n');
    const [language, setLanguage] = useState('javascript');
    const [activeTab, setActiveTab] = useState('testcase');
    const [consoleHeight, setConsoleHeight] = useState(256);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

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
            code,
            language,
        }));
    };

    const startResize = (e) => {
        e.preventDefault();
        setIsResizing(true);
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
        <div className="h-screen bg-dark-primary flex flex-col">
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem Description */}
                <div className="w-1/2 border-r border-dark-tertiary overflow-y-auto">
                    <div className="p-8">
                        <div className="mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <h1 className="text-3xl font-bold text-gray-100">
                                    {problem.title}
                                </h1>
                                <span className={getDifficultyBadge(problem.difficulty)}>
                                    {problem.difficulty}
                                </span>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {problem.tags?.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 text-sm rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-semibold text-gray-200 mb-3">Description</h3>
                            <p className="text-gray-400 whitespace-pre-wrap">{problem.description}</p>

                            {problem.inputFormat && (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">Input Format</h3>
                                    <p className="text-gray-400 whitespace-pre-wrap">{problem.inputFormat}</p>
                                </>
                            )}

                            {problem.outputFormat && (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">Output Format</h3>
                                    <p className="text-gray-400 whitespace-pre-wrap">{problem.outputFormat}</p>
                                </>
                            )}

                            {problem.constraints && (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">Constraints</h3>
                                    <p className="text-gray-400 whitespace-pre-wrap">{problem.constraints}</p>
                                </>
                            )}

                            {problem.sampleInput && (
                                <div className="mt-6">
                                    <h3 className="text-xl font-semibold text-gray-200 mb-3">Sample Input</h3>
                                    <pre className="bg-dark-tertiary p-4 rounded-lg text-gray-300 overflow-x-auto">
                                        {problem.sampleInput}
                                    </pre>
                                </div>
                            )}

                            {problem.sampleOutput && (
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold text-gray-200 mb-3">Sample Output</h3>
                                    <pre className="bg-dark-tertiary p-4 rounded-lg text-gray-300 overflow-x-auto">
                                        {problem.sampleOutput}
                                    </pre>
                                </div>
                            )}

                            {problem.explanation && (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">Explanation</h3>
                                    <p className="text-gray-400 whitespace-pre-wrap">{problem.explanation}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Code Editor + Console */}
                <div ref={containerRef} className="w-1/2 flex flex-col">
                    {/* Editor Header */}
                    <div className="bg-dark-secondary border-b border-dark-tertiary p-3 flex items-center justify-between">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-dark-tertiary text-gray-300 px-3 py-1.5 text-sm rounded border border-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>

                        <div className="flex gap-2">
                            <button
                                onClick={handleRun}
                                disabled={submitting}
                                className="px-4 py-1.5 text-sm bg-dark-tertiary text-gray-300 rounded hover:bg-dark-tertiary/80 disabled:opacity-50 transition-colors"
                            >
                                {submitting ? 'Running...' : 'Run Code'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <CodeEditor
                            code={code}
                            onChange={(value) => setCode(value || '')}
                            language={language}
                        />
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResize}
                        className={`h-1 bg-dark-tertiary hover:bg-primary-500 cursor-ns-resize transition-colors ${isResizing ? 'bg-primary-500' : ''
                            }`}
                        style={{ userSelect: 'none' }}
                    />

                    {/* Console Panel - Resizable */}
                    <div style={{ height: `${consoleHeight}px` }} className="border-t border-dark-tertiary bg-dark-secondary flex flex-col">
                        {/* Console Tabs */}
                        <div className="flex border-b border-dark-tertiary">
                            <button
                                onClick={() => setActiveTab('testcase')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'testcase'
                                    ? 'text-primary-400 border-b-2 border-primary-400 bg-dark-tertiary/50'
                                    : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                Testcase
                            </button>
                            <button
                                onClick={() => setActiveTab('result')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'result'
                                    ? 'text-primary-400 border-b-2 border-primary-400 bg-dark-tertiary/50'
                                    : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                Test Result
                            </button>
                        </div>

                        {/* Console Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'testcase' && (
                                <div className="text-gray-400 text-sm">
                                    <div className="mb-2 font-semibold text-gray-300">Input:</div>
                                    <pre className="bg-dark-tertiary p-3 rounded text-gray-300 mb-4">
                                        {problem.sampleInput || 'No test case available'}
                                    </pre>
                                    <div className="mb-2 font-semibold text-gray-300">Expected Output:</div>
                                    <pre className="bg-dark-tertiary p-3 rounded text-gray-300">
                                        {problem.sampleOutput || 'No expected output available'}
                                    </pre>
                                </div>
                            )}

                            {activeTab === 'result' && (
                                <div>
                                    {submitting ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="text-primary-400">Running code...</div>
                                        </div>
                                    ) : submissionResult ? (
                                        <div className="space-y-3">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold ${submissionResult.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' :
                                                submissionResult.status === 'COMPILATION_ERROR' ? 'bg-red-500/20 text-red-400' :
                                                    submissionResult.status === 'RUNTIME_ERROR' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {submissionResult.status === 'ACCEPTED' && '✓'}
                                                {submissionResult.status === 'COMPILATION_ERROR' && '✗'}
                                                {submissionResult.status === 'RUNTIME_ERROR' && '⚠'}
                                                {submissionResult.status.replace(/_/g, ' ')}
                                            </div>

                                            {submissionResult.compile_error && (
                                                <div>
                                                    <div className="text-red-400 font-semibold mb-2 text-sm">Compilation Error:</div>
                                                    <pre className="bg-dark-tertiary p-3 rounded text-red-300 text-xs font-mono overflow-x-auto">
                                                        {submissionResult.compile_error}
                                                    </pre>
                                                </div>
                                            )}

                                            {submissionResult.stdout && (
                                                <div>
                                                    <div className="text-green-400 font-semibold mb-2 text-sm">Output:</div>
                                                    <pre className="bg-dark-tertiary p-3 rounded text-green-300 text-xs font-mono overflow-x-auto">
                                                        {submissionResult.stdout}
                                                    </pre>
                                                </div>
                                            )}

                                            {submissionResult.stderr && (
                                                <div>
                                                    <div className="text-yellow-400 font-semibold mb-2 text-sm">Error:</div>
                                                    <pre className="bg-dark-tertiary p-3 rounded text-yellow-300 text-xs font-mono overflow-x-auto">
                                                        {submissionResult.stderr}
                                                    </pre>
                                                </div>
                                            )}

                                            {submissionResult.status === 'ACCEPTED' && (
                                                <div className="flex gap-4 text-sm text-gray-400">
                                                    <div>Runtime: <span className="text-gray-300">{submissionResult.executionTime}ms</span></div>
                                                    <div>Memory: <span className="text-gray-300">{(submissionResult.memoryUsed / 1024).toFixed(2)}MB</span></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm text-center py-8">
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
