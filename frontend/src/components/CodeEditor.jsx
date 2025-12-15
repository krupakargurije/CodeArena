import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, onChange, language }) => {
    const editorOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly: false,
        // Force color scheme
        'semanticHighlighting.enabled': true,
    };

    const handleEditorDidMount = (editor, monaco) => {
        // Force dark theme after mount
        monaco.editor.setTheme('vs-dark');

        // Ensure editor updates with dark theme
        editor.updateOptions({
            theme: 'vs-dark'
        });
    };

    return (
        <div className="h-full border border-dark-tertiary rounded-lg overflow-hidden bg-[#1e1e1e]">
            <Editor
                height="100%"
                language={language}
                value={code}
                onChange={onChange}
                theme="vs-dark"
                options={editorOptions}
                beforeMount={(monaco) => {
                    // Ensure dark theme is set before mounting
                    monaco.editor.setTheme('vs-dark');
                }}
                onMount={handleEditorDidMount}
            />
        </div>
    );
};

export default CodeEditor;
