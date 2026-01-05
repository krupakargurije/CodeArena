import { useState } from 'react';
import { createProblem } from '../services/problemService';

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
            // Convert camelCase to snake_case for API
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary-500/20">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-dark-bg-secondary/95 backdrop-blur-sm -mx-8 -mt-8 px-8 pt-8 pb-4 z-10">
                    <h2 className="text-2xl font-bold gradient-text">Create New Problem</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            Difficulty *
                        </label>
                        <select
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="CAKEWALK">Cakewalk</option>
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input min-h-[120px]"
                            required
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                className="input flex-1"
                                placeholder="Add a tag and press Enter"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="btn-secondary px-4"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-full text-sm flex items-center gap-2"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-brand-orange/70"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Input/Output Format */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Input Format
                            </label>
                            <textarea
                                name="inputFormat"
                                value={formData.inputFormat}
                                onChange={handleChange}
                                className="input min-h-[80px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Output Format
                            </label>
                            <textarea
                                name="outputFormat"
                                value={formData.outputFormat}
                                onChange={handleChange}
                                className="input min-h-[80px]"
                            />
                        </div>
                    </div>

                    {/* Constraints */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            Constraints
                        </label>
                        <textarea
                            name="constraints"
                            value={formData.constraints}
                            onChange={handleChange}
                            className="input min-h-[80px]"
                        />
                    </div>

                    {/* Sample Input/Output */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Sample Input
                            </label>
                            <textarea
                                name="sampleInput"
                                value={formData.sampleInput}
                                onChange={handleChange}
                                className="input min-h-[80px] font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Sample Output
                            </label>
                            <textarea
                                name="sampleOutput"
                                value={formData.sampleOutput}
                                onChange={handleChange}
                                className="input min-h-[80px] font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            Explanation
                        </label>
                        <textarea
                            name="explanation"
                            value={formData.explanation}
                            onChange={handleChange}
                            className="input min-h-[80px]"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-difficulty-hard/10 border border-difficulty-hard/50 text-difficulty-hard px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? 'Creating...' : 'Create Problem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProblemForm;
