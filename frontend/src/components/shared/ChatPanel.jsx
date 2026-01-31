import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';

export default function ChatPanel({ 
  messages, 
  onSendMessage, 
  isLoading, 
  disabled,
  fullHeight = false 
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const message = input.trim();
    setInput('');
    
    try {
      await onSendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`glass-card flex flex-col ${fullHeight ? 'h-full' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <MessageSquare className="w-4 h-4 text-electric-400" />
        <span className="text-sm font-semibold text-gray-400">Conversation</span>
        {messages.length > 0 && (
          <span className="text-xs text-gray-500 ml-auto">
            {messages.length} messages
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {disabled 
                ? 'Start an interview to begin the conversation'
                : 'Waiting for conversation to start...'}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`chat-message ${msg.role === 'interviewer' ? 'interviewer' : 'user'}`}
              >
                <div className="text-xs text-white/60 mb-1 capitalize">
                  {msg.role === 'interviewer' ? 'Interviewer' : 'You'}
                  {msg.timestamp && (
                    <span className="ml-2">{formatTimestamp(msg.timestamp)}</span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-message interviewer">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? 'Start interview to chat...' : 'Type your response...'}
            disabled={disabled || isLoading}
            className="input-field flex-1 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || isLoading || !input.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send or use the microphone for voice input
        </p>
      </form>
    </div>
  );
}
