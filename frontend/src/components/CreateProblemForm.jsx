import { useState } from 'react';
import {
    X,
    Code2,
    Plus,
    Check,
    AlertCircle,
    SlidersHorizontal,
    Sparkles
} from 'lucide-react';
import { createProblem } from '../services/problemService';

const DIFFICULTIES = ['CAKEWALK', 'EASY', 'MEDIUM', 'HARD'];

const CreateProblemForm = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'EASY',
        tags: [],
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        sampleInput: '',
        sampleOutput: '',
        explanation: ''
    });

    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const problemData = {
                title: formData.title,
                description: formData.description,
                difficulty: formData.difficulty,
                tags: formData.tags,
                input_format: formData.inputFormat,
                output_format: formData.outputFormat,
                constraints: formData.constraints,
                sample_input: formData.sampleInput,
                sample_output: formData.sampleOutput,
                explanation: formData.explanation,
                acceptance_rate: 0
            };

            await createProblem(problemData);
            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to create problem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in select-none">
            {/* Backdrop dismiss */}
            <div className="fixed inset-0" onClick={onCancel} />

            {/* macOS Modal Sheet Container */}
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col mac-card shadow-2xl overflow-hidden animate-mac-scale bg-white/95 dark:bg-[#1c1c20]/95 backdrop-blur-2xl">
                {/* macOS Titlebar Header */}
                <div className="px-6 py-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 pr-2">
                            <span onClick={onCancel} className="mac-traffic-dot mac-traffic-close cursor-pointer" title="Cancel" />
                            <span className="mac-traffic-dot mac-traffic-minimize" />
                            <span className="mac-traffic-dot mac-traffic-zoom" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <Code2 size={16} className="text-[#0071e3] dark:text-[#2997ff]" />
                                <span>Create Problem Specification</span>
                            </h2>
                            <p className="text-[11px] text-[#86868b] dark:text-[#a1a1a6]">
                                Author problem statements, constraints, and initial test definitions.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onCancel}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                        aria-label="Close dialog"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                    {/* Title */}
                    <div className="space-y-1">
                        <label className="font-semibold text-[#1d1d1f] dark:text-white">Problem Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Two Sum, Median of Two Sorted Arrays"
                            className="mac-input"
                            required
                        />
                    </div>

                    {/* Difficulty Segmented Control */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[#1d1d1f] dark:text-white">Difficulty Level *</label>
                        <div>
                            <div className="mac-segmented-control">
                                {DIFFICULTIES.map((diff) => (
                                    <button
                                        type="button"
                                        key={diff}
                                        onClick={() => setFormData(prev => ({ ...prev, difficulty: diff }))}
                                        className={`mac-segmented-item ${formData.difficulty === diff ? 'active' : ''}`}
                                    >
                                        {diff.charAt(0) + diff.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="font-semibold text-[#1d1d1f] dark:text-white">Problem Description (Markdown supported) *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the task, rules, and objectives clearly..."
                            className="mac-input min-h-[100px] resize-y"
                            required
                        />
                    </div>

                    {/* Tags Input */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-[#1d1d1f] dark:text-white">Algorithm Tags</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                className="mac-input flex-1"
                                placeholder="Type tag (e.g. Dynamic Programming, Hash Table) and press Enter"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="mac-btn-secondary shrink-0"
                            >
                                <Plus size={13} />
                                <span>Add Tag</span>
                            </button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="mac-badge mac-badge-blue flex items-center gap-1.5 pl-2 pr-1 py-0.5"
                                    >
                                        <span>{tag}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-red-500 rounded p-0.5"
                                        >
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input and Output Format Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="font-semibold text-[#1d1d1f] dark:text-white">Input Format</label>
                            <textarea
                                name="inputFormat"
                                value={formData.inputFormat}
                                onChange={handleChange}
                                placeholder="The first line contains an integer T..."
                                className="mac-input min-h-[70px] resize-y"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-semibold text-[#1d1d1f] dark:text-white">Output Format</label>
                            <textarea
                                name="outputFormat"
                                value={formData.outputFormat}
                                onChange={handleChange}
                                placeholder="Print the single integer representing..."
                                className="mac-input min-h-[70px] resize-y"
                            />
                        </div>
                    </div>

                    {/* Constraints */}
                    <div className="space-y-1">
                        <label className="font-semibold text-[#1d1d1f] dark:text-white">Constraints</label>
                        <textarea
                            name="constraints"
                            value={formData.constraints}
                            onChange={handleChange}
                            placeholder="1 <= N <= 10^5, -10^9 <= A[i] <= 10^9"
                            className="mac-input min-h-[60px] resize-y font-mono text-[11px]"
                        />
                    </div>

                    {/* Sample Input / Output Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="font-semibold text-[#1d1d1f] dark:text-white">Sample Input</label>
                            <textarea
                                name="sampleInput"
                                value={formData.sampleInput}
                                onChange={handleChange}
                                placeholder="4&#10;2 7 11 15&#10;9"
                                className="mac-input min-h-[70px] resize-y font-mono text-[11px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-semibold text-[#1d1d1f] dark:text-white">Sample Output</label>
                            <textarea
                                name="sampleOutput"
                                value={formData.sampleOutput}
                                onChange={handleChange}
                                placeholder="0 1"
                                className="mac-input min-h-[70px] resize-y font-mono text-[11px]"
                            />
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-1">
                        <label className="font-semibold text-[#1d1d1f] dark:text-white">Explanation</label>
                        <textarea
                            name="explanation"
                            value={formData.explanation}
                            onChange={handleChange}
                            placeholder="Because nums[0] + nums[1] == 9, we return [0, 1]."
                            className="mac-input min-h-[60px] resize-y"
                        />
                    </div>

                    {/* Error Feedback */}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mac-btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mac-btn-primary"
                        >
                            {loading ? 'Creating Problem...' : 'Create Problem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProblemForm;
