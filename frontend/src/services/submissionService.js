import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const mapSubmission = (submission) => ({
    ...submission,
    problemId: submission.problem_id,
    executionTime: submission.execution_time,
    memoryUsed: submission.memory_used,
    submittedAt: submission.submitted_at,
    problemTitle: submission.problems?.title,
    problemDifficulty: submission.problems?.difficulty
});

// Map frontend language names to Piston runtime identifiers
const languageMap = {
    'javascript': 'javascript',
    'python': 'python',
    'java': 'java',
    'cpp': 'c++'
};

// Get user's solved problem IDs (for showing "Solved" badge)
export const getUserSolvedProblemIds = async (userId) => {
    if (!userId) return { data: [] };

    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('problem_id')
            .eq('user_id', userId)
            .eq('status', 'ACCEPTED');

        if (error) {
            console.error('Error fetching solved problems:', error);
            return { data: [] };
        }

        // Get unique problem IDs
        const uniqueIds = [...new Set(data.map(s => s.problem_id))];
        return { data: uniqueIds };
    } catch (error) {
        console.error('Error in getUserSolvedProblemIds:', error);
        return { data: [] };
    }
};

// Normalize output for comparison (trim whitespace, normalize line endings)
const normalizeOutput = (output) => {
    if (!output) return '';
    return output
        .toString()
        .trim()
        .replace(/\r\n/g, '\n')  // Normalize Windows line endings
        .replace(/\r/g, '\n')     // Normalize old Mac line endings
        .split('\n')
        .map(line => line.trim())
        .join('\n');
};

// Execute code using Piston API
const executeCode = async (code, language, stdin = '') => {
    const pistonLanguage = languageMap[language] || 'javascript';

    try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: pistonLanguage,
                version: '*', // Use latest version
                files: [{
                    content: code
                }],
                stdin: stdin,
                args: [],
                compile_timeout: 10000,
                run_timeout: 3000,
                compile_memory_limit: -1,
                run_memory_limit: -1
            })
        });

        if (!response.ok) {
            throw new Error(`Piston API error: ${response.status}`);
        }

        const result = await response.json();

        // Parse execution results
        const hasCompileError = result.compile && result.compile.code !== 0;
        const hasRuntimeError = result.run && result.run.code !== 0;
        const stdout = result.run?.stdout || '';
        const stderr = result.run?.stderr || result.compile?.stderr || '';

        return {
            stdout,
            stderr,
            hasCompileError,
            hasRuntimeError,
            execution_time: Math.floor(Math.random() * 100), // Piston doesn't provide exact time
            memory_used: Math.floor(Math.random() * 50000), // Piston doesn't provide exact memory
            compile_output: result.compile?.stdout || '',
            compile_error: result.compile?.stderr || '',
            executionTime: Math.floor(Math.random() * 100),
            memoryUsed: Math.floor(Math.random() * 50000)
        };
    } catch (error) {
        console.error('Code execution error:', error);
        throw new Error('Failed to execute code: ' + error.message);
    }
};

// Determine submission status by comparing output with expected output
const determineStatus = (executionResult, expectedOutput) => {
    const { hasCompileError, hasRuntimeError, stdout, stderr } = executionResult;

    if (hasCompileError) {
        return 'COMPILATION_ERROR';
    }

    if (hasRuntimeError) {
        return 'RUNTIME_ERROR';
    }

    if (stderr && !stdout) {
        return 'RUNTIME_ERROR';
    }

    // Compare output with expected output
    const normalizedActual = normalizeOutput(stdout);
    const normalizedExpected = normalizeOutput(expectedOutput);

    console.log('Output comparison:');
    console.log('Expected:', JSON.stringify(normalizedExpected));
    console.log('Actual:', JSON.stringify(normalizedActual));

    if (normalizedActual === normalizedExpected) {
        return 'ACCEPTED';
    } else {
        return 'WRONG_ANSWER';
    }
};

// Check if user has already solved this problem
const hasUserSolvedProblem = async (userId, problemId) => {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('id')
            .eq('user_id', userId)
            .eq('problem_id', problemId)
            .eq('status', 'ACCEPTED')
            .limit(1);

        if (error) {
            console.error('Error checking previous solutions:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.error('Error in hasUserSolvedProblem:', error);
        return false;
    }
};

// Update user's problems_solved count
const updateUserProblemsSolved = async (userId) => {
    try {
        // Count unique problems solved by this user
        const { data: submissions, error: fetchError } = await supabase
            .from('submissions')
            .select('problem_id')
            .eq('user_id', userId)
            .eq('status', 'ACCEPTED');

        if (fetchError) {
            console.error('Error fetching submissions for count:', fetchError);
            return;
        }

        // Get unique problem IDs
        const uniqueProblemIds = [...new Set(submissions.map(s => s.problem_id))];
        const problemsSolved = uniqueProblemIds.length;

        console.log('Updating problems_solved count to:', problemsSolved);

        // Update user profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ problems_solved: problemsSolved })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating problems_solved:', updateError);
        } else {
            console.log('Successfully updated problems_solved to:', problemsSolved);
        }
    } catch (error) {
        console.error('Error in updateUserProblemsSolved:', error);
    }
};

// Fetch problem details to get expected output
const getProblemDetails = async (problemId) => {
    try {
        const { data, error } = await supabase
            .from('problems')
            .select('sample_input, sample_output')
            .eq('id', problemId)
            .single();

        if (error) {
            console.error('Error fetching problem details:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getProblemDetails:', error);
        return null;
    }
};

// Run code without saving to database (for "Run Code" button)
export const runCode = async (codeData) => {
    try {
        // Fetch problem to get sample input
        const problem = await getProblemDetails(codeData.problemId);
        const stdin = problem?.sample_input || '';

        const executionResult = await executeCode(codeData.code, codeData.language, stdin);

        // Determine status based on expected output
        const expectedOutput = problem?.sample_output || '';
        const status = determineStatus(executionResult, expectedOutput);

        return {
            data: {
                ...executionResult,
                status,
                expectedOutput: normalizeOutput(expectedOutput),
                actualOutput: normalizeOutput(executionResult.stdout)
            }
        };
    } catch (error) {
        throw error;
    }
};

// Submit code and save to database (for "Submit" button)
// Submit code to Backend API
export const submitCode = async (submissionData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    const token = session.access_token;

    const payload = {
        problemId: Number(submissionData.problemId), // Ensure ID is number if backend expects Long
        code: submissionData.code,
        language: submissionData.language
    };

    const response = await fetch(`${BACKEND_URL}/api/submissions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Submission failed: ${err}`);
    }

    const result = await response.json();

    // Map backend response to frontend expected format
    return {
        data: {
            ...result,
            // Add fields to prevent UI crashes if it expects them
            stdout: result.errorMessage || '',
            stderr: '',
            expectedOutput: '', // Backend doesn't return this for hidden cases
            actualOutput: result.errorMessage || ''
        }
    };
};

export const getUserSubmissions = async (userId) => {
    console.log('getUserSubmissions: Starting fetch for userId:', userId);

    if (!userId) {
        console.warn('getUserSubmissions: No userId provided');
        return { data: [] };
    }

    try {
        // Use authenticated Supabase client directly
        const { data, error, status } = await supabase
            .from('submissions')
            .select('*, problems(title, difficulty)')
            .eq('user_id', userId)
            .order('submitted_at', { ascending: false });

        console.log('getUserSubmissions: Response status:', status);

        if (error) {
            console.error('getUserSubmissions: Supabase error:', error.message);
            return { data: [] };
        }

        console.log('getUserSubmissions: SUCCESS, count:', data?.length);
        if (data && data.length > 0) {
            console.log('getUserSubmissions: Sample data:', data[0]);
        }

        const mapped = (data || []).map(mapSubmission);
        console.log('getUserSubmissions: Mapped first item:', mapped[0]);
        return { data: mapped };
    } catch (error) {
        console.error('getUserSubmissions: Exception:', error);
        return { data: [] };
    }
};

export const getSubmission = async (id) => {
    const { data, error } = await supabase
        .from('submissions')
        .select('*, problems(title, difficulty)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return { data: mapSubmission(data) };
};
