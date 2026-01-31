import ChatPanel from '../shared/ChatPanel';
import { Sparkles, Target, Award, Brain } from 'lucide-react';

const COACHING_TIPS = [
  {
    icon: Target,
    title: 'Be Specific',
    description: 'Share concrete examples from your experience when discussing projects.',
  },
  {
    icon: Brain,
    title: 'Think Aloud',
    description: 'Practice articulating your thought process clearly during technical discussions.',
  },
  {
    icon: Award,
    title: 'Quantify Impact',
    description: 'Use metrics and numbers to demonstrate the impact of your work.',
  },
  {
    icon: Sparkles,
    title: 'Stay Curious',
    description: "Ask clarifying questions - it shows engagement and thorough thinking.",
  },
];

export default function CoachingTab({ voiceAgent }) {
  return (
    <div className="h-full flex gap-4">
      {/* Tips Sidebar */}
      <div className="w-80 space-y-4">
        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Coaching Tips</h3>
          <div className="space-y-4">
            {COACHING_TIPS.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <div key={idx} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-electric-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-electric-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{tip.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{tip.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Session Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className={voiceAgent.isSessionActive ? 'text-green-400' : 'text-gray-500'}>
                {voiceAgent.isSessionActive ? 'Active' : 'Not Started'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Messages</span>
              <span className="text-white">{voiceAgent.messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tone</span>
              <span className="text-white capitalize">{voiceAgent.settings.tone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        <ChatPanel 
          messages={voiceAgent.messages}
          onSendMessage={voiceAgent.sendResponse}
          isLoading={voiceAgent.isLoading}
          disabled={!voiceAgent.isSessionActive}
          fullHeight
        />
      </div>
    </div>
  );
}
