import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, PenTool, Clock, DollarSign, TrendingUp, Cpu, Target, Hash } from 'lucide-react'
import useStore from '../store/useStore'

const executionTimes = [
  { id: 'target', label: 'Target Based', desc: 'Until SL/TP hit' },
  { id: 'scalping', label: 'Scalping', desc: '15min - 1h' },
  { id: 'intraday', label: 'Intraday', desc: '4h - 24h' },
  { id: 'swing', label: 'Swing', desc: '2 - 7 days' },
]

const aiModels = [
  { id: 'gemini', label: 'Google Gemini', icon: '🔮' },
  { id: 'openai', label: 'OpenAI GPT-4', icon: '🤖' },
  { id: 'grok', label: 'xAI Grok', icon: '⚡' },
]

export default function NewPromptModal() {
  const { setNewPromptModalOpen, addPrompt } = useStore()
  const [mode, setMode] = useState('auto')
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [executionTime, setExecutionTime] = useState('intraday')
  const [capital, setCapital] = useState(1000)
  const [leverage, setLeverage] = useState(5)
  const [aiModel, setAiModel] = useState('gemini')
  const [minIpe, setMinIpe] = useState(80)
  const [numResults, setNumResults] = useState(3)

  const handleSubmit = () => {
    if (!name.trim()) return

    const promptContent = mode === 'auto'
      ? `[AUTO-GENERATED] Maximize profit with ${executionTime} trading strategy using AI-optimized parameters.`
      : content

    addPrompt({
      name: name.trim(),
      content: promptContent,
      mode,
      executionTime,
      capital,
      leverage,
      aiModel,
      minIpe,
      numResults,
      status: 'active'
    })

    setNewPromptModalOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setNewPromptModalOpen(false)}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-quant-card rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-quant-card border-b border-quant-border px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold gradient-text">New Prompt</h2>
          <button
            onClick={() => setNewPromptModalOpen(false)}
            className="p-2 rounded-full hover:bg-quant-surface transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Creation Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('auto')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'auto'
                    ? 'border-accent-cyan bg-accent-cyan/10'
                    : 'border-quant-border bg-quant-surface'
                }`}
              >
                <Sparkles size={24} className={mode === 'auto' ? 'text-accent-cyan' : 'text-gray-500'} />
                <span className={`block mt-2 font-medium ${mode === 'auto' ? 'text-white' : 'text-gray-400'}`}>
                  Automatic
                </span>
                <span className="text-xs text-gray-500">AI-generated</span>
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'manual'
                    ? 'border-accent-cyan bg-accent-cyan/10'
                    : 'border-quant-border bg-quant-surface'
                }`}
              >
                <PenTool size={24} className={mode === 'manual' ? 'text-accent-cyan' : 'text-gray-500'} />
                <span className={`block mt-2 font-medium ${mode === 'manual' ? 'text-white' : 'text-gray-400'}`}>
                  Manual
                </span>
                <span className="text-xs text-gray-500">Write your own</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Prompt Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alpha Momentum Strategy"
              className="w-full bg-quant-surface border border-quant-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-accent-cyan transition-colors"
            />
          </div>

          {/* Manual Content */}
          {mode === 'manual' && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Prompt Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your trading strategy..."
                rows={4}
                className="w-full bg-quant-surface border border-quant-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-accent-cyan transition-colors resize-none font-mono text-sm"
              />
            </div>
          )}

          {/* Execution Time */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={14} />
              Execution Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              {executionTimes.map((time) => (
                <button
                  key={time.id}
                  onClick={() => setExecutionTime(time.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    executionTime === time.id
                      ? 'border-accent-cyan bg-accent-cyan/10'
                      : 'border-quant-border bg-quant-surface'
                  }`}
                >
                  <span className={`block text-sm font-medium ${
                    executionTime === time.id ? 'text-white' : 'text-gray-400'
                  }`}>
                    {time.label}
                  </span>
                  <span className="text-xs text-gray-500">{time.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Capital & Leverage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <DollarSign size={14} />
                Initial Capital
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  className="w-full bg-quant-surface border border-quant-border rounded-xl pl-8 pr-4 py-3 text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendingUp size={14} />
                Leverage
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full bg-quant-surface border border-quant-border rounded-xl px-4 py-3 text-white font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">x</span>
              </div>
            </div>
          </div>

          {/* AI Model */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu size={14} />
              AI Model
            </label>
            <div className="space-y-2">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setAiModel(model.id)}
                  className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    aiModel === model.id
                      ? 'border-accent-cyan bg-accent-cyan/10'
                      : 'border-quant-border bg-quant-surface'
                  }`}
                >
                  <span className="text-xl">{model.icon}</span>
                  <span className={aiModel === model.id ? 'text-white' : 'text-gray-400'}>
                    {model.label}
                  </span>
                  {aiModel === model.id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-accent-cyan" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Min IPE Slider */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Target size={14} />
              Minimum IPE (Success Probability)
            </label>
            <div className="bg-quant-surface rounded-xl p-4 border border-quant-border">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Min</span>
                <span className="text-accent-cyan font-mono font-bold">{minIpe}%</span>
                <span className="text-gray-500">Max</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={minIpe}
                onChange={(e) => setMinIpe(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Number of Results */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Hash size={14} />
              Number of Results
            </label>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumResults(num)}
                  className={`flex-1 py-3 rounded-xl border font-mono transition-all ${
                    numResults === num
                      ? 'border-accent-cyan bg-accent-cyan/10 text-white'
                      : 'border-quant-border bg-quant-surface text-gray-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="shrink-0 p-4 border-t border-quant-border bg-quant-card">
          <motion.button
            onClick={handleSubmit}
            disabled={!name.trim()}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-cyan to-electric-600 text-quant-bg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              boxShadow: name.trim() ? '0 0 30px rgba(0, 240, 255, 0.3)' : 'none'
            }}
          >
            Start Incubation
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
