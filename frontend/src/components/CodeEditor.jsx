import { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

const CodeEditor = ({ code, onChange, language, onCursorChange }) => {
    const { theme } = useTheme();
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';
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
        // Force theme after mount
        monaco.editor.setTheme(monacoTheme);

        editor.updateOptions({
            theme: monacoTheme
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
        <div className="h-full rounded-xl overflow-hidden shadow-inner" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
            <Editor
                height="100%"
                language={language}
                value={code}
                onChange={onChange}
                theme={monacoTheme}
                options={{
                    ...editorOptions,
                    padding: { top: 16, bottom: 16 },
                }}
                beforeMount={(monaco) => {
                    monaco.editor.setTheme(monacoTheme);
                }}
                onMount={handleEditorDidMount}
            />
        </div>
    );
};

export default CodeEditor;
