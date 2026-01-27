import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, PenTool, Clock, DollarSign, TrendingUp, Cpu, Target, Hash, Crown, ArrowRight, BookOpen, ChevronRight } from 'lucide-react'
import useStore from '../store/useStore'
import TradeSelectionModal from './TradeSelectionModal'

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
  const { setNewPromptModalOpen, addPrompt, generateTrades, settings, prompts } = useStore()
  const [mode, setMode] = useState('library') // 'auto', 'library', 'manual'
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [executionTime, setExecutionTime] = useState('target')
  const [capital, setCapital] = useState(1000)
  const [leverage, setLeverage] = useState(5)
  const [aiModel, setAiModel] = useState('gemini')
  const [minIpe, setMinIpe] = useState(80)
  const [numResults, setNumResults] = useState(3)

  // Selected prompt from library
  const [selectedPromptId, setSelectedPromptId] = useState(null)

  // Step management: 'config' -> 'selection'
  const [step, setStep] = useState('config')
  const [currentPrompt, setCurrentPrompt] = useState(null)

  // Get active prompts for library
  const savedPrompts = prompts.filter(p => p.status === 'active')

  const handleSelectPrompt = (prompt) => {
    setSelectedPromptId(prompt.id)
    // Pre-fill settings from the selected prompt
    setName(prompt.name)
    setExecutionTime(prompt.executionTime || 'target')
    setCapital(prompt.capital || 1000)
    setLeverage(prompt.leverage || 5)
    setAiModel(prompt.aiModel || 'gemini')
    setMinIpe(prompt.minIpe || 80)
    setNumResults(prompt.numResults || 3)
  }

  const handleSubmit = async () => {
    let promptToUse = null

    if (mode === 'library') {
      // Use selected prompt from library
      const selectedPrompt = prompts.find(p => p.id === selectedPromptId)
      if (!selectedPrompt) return

      promptToUse = {
        ...selectedPrompt,
        executionTime,
        capital,
        leverage,
        aiModel,
        minIpe,
        numResults
      }
    } else {
      // Create new prompt (auto or manual)
      if (!name.trim()) return

      const promptContent = mode === 'auto'
        ? `[AUTO-GENERATED from System Prompt]\n\nExecution Context:\n- Timeframe: ${executionTime}\n- Capital: $${capital}\n- Leverage: ${leverage}x\n- Min IPE: ${minIpe}%\n- Results: ${numResults}\n\nThis prompt inherits from the master System Prompt and will generate trading strategies following the scientific method.`
        : content

      promptToUse = {
        id: `prompt-${Date.now()}`,
        name: name.trim(),
        content: promptContent,
        mode,
        executionTime,
        capital,
        leverage,
        aiModel,
        minIpe,
        numResults,
        status: 'active',
        parentPrompt: mode === 'auto' ? 'system' : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Add prompt to store only for new prompts
      addPrompt(promptToUse)
    }

    setCurrentPrompt(promptToUse)

    // Generate trades
    await generateTrades(promptToUse)

    // Move to selection step
    setStep('selection')
  }

  const handleTradeSelectionComplete = (egg) => {
    // Close modal after egg is created
    setNewPromptModalOpen(false)
  }

  const handleTradeSelectionCancel = () => {
    // Go back to config or close
    setStep('config')
  }

  // Check if can submit
  const canSubmit = () => {
    if (mode === 'library') return selectedPromptId !== null
    return name.trim().length > 0
  }

  // Show trade selection modal
  if (step === 'selection' && currentPrompt) {
    return (
      <TradeSelectionModal
        prompt={currentPrompt}
        onClose={handleTradeSelectionCancel}
        onComplete={handleTradeSelectionComplete}
      />
    )
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
        className="w-full max-w-lg bg-quant-card rounded-t-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-mono">New Incubation</h2>
          <button
            onClick={() => setNewPromptModalOpen(false)}
            className="p-2 rounded-full hover:bg-quant-surface transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 px-4 pb-4">
          <div className="flex bg-quant-surface rounded-xl p-1">
            <button
              onClick={() => setMode('auto')}
              className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg transition-all ${
                mode === 'auto' ? 'bg-quant-card' : ''
              }`}
            >
              <Sparkles size={20} className={mode === 'auto' ? 'text-accent-cyan' : 'text-gray-500'} />
              <span className={`text-xs mt-1 uppercase tracking-wider ${
                mode === 'auto' ? 'text-accent-cyan' : 'text-gray-500'
              }`}>
                Auto
              </span>
            </button>
            <button
              onClick={() => setMode('library')}
              className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg transition-all ${
                mode === 'library' ? 'bg-quant-card' : ''
              }`}
            >
              <BookOpen size={20} className={mode === 'library' ? 'text-accent-cyan' : 'text-gray-500'} />
              <span className={`text-xs mt-1 uppercase tracking-wider ${
                mode === 'library' ? 'text-accent-cyan' : 'text-gray-500'
              }`}>
                Library
              </span>
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg transition-all ${
                mode === 'manual' ? 'bg-quant-card' : ''
              }`}
            >
              <PenTool size={20} className={mode === 'manual' ? 'text-accent-cyan' : 'text-gray-500'} />
              <span className={`text-xs mt-1 uppercase tracking-wider ${
                mode === 'manual' ? 'text-accent-cyan' : 'text-gray-500'
              }`}>
                Manual
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6">

          {/* LIBRARY MODE */}
          {mode === 'library' && (
            <>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">
                  Saved Prompts
                </label>
                <div className="space-y-3">
                  {savedPrompts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No saved prompts yet</p>
                      <p className="text-xs mt-1">Create one using Auto or Manual mode</p>
                    </div>
                  ) : (
                    savedPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleSelectPrompt(prompt)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedPromptId === prompt.id
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-quant-border bg-quant-surface hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className={`font-medium font-mono ${
                              selectedPromptId === prompt.id ? 'text-white' : 'text-gray-300'
                            }`}>
                              {prompt.name}
                            </h3>
                            <p className="text-xs text-gray-500 uppercase mt-1">
                              {prompt.executionTime?.replace('_', ' ') || 'TARGET_BASED'}
                            </p>
                          </div>
                          {selectedPromptId === prompt.id && (
                            <div className="w-3 h-3 rounded-full bg-accent-cyan" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Show config options when prompt is selected */}
              {selectedPromptId && (
                <>
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
                        Capital
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
                </>
              )}
            </>
          )}

          {/* AUTO MODE */}
          {mode === 'auto' && (
            <>
              {/* Auto mode info */}
              <div className="p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-xl flex items-start gap-3">
                <Crown size={20} className="text-accent-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-accent-cyan font-medium">
                    Automatic Generation
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    The AI will create a unique trading strategy using the System Prompt template and scientific method.
                  </p>
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
                    Capital
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
            </>
          )}

          {/* MANUAL MODE */}
          {mode === 'manual' && (
            <>
              {/* Name */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Prompt Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Custom Strategy"
                  className="w-full bg-quant-surface border border-quant-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-accent-cyan transition-colors"
                />
              </div>

              {/* Manual Content */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Strategy Description</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your trading strategy in detail..."
                  rows={6}
                  className="w-full bg-quant-surface border border-quant-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-accent-cyan transition-colors resize-none font-mono text-sm"
                />
              </div>

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
                    Capital
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
            </>
          )}

        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="shrink-0 p-4 border-t border-quant-border bg-quant-card">
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-cyan to-electric-600 text-quant-bg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              boxShadow: canSubmit() ? '0 0 30px rgba(0, 240, 255, 0.3)' : 'none'
            }}
          >
            Generate Trades
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
