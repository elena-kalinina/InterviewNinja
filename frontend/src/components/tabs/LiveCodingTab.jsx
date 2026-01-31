import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Loader2, Terminal, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import ChatPanel from '../shared/ChatPanel';

const DEFAULT_CODE = `# Write your solution here
def solution():
    pass

# Test your code
if __name__ == "__main__":
    result = solution()
    print(result)
`;

export default function LiveCodingTab({ voiceAgent }) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState('python');
  const [showChat, setShowChat] = useState(true);
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');

    try {
      const result = await api.executeCode(code, language);
      
      let outputText = '';
      if (result.stdout) {
        outputText += result.stdout;
      }
      if (result.stderr) {
        outputText += '\n' + result.stderr;
      }
      if (!outputText.trim()) {
        outputText = '(No output)';
      }
      
      setOutput(outputText);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(DEFAULT_CODE);
    setOutput('');
  };

  return (
    <div className="h-full flex gap-4">
      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Code Editor</h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-navy-800 text-white text-sm px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-electric-500"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="go">Go</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="btn-primary px-4 py-1.5 text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 editor-container min-h-0" style={{ maxHeight: 'calc(100% - 220px)' }}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="mt-4 glass-card-light flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-navy-800/50">
            <Terminal className="w-5 h-5 text-electric-400" />
            <span className="text-base font-semibold text-white">Output</span>
          </div>
          <pre className="p-4 text-base font-mono text-gray-200 min-h-[120px] max-h-[200px] overflow-auto whitespace-pre-wrap bg-navy-900/50">
            {output || 'Click "Run" to execute your code'}
          </pre>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-96">
          <ChatPanel 
            messages={voiceAgent.messages}
            onSendMessage={voiceAgent.sendResponse}
            isLoading={voiceAgent.isLoading}
            disabled={!voiceAgent.isSessionActive}
          />
        </div>
      )}
    </div>
  );
}
