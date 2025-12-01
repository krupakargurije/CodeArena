const SubmissionResult = ({ result }) => {
    if (!result) return null;

    const getStatusColor = (status) => {
        const colors = {
            ACCEPTED: 'text-accent-green border-accent-green bg-accent-green/10',
            WRONG_ANSWER: 'text-accent-red border-accent-red bg-accent-red/10',
            TIME_LIMIT_EXCEEDED: 'text-accent-yellow border-accent-yellow bg-accent-yellow/10',
            RUNTIME_ERROR: 'text-accent-red border-accent-red bg-accent-red/10',
            COMPILATION_ERROR: 'text-accent-red border-accent-red bg-accent-red/10',
            RUNNING: 'text-accent-blue border-accent-blue bg-accent-blue/10',
            PENDING: 'text-gray-400 border-gray-400 bg-gray-400/10',
        };
        return colors[status] || colors.PENDING;
    };

    const getStatusIcon = (status) => {
        const icons = {
            ACCEPTED: '✓',
            WRONG_ANSWER: '✗',
            TIME_LIMIT_EXCEEDED: '⏱',
            RUNTIME_ERROR: '⚠',
            COMPILATION_ERROR: '⚠',
            RUNNING: '⟳',
            PENDING: '...',
        };
        return icons[status] || '...';
    };

    return (
        <div className="glass rounded-xl p-6 border border-primary-500/20">
            {/* Status Header */}
            <div className={`flex items-center gap-3 mb-6 p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                <span className="text-2xl">{getStatusIcon(result.status)}</span>
                <div>
                    <h3 className="text-lg font-semibold">
                        {result.status.replace(/_/g, ' ')}
                    </h3>
                    {result.testCasesPassed !== undefined && (
                        <p className="text-sm opacity-80">
                            Test Cases: {result.testCasesPassed}/{result.totalTestCases}
                        </p>
                    )}
                </div>
            </div>

            {/* Metrics */}
            {result.status === 'ACCEPTED' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-dark-tertiary rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Execution Time</p>
                        <p className="text-xl font-semibold text-primary-400">
                            {result.executionTime}ms
                        </p>
                    </div>
                    <div className="bg-dark-tertiary rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Memory Used</p>
                        <p className="text-xl font-semibold text-primary-400">
                            {(result.memoryUsed / 1024).toFixed(2)}MB
                        </p>
                    </div>
                </div>
            )}

            {/* Compilation Error */}
            {result.compile_error && (
                <div className="mb-4">
                    <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                        <span>⚠</span> Compilation Error
                    </h4>
                    <div className="bg-dark-tertiary border border-red-500/30 rounded-lg p-4">
                        <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap overflow-x-auto">
                            {result.compile_error}
                        </pre>
                    </div>
                </div>
            )}

            {/* Standard Output */}
            {result.stdout && (
                <div className="mb-4">
                    <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                        <span>▶</span> Output
                    </h4>
                    <div className="bg-dark-tertiary border border-green-500/30 rounded-lg p-4">
                        <pre className="text-sm font-mono text-green-300 whitespace-pre-wrap overflow-x-auto">
                            {result.stdout}
                        </pre>
                    </div>
                </div>
            )}

            {/* Standard Error */}
            {result.stderr && (
                <div className="mb-4">
                    <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                        <span>⚠</span> Error Output
                    </h4>
                    <div className="bg-dark-tertiary border border-yellow-500/30 rounded-lg p-4">
                        <pre className="text-sm font-mono text-yellow-300 whitespace-pre-wrap overflow-x-auto">
                            {result.stderr}
                        </pre>
                    </div>
                </div>
            )}

            {/* Error Message (legacy) */}
            {result.errorMessage && !result.stderr && !result.compile_error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                    <p className="text-sm font-mono text-red-400">{result.errorMessage}</p>
                </div>
            )}
        </div>
    );
};

export default SubmissionResult;
