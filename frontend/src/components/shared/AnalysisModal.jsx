import { X, Award, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

export default function AnalysisModal({ analysis, onClose }) {
  if (!analysis) return null;

  const scoreColor = analysis.overall_score >= 7 
    ? 'text-green-400' 
    : analysis.overall_score >= 5 
    ? 'text-yellow-400' 
    : 'text-red-400';

  const scoreGradient = analysis.overall_score >= 7
    ? 'from-green-500 to-emerald-600'
    : analysis.overall_score >= 5
    ? 'from-yellow-500 to-orange-500'
    : 'from-red-500 to-pink-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-electric-400" />
            Session Analysis
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score */}
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${scoreGradient} flex items-center justify-center shadow-lg`}>
              <span className="text-4xl font-bold text-white">
                {analysis.overall_score}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Overall Score</div>
              <div className={`text-2xl font-bold ${scoreColor}`}>
                {analysis.overall_score >= 7 ? 'Excellent' : 
                 analysis.overall_score >= 5 ? 'Good' : 'Needs Work'}
              </div>
              <div className="text-sm text-gray-500">out of 10</div>
            </div>
          </div>

          {/* Strengths */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-green-400 font-semibold">
              <TrendingUp className="w-5 h-5" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {analysis.strengths?.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-yellow-400 font-semibold">
              <AlertCircle className="w-5 h-5" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {analysis.areas_for_improvement?.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300">
                  <span className="text-yellow-400 mt-1">!</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Feedback */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Detailed Feedback</h3>
            <p className="text-gray-300 leading-relaxed bg-navy-800/50 p-4 rounded-xl">
              {analysis.detailed_feedback}
            </p>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-electric-400 font-semibold">
              <Lightbulb className="w-5 h-5" />
              Recommendations
            </h3>
            <ul className="space-y-2">
              {analysis.recommendations?.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300">
                  <span className="text-electric-400 mt-1">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full btn-primary"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
