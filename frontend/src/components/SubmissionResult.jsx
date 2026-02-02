const SubmissionResult = ({ result }) => {
    if (!result) return null;

    const getStatusStyles = (status) => {
        const styles = {
            ACCEPTED: {
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20',
                icon: '✓'
            },
            WRONG_ANSWER: {
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                icon: '✗'
            },
            TIME_LIMIT_EXCEEDED: {
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/20',
                icon: '⏱'
            },
            RUNTIME_ERROR: {
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                icon: '⚠'
            },
            COMPILATION_ERROR: {
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                icon: '⚠'
            },
            RUNNING: {
                color: 'text-brand-blue',
                bg: 'bg-brand-blue/10',
                border: 'border-brand-blue/20',
                icon: '⟳'
            },
            PENDING: {
                color: 'text-dark-text-tertiary',
                bg: 'bg-white/5',
                border: 'border-white/10',
                icon: '...'
            },
        };
        return styles[status] || styles.PENDING;
    };

    const statusStyle = getStatusStyles(result.status);

    return (
        <div className="glass-panel rounded-xl p-6 border border-white/5 shadow-xl animate-fade-in">
            {/* Status Header */}
            <div className={`flex items-center gap-4 mb-6 p-5 rounded-xl border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.color}`}>
                <span className="text-3xl font-bold">{statusStyle.icon}</span>
                <div>
                    <h3 className="text-lg font-bold tracking-tight uppercase">
                        {result.status.replace(/_/g, ' ')}
                    </h3>
                    {result.testCasesPassed !== undefined && (
                        <p className="text-sm opacity-80 font-mono mt-1">
                            Passed: <span className="font-bold">{result.testCasesPassed}</span> / {result.totalTestCases} Test Cases
                        </p>
                    )}
                </div>
            </div>

            {/* Metrics */}
            {result.status === 'ACCEPTED' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-dark-bg-tertiary/50 border border-white/5 rounded-xl p-4">
                        <p className="text-dark-text-tertiary text-xs font-semibold uppercase mb-1">Execution Time</p>
                        <p className="text-xl font-mono font-bold text-white">
                            {result.executionTime}ms
                        </p>
                    </div>
                    <div className="bg-dark-bg-tertiary/50 border border-white/5 rounded-xl p-4">
                        <p className="text-dark-text-tertiary text-xs font-semibold uppercase mb-1">Memory Used</p>
                        <p className="text-xl font-mono font-bold text-white">
                            {(result.memoryUsed / 1024).toFixed(2)}MB
                        </p>
                    </div>
                </div>
            )}

            {/* Compilation Error */}
            {result.compile_error && (
                <div className="mb-6 animate-slide-up">
                    <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <span>⚠</span> Compilation Error
                    </h4>
                    <div className="bg-[#1e1e1e] border border-red-500/20 rounded-xl p-4 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                        <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {result.compile_error}
                        </pre>
                    </div>
                </div>
            )}

            {/* Standard Output */}
            {result.stdout && (
                <div className="mb-6 animate-slide-up">
                    <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <span>▶</span> Output
                    </h4>
                    <div className="bg-[#1e1e1e] border border-green-500/20 rounded-xl p-4 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
                        <pre className="text-sm font-mono text-green-300 whitespace-pre-wrap overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {result.stdout}
                        </pre>
                    </div>
                </div>
            )}

            {/* Standard Error */}
            {result.stderr && (
                <div className="mb-6 animate-slide-up">
                    <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <span>⚠</span> Error Output
                    </h4>
                    <div className="bg-[#1e1e1e] border border-yellow-500/20 rounded-xl p-4 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50"></div>
                        <pre className="text-sm font-mono text-yellow-300 whitespace-pre-wrap overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {result.stderr}
                        </pre>
                    </div>
                </div>
            )}

            {/* Error Message (legacy) */}
            {result.errorMessage && !result.stderr && !result.compile_error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4 animate-slide-up">
                    <p className="text-sm font-mono text-red-400 whitespace-pre-wrap">{result.errorMessage}</p>
                </div>
            )}
        </div>
    );
};

export default SubmissionResult;
