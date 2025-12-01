import { supabase } from './supabaseClient';

const mapProblem = (problem) => ({
    ...problem,
    acceptanceRate: problem.acceptance_rate,
    inputFormat: problem.input_format,
    outputFormat: problem.output_format,
    sampleInput: problem.sample_input,
    sampleOutput: problem.sample_output,
    createdAt: problem.created_at,
});

export const getProblems = async () => {
    console.log('Fetching problems from Supabase...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
        // DEBUG: Try direct fetch to rule out client library issues
        console.log('Attempting direct REST fetch...');
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/problems?select=*`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            console.log('Direct fetch SUCCESS:', fetchData);
            // If direct fetch works, return it
            return { data: fetchData.map(mapProblem) };
        } else {
            console.error('Direct fetch FAILED:', fetchResponse.status, await fetchResponse.text());
        }

        // Fallback to client if fetch fails (or to test client)
        console.log('Attempting Supabase Client query...');
        const { data, error } = await supabase
            .from('problems')
            .select('*')
            .order('id', { ascending: true });

        console.log('Supabase response:', { data, error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return { data: data ? data.map(mapProblem) : [] };
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
};

export const getProblem = async (id) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
        // DEBUG: Try direct fetch
        console.log(`Attempting direct REST fetch for problem ${id}...`);
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/problems?id=eq.${id}&select=*`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData && fetchData.length > 0) {
                console.log('Direct fetch problem SUCCESS');
                return { data: mapProblem(fetchData[0]) };
            }
        }
    } catch (e) {
        console.warn('Direct fetch failed, falling back to client', e);
    }

    const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return { data: mapProblem(data) };
};

export const createProblem = async (problemData) => {
    const { data, error } = await supabase
        .from('problems')
        .insert([problemData])
        .select()
        .single();

    if (error) throw error;
    return { data: mapProblem(data) };
};

export const updateProblem = async (id, problemData) => {
    const { data, error } = await supabase
        .from('problems')
        .update(problemData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return { data: mapProblem(data) };
};

export const deleteProblem = async (id) => {
    const { error } = await supabase
        .from('problems')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
