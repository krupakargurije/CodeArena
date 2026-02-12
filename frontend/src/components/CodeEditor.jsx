import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, onChange, language, onCursorChange }) => {
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

        editor.updateOptions({
            theme: 'vs-dark'
        });

        // Report cursor position changes
        if (onCursorChange) {
            editor.onDidChangeCursorPosition((e) => {
                onCursorChange({ line: e.position.lineNumber, col: e.position.column });
            });
            // Fire initial position
            const pos = editor.getPosition();
            if (pos) onCursorChange({ line: pos.lineNumber, col: pos.column });
        }
    };

    return (
        <div className="h-full border border-white/5 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-inner shadow-black/50">
            <Editor
                height="100%"
                language={language}
                value={code}
                onChange={onChange}
                theme="vs-dark"
                options={{
                    ...editorOptions,
                    padding: { top: 16, bottom: 16 },
                }}
                beforeMount={(monaco) => {
                    monaco.editor.setTheme('vs-dark');
                }}
                onMount={handleEditorDidMount}
            />
        </div>
    );
};

export default CodeEditor;
