import { useState } from 'react';
import DrawingCanvas from '../canvas/DrawingCanvas';
import ChatPanel from '../shared/ChatPanel';

export default function SystemDesignTab({ voiceAgent }) {
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="h-full flex gap-4">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">System Design Canvas</h2>
          <button
            onClick={() => setShowChat(!showChat)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>
        <div className="flex-1 glass-card overflow-hidden">
          <DrawingCanvas />
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
