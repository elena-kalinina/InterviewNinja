import { useState, useMemo, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { BookOpen, PenTool, Copy, Check } from 'lucide-react';
import ChatPanel from '../shared/ChatPanel';

// Common ML formulas for quick insert
const FORMULA_SNIPPETS = [
  { name: 'MSE Loss', formula: 'L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2' },
  { name: 'Cross Entropy', formula: 'L = -\\sum_{i=1}^{n} y_i \\log(\\hat{y}_i)' },
  { name: 'Softmax', formula: '\\sigma(z)_i = \\frac{e^{z_i}}{\\sum_{j=1}^{K} e^{z_j}}' },
  { name: 'Sigmoid', formula: '\\sigma(x) = \\frac{1}{1 + e^{-x}}' },
  { name: 'ReLU', formula: 'f(x) = \\max(0, x)' },
  { name: 'Attention', formula: 'Attention(Q,K,V) = softmax\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V' },
  { name: 'Gradient Descent', formula: '\\theta_{t+1} = \\theta_t - \\eta \\nabla L(\\theta_t)' },
  { name: 'Adam Update', formula: 'm_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t' },
  { name: 'Bayes Theorem', formula: 'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}' },
  { name: 'KL Divergence', formula: 'D_{KL}(P||Q) = \\sum_{x} P(x) \\log\\frac{P(x)}{Q(x)}' },
];

// Component to render KaTeX
function MathRenderer({ math, displayMode = false }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(math, ref.current, {
          displayMode,
          throwOnError: false,
        });
      } catch (e) {
        ref.current.textContent = math;
      }
    }
  }, [math, displayMode]);
  
  return <span ref={ref} />;
}

export default function MLTheoryTab({ voiceAgent }) {
  const [formulaInput, setFormulaInput] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Clear any context provider from other tabs when switching to ML Theory
  // (formulas are for self-checking, interviewer focuses on verbal explanations)
  useEffect(() => {
    voiceAgent.clearContextProvider();
  }, [voiceAgent.clearContextProvider]);

  // Parse notes for LaTeX formulas
  const renderedNotes = useMemo(() => {
    if (!notes) return null;
    
    // Split by $$ for block math and $ for inline math
    const parts = notes.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/);
    
    return parts.map((part, idx) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        return (
          <div key={idx} className="my-4">
            <MathRenderer math={formula} displayMode={true} />
          </div>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        return <MathRenderer key={idx} math={formula} displayMode={false} />;
      }
      return <span key={idx}>{part}</span>;
    });
  }, [notes]);

  const handleCopyFormula = (formula, idx) => {
    navigator.clipboard.writeText(`$${formula}$`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleInsertFormula = (formula) => {
    setNotes((prev) => prev + `$$${formula}$$\n`);
  };

  return (
    <div className="h-full flex gap-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Formula Preview */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <PenTool className="w-4 h-4 text-electric-400" />
            <h3 className="text-sm font-semibold text-gray-400">Formula Preview</h3>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={formulaInput}
              onChange={(e) => setFormulaInput(e.target.value)}
              placeholder="Type LaTeX formula (e.g., x^2 + y^2 = z^2)"
              className="input-field flex-1 font-mono text-sm"
            />
            <button
              onClick={() => handleInsertFormula(formulaInput)}
              disabled={!formulaInput}
              className="btn-primary px-4 disabled:opacity-50"
            >
              Insert
            </button>
          </div>
          {formulaInput && (
            <div className="mt-3 p-4 bg-navy-800 rounded-xl text-center text-white">
              <MathRenderer math={formulaInput} displayMode={true} />
            </div>
          )}
        </div>

        {/* Notes Area */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Input */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Notes (use $...$ for inline, $$...$$ for block)</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Write your notes here...\n\nUse $formula$ for inline math\nUse $$formula$$ for block math\n\nExample:\nThe loss function is $$L = -\\sum y \\log(\\hat{y})$$`}
              className="flex-1 input-field resize-none font-mono text-sm"
            />
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col">
            <span className="text-sm text-gray-400 mb-2">Preview</span>
            <div className="flex-1 glass-card-light p-4 overflow-auto">
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-white">
                {renderedNotes || (
                  <span className="text-gray-500 italic">
                    Your formatted notes will appear here...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formula Snippets */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-electric-400" />
            <h3 className="text-sm font-semibold text-gray-400">Common Formulas</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {FORMULA_SNIPPETS.map((snippet, idx) => (
              <button
                key={idx}
                onClick={() => handleCopyFormula(snippet.formula, idx)}
                className="group p-2 bg-navy-800 hover:bg-navy-700 rounded-lg text-left transition-colors relative"
              >
                <div className="text-xs text-gray-400 mb-1">{snippet.name}</div>
                <div className="text-xs font-mono text-electric-300 truncate overflow-hidden">
                  <MathRenderer math={snippet.formula} displayMode={false} />
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedIdx === idx ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-96">
        <ChatPanel 
          messages={voiceAgent.messages}
          onSendMessage={voiceAgent.sendResponse}
          isLoading={voiceAgent.isLoading}
          disabled={!voiceAgent.isSessionActive}
        />
      </div>
    </div>
  );
}
