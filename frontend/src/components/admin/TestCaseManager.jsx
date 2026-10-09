import { useState, useEffect } from 'react';
import {
    X,
    FolderArchive,
    Upload,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    FileCode,
    Sparkles,
    Check
} from 'lucide-react';
import { updateProblem } from '../../services/problemService';
import { formatInputType } from '../../utils/testCaseFormatter';
import { supabase } from '../../services/supabaseClient';
import JSZip from 'jszip';

const TestCaseManager = ({ problem, onClose }) => {
    const [testCases, setTestCases] = useState([]);
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

            const response = await fetch(problem.testCasesUrl);
            if (!response.ok) {
                setTestCases([]);
                return;
            }

            const blob = await response.blob();
            const zip = await JSZip.loadAsync(blob);

            const inputs = {};
            const outputs = {};
            const sampleFlags = {};

            for (const [filename, file] of Object.entries(zip.files)) {
                if (file.dir) continue;
                let name = filename;
                if (name.includes('/')) name = name.substring(name.lastIndexOf('/') + 1);

                const content = await file.async('string');
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

    const uploadZip = async (cases) => {
        setSyncingZip(true);
        setSuccessMessage('');
        try {
            const zip = new JSZip();
            cases.forEach((tc, index) => {
                const num = index + 1;
                const prefix = tc.isSample ? `sample_${num}` : `${num}`;
                zip.file(`${prefix}.in`, tc.input);
                zip.file(`${prefix}.out`, tc.expectedOutput);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const { error: uploadError } = await supabase.storage
                .from('problem-test-cases')
                .upload(ZIP_PATH, zipBlob, {
                    contentType: 'application/zip',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('problem-test-cases')
                .getPublicUrl(ZIP_PATH);

            const testCasesUrl = urlData.publicUrl;
            await updateProblem(problem.id, { ...problem, testCasesUrl });
            setSuccessMessage(`Test cases synchronized (${cases.length} files in ZIP)`);
        } catch (err) {
            console.error('Failed to upload test case ZIP:', err);
            setError(err.message || 'Failed to sync test cases');
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
        setError('');
        setSuccessMessage('');

        if (!formData.input.trim() || !formData.expectedOutput.trim()) {
            setError('Both input and expected output are required');
            return;
        }

        setAdding(true);
        try {
            const formattedInput = formatInputType(formData.input, formData.inputType);
            const formattedOutput = formatInputType(formData.expectedOutput, formData.outputType);

            const newCase = {
                id: String(testCases.length + 1),
                input: formattedInput,
                expectedOutput: formattedOutput,
                isSample: formData.isSample
            };

            const updatedCases = [...testCases, newCase];
            setTestCases(updatedCases);
            await uploadZip(updatedCases);

            setFormData({
                inputType: 'raw',
                outputType: 'raw',
                input: '',
                expectedOutput: '',
                isSample: false
            });
        } catch (err) {
            setError(err.message || 'Failed to add test case');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (caseId) => {
        if (!confirm('Are you sure you want to delete this test case?')) return;
        setError('');
        setSuccessMessage('');

        try {
            const updatedCases = testCases.filter(tc => tc.id !== caseId);
            const reindexed = updatedCases.map((tc, i) => ({ ...tc, id: String(i + 1) }));
            setTestCases(reindexed);

            if (reindexed.length > 0) {
                await uploadZip(reindexed);
            } else {
                await supabase.storage.from('problem-test-cases').remove([ZIP_PATH]);
                await updateProblem(problem.id, { ...problem, testCasesUrl: null });
                setSuccessMessage('All test cases removed. ZIP deleted.');
            }
        } catch (err) {
            setError(err.message || 'Failed to delete test case');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in select-none">
            {/* Backdrop click to dismiss */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* macOS Modal Sheet Window */}
            <div className="relative w-full max-w-5xl h-[85vh] flex flex-col mac-card shadow-2xl overflow-hidden animate-mac-scale bg-white/95 dark:bg-[#1c1c20]/95 backdrop-blur-2xl">
                {/* Header with macOS Traffic Lights */}
                <div className="px-6 py-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 pr-2">
                            <span onClick={onClose} className="mac-traffic-dot mac-traffic-close cursor-pointer" title="Close" />
                            <span className="mac-traffic-dot mac-traffic-minimize" />
                            <span className="mac-traffic-dot mac-traffic-zoom" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#1d1d1f] dark:text-white">
                                    Test Case Suite
                                </span>
                                <span className="mac-badge mac-badge-blue">
                                    Problem #{problem.id}
                                </span>
                            </div>
                            <div className="text-xs text-[#86868b] dark:text-[#a1a1a6] truncate max-w-md mt-0.5">
                                {problem.title}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                        aria-label="Close test case manager"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Two-Pane Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Form Pane: Add Test Case */}
                    <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-black/[0.08] dark:border-white/[0.08] overflow-y-auto space-y-4">
                        {/* Auto-Sync Banner */}
                        <div className="p-3.5 rounded-xl bg-[#0071e3]/10 dark:bg-[#2997ff]/15 border border-[#0071e3]/20 text-xs flex items-start gap-2.5">
                            <FolderArchive size={16} className="text-[#0071e3] dark:text-[#2997ff] shrink-0 mt-0.5" />
                            <div className="text-[#1d1d1f] dark:text-white">
                                <div className="font-semibold text-xs text-[#0071e3] dark:text-[#2997ff]">Supabase Storage ZIP</div>
                                <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5 leading-relaxed">
                                    Test cases are automatically archived and synced to Judge0 cloud storage upon submission.
                                </div>
                            </div>
                        </div>

                        {/* Sync Messages */}
                        {syncingZip && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                                <span>Syncing to ZIP archive...</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                                <CheckCircle2 size={14} className="shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}
                        {error && (
                            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            {/* Input */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-[#1d1d1f] dark:text-white">Input</label>
                                    <select
                                        name="inputType"
                                        value={formData.inputType}
                                        onChange={handleChange}
                                        className="mac-input py-1 px-2 text-[11px] w-44"
                                    >
                                        <option value="raw">Raw Text / Numbers</option>
                                        <option value="array_space">Array [1,2] → Space</option>
                                        <option value="array_newline">Array [1,2] → Newline</option>
                                        <option value="string">String &quot;hello&quot; → hello</option>
                                    </select>
                                </div>
                                <textarea
                                    name="input"
                                    value={formData.input}
                                    onChange={handleChange}
                                    placeholder={formData.inputType.startsWith('array') ? "[1, 2, 3, 4, 5]" : "e.g. 5\n1 2 3 4 5"}
                                    className="mac-input font-mono min-h-[110px] resize-y text-xs"
                                    required
                                />
                            </div>

                            {/* Expected Output */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-[#1d1d1f] dark:text-white">Expected Output</label>
                                    <select
                                        name="outputType"
                                        value={formData.outputType}
                                        onChange={handleChange}
                                        className="mac-input py-1 px-2 text-[11px] w-44"
                                    >
                                        <option value="raw">Raw Text / Numbers</option>
                                        <option value="array_space">Array [1,2] → Space</option>
                                        <option value="array_newline">Array [1,2] → Newline</option>
                                        <option value="string">String &quot;hello&quot; → hello</option>
                                    </select>
                                </div>
                                <textarea
                                    name="expectedOutput"
                                    value={formData.expectedOutput}
                                    onChange={handleChange}
                                    placeholder="e.g. 15"
                                    className="mac-input font-mono min-h-[110px] resize-y text-xs"
                                    required
                                />
                            </div>

                            {/* Sample Flag Switch */}
                            <label className="flex items-center justify-between p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] cursor-pointer">
                                <div>
                                    <div className="font-semibold text-[#1d1d1f] dark:text-white">Mark as Sample Test Case</div>
                                    <div className="text-[11px] text-[#86868b] dark:text-[#636366]">Visible in problem statement & example runner</div>
                                </div>
                                <input
                                    type="checkbox"
                                    name="isSample"
                                    checked={formData.isSample}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] border-gray-400"
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={adding || syncingZip}
                                className="w-full mac-btn-primary"
                            >
                                <Plus size={14} />
                                <span>{adding ? 'Adding...' : syncingZip ? 'Syncing ZIP...' : 'Add Test Case'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Right Pane: Test Cases List */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                            <h3 className="font-bold text-xs text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <FileCode size={15} className="text-[#0071e3] dark:text-[#2997ff]" />
                                <span>Test Cases in Archive ({testCases.length})</span>
                            </h3>
                            {testCases.length > 0 && (
                                <span className="mac-badge mac-badge-green">
                                    ZIP Active
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center text-[#86868b] py-12 text-xs">
                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#0071e3] mb-2" />
                                <div>Reading ZIP files...</div>
                            </div>
                        ) : testCases.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] text-xs text-[#86868b]">
                                <div>No test cases found in ZIP.</div>
                                <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] mt-1">
                                    Add your first test case using the form on the left.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {testCases.map((tc, index) => (
                                    <div
                                        key={tc.id}
                                        className="p-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] relative space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs font-mono text-[#1d1d1f] dark:text-white">
                                                    Case #{index + 1}
                                                </span>
                                                {tc.isSample && (
                                                    <span className="mac-badge mac-badge-purple text-[10px]">
                                                        Sample Case
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleDelete(tc.id)}
                                                className="p-1 rounded text-[#86868b] hover:text-red-500 hover:bg-red-500/10 transition"
                                                title="Delete Test Case"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div className="p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                                                <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                                                    Input:
                                                </div>
                                                <pre className="font-mono text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7] whitespace-pre-wrap max-h-24 overflow-y-auto">
                                                    {tc.input}
                                                </pre>
                                            </div>

                                            <div className="p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                                                <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                                                    Output:
                                                </div>
                                                <pre className="font-mono text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7] whitespace-pre-wrap max-h-24 overflow-y-auto">
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

                {/* Footer */}
                <div className="px-6 py-3 border-t border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between">
                    <span className="text-[11px] text-[#86868b] dark:text-[#636366]">
                        {testCases.length} total test case{testCases.length !== 1 ? 's' : ''} stored in ZIP
                    </span>
                    <button
                        onClick={onClose}
                        className="mac-btn-secondary text-xs"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestCaseManager;
