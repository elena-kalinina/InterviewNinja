import { useState } from 'react';
import { Settings, Link, FileText, Shuffle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const VERBOSITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'adversarial', label: 'Adversarial' },
];

const SOURCE_OPTIONS = [
  { value: 'random', label: 'Random', icon: Shuffle },
  { value: 'description', label: 'Description', icon: FileText },
  { value: 'url', label: 'URL', icon: Link },
];

export default function SettingsPanel({ settings, onSettingsChange, disabled }) {
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);
  const [scrapedProblems, setScrapedProblems] = useState([]);

  const handleScrapeUrl = async () => {
    if (!settings.problemUrl) return;
    
    setIsScrapingUrl(true);
    setScrapeError(null);
    
    try {
      const result = await api.scrapeUrl(settings.problemUrl);
      setScrapedProblems(result.problems || []);
      
      // Auto-select first problem if available
      if (result.problems?.length > 0) {
        const firstProblem = result.problems[0];
        onSettingsChange({
          problemDescription: `${firstProblem.name}\n\n${firstProblem.content}`,
        });
      }
    } catch (err) {
      setScrapeError(err.message);
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleProblemSelect = (problem) => {
    onSettingsChange({
      problemDescription: `${problem.name}\n\n${problem.content}`,
    });
  };

  return (
    <div className="glass-card p-4 space-y-5">
      <div className="flex items-center gap-2 text-gray-400">
        <Settings className="w-4 h-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Interview Settings
        </h3>
      </div>

      {/* Verbosity */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Verbosity</label>
        <div className="toggle-group">
          {VERBOSITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSettingsChange({ verbosity: option.value })}
              disabled={disabled}
              className={`toggle-option flex-1 ${
                settings.verbosity === option.value ? 'selected' : ''
              } disabled:opacity-50`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Interviewer Tone</label>
        <div className="toggle-group">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSettingsChange({ tone: option.value })}
              disabled={disabled}
              className={`toggle-option flex-1 ${
                settings.tone === option.value ? 'selected' : ''
              } disabled:opacity-50`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Source */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Problem Source</label>
        <div className="toggle-group">
          {SOURCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => onSettingsChange({ problemSource: option.value })}
                disabled={disabled}
                className={`toggle-option flex-1 flex items-center justify-center gap-1.5 ${
                  settings.problemSource === option.value ? 'selected' : ''
                } disabled:opacity-50`}
              >
                <Icon className="w-3.5 h-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Description Input */}
      {settings.problemSource === 'description' && (
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Problem Description</label>
          <textarea
            value={settings.problemDescription}
            onChange={(e) => onSettingsChange({ problemDescription: e.target.value })}
            disabled={disabled}
            placeholder="Enter problem description or topic (e.g., 'LeetCode Blind 75 - Two Sum')"
            className="input-field h-24 resize-none text-sm"
          />
        </div>
      )}

      {/* URL Input */}
      {settings.problemSource === 'url' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Problem URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={settings.problemUrl}
                onChange={(e) => onSettingsChange({ problemUrl: e.target.value })}
                disabled={disabled || isScrapingUrl}
                placeholder="https://leetcode.com/problems/..."
                className="input-field text-sm flex-1"
              />
              <button
                onClick={handleScrapeUrl}
                disabled={disabled || isScrapingUrl || !settings.problemUrl}
                className="btn-secondary px-4 disabled:opacity-50"
              >
                {isScrapingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Scrape'
                )}
              </button>
            </div>
          </div>

          {/* Scrape Error */}
          {scrapeError && (
            <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-lg">
              {scrapeError}
            </div>
          )}

          {/* Scraped Problems */}
          {scrapedProblems.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Extracted Problems</label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {scrapedProblems.map((problem, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleProblemSelect(problem)}
                    disabled={disabled}
                    className="w-full text-left p-2 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-sm text-white truncate">
                      {problem.name}
                    </div>
                    {problem.difficulty && (
                      <span className={`text-xs ${
                        problem.difficulty === 'easy' ? 'text-green-400' :
                        problem.difficulty === 'medium' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {problem.difficulty}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Problem Preview */}
          {settings.problemDescription && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Selected Problem</label>
              <div className="p-2 bg-navy-800 rounded-lg text-xs text-gray-300 max-h-24 overflow-y-auto">
                {settings.problemDescription.slice(0, 300)}
                {settings.problemDescription.length > 300 && '...'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
