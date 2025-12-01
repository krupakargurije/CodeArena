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
        theme: 'vs-dark',
    };

    return (
        <div className="h-full border border-dark-tertiary rounded-lg overflow-hidden">
            <Editor
                height="100%"
                language={language}
                value={code}
                onChange={onChange}
                theme="vs-dark"
                options={editorOptions}
            />
        </div>
    );
};

export default CodeEditor;
