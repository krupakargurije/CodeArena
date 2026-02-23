import { useState, useEffect } from 'react';
import { updateProblem } from '../../services/problemService';
import { formatInputType } from '../../utils/testCaseFormatter';
import { supabase } from '../../services/supabaseClient';
import JSZip from 'jszip';

const TestCaseManager = ({ problem, onClose }) => {
    const [testCases, setTestCases] = useState([]); // In-memory list from ZIP
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [syncingZip, setSyncingZip] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        inputType: 'raw',
        outputType: 'raw',
        input: '',
        expectedOutput: '',
        isSample: false
    });

    const ZIP_PATH = `${problem.id}/testcases.zip`;

    // Load test cases from existing ZIP on mount
    useEffect(() => {
        loadFromZip();
    }, [problem.id]);

    const loadFromZip = async () => {
        setLoading(true);
        try {
            if (!problem.testCasesUrl) {
                setTestCases([]);
                return;
            }

            // Download the existing ZIP
            const response = await fetch(problem.testCasesUrl);
            if (!response.ok) {
                setTestCases([]);
                return;
            }

            const blob = await response.blob();
            const zip = await JSZip.loadAsync(blob);

            // Extract .in/.out pairs
            const inputs = {};
            const outputs = {};

            const sampleFlags = {};

            for (const [filename, file] of Object.entries(zip.files)) {
                if (file.dir) continue;
                let name = filename;
                if (name.includes('/')) name = name.substring(name.lastIndexOf('/') + 1);

                const content = await file.async('string');
                // Detect sample_ prefix
                const isSample = name.startsWith('sample_');
                const cleanName = isSample ? name.replace('sample_', '') : name;

                if (cleanName.endsWith('.in')) {
                    const key = cleanName.slice(0, -3);
                    inputs[key] = content;
                    sampleFlags[key] = isSample;
                } else if (cleanName.endsWith('.out')) {
                    const key = cleanName.slice(0, -4);
                    outputs[key] = content;
                }
            }

            // Build test case list
            const cases = Object.keys(inputs)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(key => ({
                    id: key,
                    input: inputs[key] || '',
                    expectedOutput: outputs[key] || '',
                    isSample: sampleFlags[key] || false
                }));

            setTestCases(cases);
        } catch (err) {
            console.error('Failed to load ZIP:', err);
            setTestCases([]);
        } finally {
            setLoading(false);
        }
    };

    // Upload the current test cases list as a ZIP
    const uploadZip = async (cases) => {
        setSyncingZip(true);
        setSuccessMessage('');
        try {
            const zip = new JSZip();
            cases.forEach((tc, index) => {
                const num = index + 1;
                const prefix = tc.isSample ? 'sample_' : '';
                zip.file(`${prefix}${num}.in`, tc.input || '');
                zip.file(`${prefix}${num}.out`, tc.expectedOutput || '');
            });

            const blob = await zip.generateAsync({ type: 'blob' });

            const { error: uploadError } = await supabase.storage
                .from('problem-test-cases')
                .upload(ZIP_PATH, blob, {
                    cacheControl: '0',
                    upsert: true,
                    contentType: 'application/zip'
                });

            if (uploadError) throw uploadError;

            // Get public URL and update problem
            const { data: { publicUrl } } = supabase.storage
                .from('problem-test-cases')
                .getPublicUrl(ZIP_PATH);

            // Find sample test cases to update problem's sample fields
            const sampleCase = cases.find(tc => tc.isSample);

            await updateProblem(problem.id, {
                ...problem,
                testCasesUrl: publicUrl,
                sampleInput: sampleCase ? sampleCase.input : problem.sampleInput,
                sampleOutput: sampleCase ? sampleCase.expectedOutput : problem.sampleOutput
            });

            setSuccessMessage(`✅ ZIP synced — ${cases.length} test case(s)`);
        } catch (err) {
            console.error('ZIP sync error:', err);
            setError('Failed to sync ZIP: ' + (err.message || err));
        } finally {
            setSyncingZip(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAdding(true);
        setError('');

        try {
            const newCase = {
                id: String(testCases.length + 1),
                input: formatInputType(formData.input, formData.inputType),
                expectedOutput: formatInputType(formData.expectedOutput, formData.outputType),
                isSample: formData.isSample
            };

            const updatedCases = [...testCases, newCase];
            setTestCases(updatedCases);
            await uploadZip(updatedCases);

            setFormData({ inputType: 'raw', outputType: 'raw', input: '', expectedOutput: '', isSample: false });
        } catch (err) {
            setError(err.message || 'Failed to add test case');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (caseId) => {
        if (!window.confirm('Are you sure you want to delete this test case?')) return;

        setError('');
        try {
            const updatedCases = testCases.filter(tc => tc.id !== caseId);
            // Re-index
            const reindexed = updatedCases.map((tc, i) => ({ ...tc, id: String(i + 1) }));
            setTestCases(reindexed);

            if (reindexed.length > 0) {
                await uploadZip(reindexed);
            } else {
                // No test cases left — remove ZIP
                await supabase.storage.from('problem-test-cases').remove([ZIP_PATH]);
                await updateProblem(problem.id, { ...problem, testCasesUrl: null });
                setSuccessMessage('All test cases removed. ZIP deleted.');
            }
        } catch (err) {
            setError(err.message || 'Failed to delete test case');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl flex flex-col max-w-5xl w-full h-[90vh] border border-primary-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b dark:border-dark-border-primary border-light-border-primary bg-dark-bg-secondary/50">
                    <div>
                        <h2 className="text-2xl font-bold gradient-text">Manage Test Cases</h2>
                        <p className="text-secondary mt-1">
                            Problem: <span className="text-primary font-medium">{problem.title}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/5"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Pane - Add Test Case Form */}
                    <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r dark:border-dark-border-primary border-light-border-primary overflow-y-auto bg-dark-bg-primary/50">
                        {/* Info */}
                        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="text-blue-400 font-semibold mb-1">Auto-Sync to ZIP</h4>
                                    <p className="text-secondary">Test cases are stored directly in a ZIP file on Supabase Storage. No database table used. Add or remove test cases below.</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {syncingZip && (
                            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Syncing to ZIP...
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                                {successMessage}
                            </div>
                        )}
                        {testCases.length > 0 && !syncingZip && (
                            <div className="mb-4 text-xs bg-green-500/10 text-green-400 p-2 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                ZIP active — {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-primary">Input</label>
                                    <select
                                        name="inputType"
                                        value={formData.inputType}
                                        onChange={handleChange}
                                        className="text-xs bg-dark-bg-tertiary border border-white/10 rounded-lg px-2 py-1 text-secondary focus:ring-1 focus:ring-brand-blue/50"
                                    >
                                        <option value="raw">Raw Text / Numbers</option>
                                        <option value="array_space">Array [1,2] -{'>'} Space Separated</option>
                                        <option value="array_newline">Array [1,2] -{'>'} Newline Separated</option>
                                        <option value="string">String "hello" -{'>'} hello</option>
                                    </select>
                                </div>
                                <textarea
                                    name="input"
                                    value={formData.input}
                                    onChange={handleChange}
                                    placeholder={formData.inputType.startsWith('array') ? "e.g. [1, 2, 3, 4, 5]" : formData.inputType === 'string' ? 'e.g. "hello world"' : "e.g. 5\n1 2 3 4 5"}
                                    className="input font-mono min-h-[150px] resize-y"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-primary">Expected Output</label>
                                    <select
                                        name="outputType"
                                        value={formData.outputType}
                                        onChange={handleChange}
                                        className="text-xs bg-dark-bg-tertiary border border-white/10 rounded-lg px-2 py-1 text-secondary focus:ring-1 focus:ring-brand-blue/50"
                                    >
                                        <option value="raw">Raw Text / Numbers</option>
                                        <option value="array_space">Array [1,2] -{'>'} Space Separated</option>
                                        <option value="array_newline">Array [1,2] -{'>'} Newline Separated</option>
                                        <option value="string">String "hello" -{'>'} hello</option>
                                    </select>
                                </div>
                                <textarea
                                    name="expectedOutput"
                                    value={formData.expectedOutput}
                                    onChange={handleChange}
                                    placeholder={formData.outputType.startsWith('array') ? "e.g. [1, 2, 3, 4, 5]" : formData.outputType === 'string' ? 'e.g. "hello world"' : "e.g. 15"}
                                    className="input font-mono min-h-[150px] resize-y"
                                    required
                                />
                            </div>

                            <label className="flex items-center gap-3 p-3 rounded-lg border dark:border-dark-border-primary border-light-border-primary bg-dark-bg-secondary/30 cursor-pointer hover:bg-dark-bg-secondary/50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="isSample"
                                    checked={formData.isSample}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-600 text-brand-orange focus:ring-brand-orange bg-dark-bg-primary"
                                />
                                <span className="text-primary font-medium select-none">Mark as Sample Test Case</span>
                            </label>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={adding || syncingZip}
                                className="w-full btn-primary disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : syncingZip ? 'Syncing ZIP...' : 'Add Test Case'}
                            </button>
                        </form>
                    </div>

                    {/* Right Pane - Test Cases List */}
                    <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                        <h3 className="text-lg font-bold text-primary mb-6 flex items-center justify-between">
                            <span>Test Cases (from ZIP)</span>
                            <span className="text-sm font-normal px-2.5 py-1 rounded-full bg-dark-bg-secondary border dark:border-dark-border-primary border-light-border-primary text-secondary">
                                Total: {testCases.length}
                            </span>
                        </h3>

                        {loading ? (
                            <div className="text-center text-secondary py-8">Loading from ZIP...</div>
                        ) : testCases.length === 0 ? (
                            <div className="text-center py-12 rounded-xl border border-dashed dark:border-dark-border-primary border-light-border-primary bg-dark-bg-secondary/30">
                                <p className="text-secondary">No test cases yet.</p>
                                <p className="text-sm text-gray-500 mt-2">Add your first test case using the form.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {testCases.map((tc, index) => (
                                    <div key={tc.id} className="p-5 rounded-xl border dark:border-dark-border-primary border-light-border-primary bg-dark-bg-secondary/30 hover:bg-dark-bg-secondary/50 transition-colors relative group">
                                        <div className="absolute top-4 right-4 flex items-center gap-3">
                                            {tc.isSample && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-brand-orange/20 text-brand-orange font-medium">
                                                    Sample
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleDelete(tc.id)}
                                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                                title="Delete Test Case"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <h4 className="text-primary font-medium mb-3">Test Case #{index + 1}</h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-secondary mb-1">Input:</div>
                                                <pre className="text-sm font-mono p-3 rounded bg-dark-bg-primary border dark:border-dark-border-primary border-light-border-primary text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                                                    {tc.input}
                                                </pre>
                                            </div>
                                            <div>
                                                <div className="text-xs text-secondary mb-1">Expected Output:</div>
                                                <pre className="text-sm font-mono p-3 rounded bg-dark-bg-primary border dark:border-dark-border-primary border-light-border-primary text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                                                    {tc.expectedOutput}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCaseManager;
