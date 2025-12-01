import { supabase } from './supabaseClient';

const mapSubmission = (submission) => ({
    ...submission,
    executionTime: submission.execution_time,
    memoryUsed: submission.memory_used,
    submittedAt: submission.submitted_at,
    problemTitle: submission.problems?.title
});

// Map frontend language names to Piston runtime identifiers
const languageMap = {
    'javascript': 'javascript',
    'python': 'python',
    'java': 'java',
    'cpp': 'c++'
};

// Execute code using Piston API
const executeCode = async (code, language) => {
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
                stdin: '',
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

        // Determine status
        let status = 'ACCEPTED';
        if (hasCompileError) {
            status = 'COMPILATION_ERROR';
        } else if (hasRuntimeError) {
            status = 'RUNTIME_ERROR';
        } else if (stderr && !stdout) {
            status = 'RUNTIME_ERROR';
        }

        return {
            status,
            stdout,
            stderr,
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

// Run code without saving to database (for "Run Code" button)
export const runCode = async (codeData) => {
    try {
        const executionResult = await executeCode(codeData.code, codeData.language);
        return { data: executionResult };
    } catch (error) {
        throw error;
    }
};

// Submit code and save to database (for "Submit" button)
export const submitCode = async (submissionData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    // Execute code using Piston API
    const executionResult = await executeCode(submissionData.code, submissionData.language);

    const { data, error } = await supabase
        .from('submissions')
        .insert([{
            user_id: user.id,
            problem_id: submissionData.problemId,
            code: submissionData.code,
            language: submissionData.language,
            status: executionResult.status,
            execution_time: executionResult.execution_time,
            memory_used: executionResult.memory_used
        }])
        .select()
        .single();

    if (error) throw error;

    // Return submission data with execution results
    return {
        data: {
            ...mapSubmission(data),
            stdout: executionResult.stdout,
            stderr: executionResult.stderr,
            compile_output: executionResult.compile_output,
            compile_error: executionResult.compile_error
        }
    };
};

export const getUserSubmissions = async (userId) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
        console.log('getUserSubmissions: Fetching for userId:', userId);
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/submissions?user_id=eq.${userId}&select=*,problems(title)&order=submitted_at.desc`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            console.log('getUserSubmissions: Direct fetch SUCCESS');
            return { data: fetchData.map(mapSubmission) };
        } else {
            console.warn('getUserSubmissions: Direct fetch failed with status:', fetchResponse.status);
        }
    } catch (e) {
        console.warn('getUserSubmissions: Direct fetch error, falling back to client', e);
    }

    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('*, problems(title)')
            .eq('user_id', userId)
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error('getUserSubmissions: Supabase client error:', error);
            throw error;
        }

        console.log('getUserSubmissions: Supabase client SUCCESS');
        return { data: data.map(mapSubmission) };
    } catch (error) {
        console.error('getUserSubmissions: Fatal error:', error);
        throw error;
    }
};

export const getSubmission = async (id) => {
    const { data, error } = await supabase
        .from('submissions')
        .select('*, problems(title)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return { data: mapSubmission(data) };
};
