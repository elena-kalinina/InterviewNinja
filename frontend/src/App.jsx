import { useState } from 'react';
import { 
  Brain, 
  Code, 
  BookOpen, 
  MessageCircle,
  Sparkles 
} from 'lucide-react';
import SystemDesignTab from './components/tabs/SystemDesignTab';
import LiveCodingTab from './components/tabs/LiveCodingTab';
import MLTheoryTab from './components/tabs/MLTheoryTab';
import CoachingTab from './components/tabs/CoachingTab';
import VoiceControls from './components/controls/VoiceControls';
import SettingsPanel from './components/controls/SettingsPanel';
import AnalysisModal from './components/shared/AnalysisModal';
import { useVoiceAgent } from './hooks/useVoiceAgent';

const TABS = [
  { id: 'system_design', label: 'System Design', icon: Brain },
  { id: 'live_coding', label: 'Live Coding', icon: Code },
  { id: 'ml_theory', label: 'ML Theory', icon: BookOpen },
  { id: 'coaching', label: 'Coaching', icon: MessageCircle },
];

function App() {
  const [activeTab, setActiveTab] = useState('system_design');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  
  const voiceAgent = useVoiceAgent();

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    voiceAgent.updateSettings({ interviewType: tabId });
  };

  const handleAnalyze = async () => {
    try {
      const analysis = await voiceAgent.analyzeSession();
      setAnalysisData(analysis);
      setShowAnalysis(true);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'system_design':
        return <SystemDesignTab voiceAgent={voiceAgent} />;
      case 'live_coding':
        return <LiveCodingTab voiceAgent={voiceAgent} />;
      case 'ml_theory':
        return <MLTheoryTab voiceAgent={voiceAgent} />;
      case 'coaching':
        return <CoachingTab voiceAgent={voiceAgent} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">InterviewNinja</h1>
              <p className="text-xs text-gray-400">ML/AI Interview Preparation</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-2 bg-navy-800/50 p-1.5 rounded-2xl">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-electric-500 text-white shadow-lg shadow-electric-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-navy-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="w-[200px]" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex max-w-[1800px] mx-auto w-full">
        {/* Settings Sidebar */}
        <aside className="w-96 p-4 border-r border-white/10 flex flex-col gap-4">
          <SettingsPanel 
            settings={voiceAgent.settings}
            onSettingsChange={voiceAgent.updateSettings}
            disabled={voiceAgent.isSessionActive}
          />
          
          <VoiceControls
            voiceAgent={voiceAgent}
            onAnalyze={handleAnalyze}
          />
        </aside>

        {/* Tab Content */}
        <section className="flex-1 p-4 overflow-hidden">
          {renderTabContent()}
        </section>
      </main>

      {/* Analysis Modal */}
      {showAnalysis && (
        <AnalysisModal
          analysis={analysisData}
          onClose={() => setShowAnalysis(false)}
        />
      )}

      {/* Error Toast */}
      {voiceAgent.error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span>{voiceAgent.error}</span>
          <button 
            onClick={voiceAgent.clearError}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
