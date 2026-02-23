import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const mapSubmission = (submission) => ({
    ...submission,
    problemId: submission.problem_id,
    executionTime: submission.execution_time,
    memoryUsed: submission.memory_used,
    failedTestCaseInput: submission.failed_test_case_input ?? submission.failedTestCaseInput,
    expectedOutput: submission.expected_output ?? submission.expectedOutput,
    actualOutput: submission.actual_output ?? submission.actualOutput ?? '',
    submittedAt: submission.submitted_at,
    problemTitle: submission.problems?.title,
    problemDifficulty: submission.problems?.difficulty
});

// Map frontend language names to Judge0 language IDs
const languageMap = {
    'javascript': 63, // JavaScript (Node.js 12.14.0)
    'python': 71,     // Python (3.8.1)
    'java': 62,       // Java (OpenJDK 13.0.1)
    'cpp': 54         // C++ (GCC 9.2.0)
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

// Execute code using Judge0 API
const executeCode = async (code, language, stdin = '') => {
    const languageId = languageMap[language] || 63;

    try {
        // 1. Create Submission
        const createResponse = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin: stdin
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Judge0 API error: ${createResponse.status}`);
        }

        const result = await createResponse.json();

        // Parse execution results from Judge0
        // Judge0 Status IDs: 3 (Accepted), 4 (Wrong Answer), 5 (Time Limit Exceeded), 6 (Compilation Error), 7-12 (Runtime Errors)
        const hasCompileError = result.status?.id === 6;
        const hasRuntimeError = result.status?.id >= 7 && result.status?.id <= 12;

        const stdout = result.stdout || '';
        const stderr = result.stderr || result.compile_output || result.message || '';

        return {
            stdout,
            stderr,
            hasCompileError,
            hasRuntimeError,
            execution_time: parseFloat(result.time || 0) * 1000,
            memory_used: result.memory || 0,
            compile_output: result.compile_output || '',
            compile_error: result.status?.id === 6 ? (result.compile_output || result.message) : '',
            executionTime: parseFloat(result.time || 0) * 1000,
            memoryUsed: result.memory || 0
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
        let testCases = codeData.sampleTestCases || [];

        // Fallback to basic problem sample input if no sample test cases provided
        if (testCases.length === 0) {
            const problem = await getProblemDetails(codeData.problemId);
            if (problem) {
                testCases = [{
                    input: problem.sample_input || '',
                    expectedOutput: problem.sample_output || ''
                }];
            } else {
                testCases = [{ input: '', expectedOutput: '' }];
            }
        }

        // Run all sample test cases concurrently
        const executionPromises = testCases.map(tc =>
            executeCode(codeData.code, codeData.language, tc.input)
        );

        const results = await Promise.all(executionPromises);

        let allPassed = true;
        let testCasesPassed = 0;
        let firstFailedCase = null;
        let maxExecutionTime = 0;
        let globalStatus = 'ACCEPTED';
        let compileErrorMsg = null;
        let runtimeErrorMsg = null;

        const testCaseResults = results.map((execResult, index) => {
            const tc = testCases[index];
            const expected = normalizeOutput(tc.expectedOutput);
            const status = determineStatus(execResult, tc.expectedOutput);
            const passed = status === 'ACCEPTED';

            if (passed) testCasesPassed++;
            else allPassed = false;

            if (!passed && !firstFailedCase) {
                firstFailedCase = { ...tc, actualOutput: execResult.stdout };
            }

            if (execResult.executionTime) {
                const time = parseFloat(execResult.executionTime);
                if (time > maxExecutionTime) maxExecutionTime = time;
            }

            if (status === 'COMPILATION_ERROR' && !compileErrorMsg) {
                compileErrorMsg = execResult.stderr;
                globalStatus = 'COMPILATION_ERROR';
            } else if (status === 'RUNTIME_ERROR' && !runtimeErrorMsg) {
                runtimeErrorMsg = execResult.stderr;
                if (globalStatus !== 'COMPILATION_ERROR') globalStatus = 'RUNTIME_ERROR';
            } else if (status !== 'ACCEPTED' && globalStatus === 'ACCEPTED') {
                globalStatus = status; // E.g. WRONG_ANSWER
            }

            return {
                input: tc.input,
                expectedOutput: expected,
                actualOutput: normalizeOutput(execResult.stdout),
                passed,
                status,
                executionTime: execResult.executionTime
            };
        });

        return {
            data: {
                status: globalStatus,
                executionTime: maxExecutionTime.toString(),
                errorMessage: compileErrorMsg || runtimeErrorMsg || null,
                testCasesPassed,
                totalTestCases: testCases.length,
                failedTestCaseInput: firstFailedCase ? firstFailedCase.input : null,
                expectedOutput: firstFailedCase ? normalizeOutput(firstFailedCase.expectedOutput) : null,
                actualOutput: firstFailedCase ? normalizeOutput(firstFailedCase.actualOutput) : null,
                testCaseResults // New field for UI rendering
            }
        };
    } catch (error) {
        throw error;
    }
};

// Submit code and save to database (for "Submit" button)
// Submit code to Backend API (returns PENDING, then polls for result)
export const submitCode = async (submissionData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    const token = session.access_token;

    const payload = {
        problemId: Number(submissionData.problemId),
        code: submissionData.code,
        language: submissionData.language
    };

    // 1. Queue the submission (returns immediately with PENDING status)
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

    const queuedResult = await response.json();
    const submissionId = queuedResult.id;
    console.log('[Submit] Queued as PENDING, id:', submissionId);

    // 2. Poll until the worker finishes processing
    const MAX_POLLS = 60; // 60 * 2s = 2 minutes max wait
    const POLL_INTERVAL = 2000; // 2 seconds

    for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

        const pollResponse = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!pollResponse.ok) continue;

        const result = await pollResponse.json();
        console.log(`[Submit] Poll ${i + 1}: status = ${result.status}`);

        if (result.status !== 'PENDING' && result.status !== 'RUNNING') {
            // Final result received!
            return {
                data: {
                    ...result,
                    failedTestCaseInput: result.failedTestCaseInput ?? null,
                    expectedOutput: result.expectedOutput ?? null,
                    actualOutput: result.actualOutput ?? ''
                }
            };
        }
    }

    // Timeout
    throw new Error('Submission timed out. Please try again.');
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
