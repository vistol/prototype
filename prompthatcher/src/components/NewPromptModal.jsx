import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PenTool, Clock, DollarSign, TrendingUp, Cpu, Target, Hash, ArrowRight, BookOpen, AlertTriangle, Zap, AlertCircle, Check } from 'lucide-react'
import useStore from '../store/useStore'
import TradeSelectionModal from './TradeSelectionModal'

const executionTimes = [
  { id: 'target', label: 'Target', desc: 'Until TP/SL' },
  { id: 'scalping', label: 'Scalp', desc: '15m-1h' },
  { id: 'intraday', label: 'Intraday', desc: '4-24h' },
  { id: 'swing', label: 'Swing', desc: '2-7d' },
]

// AI Providers config - must match settings
const AI_PROVIDERS = [
  { id: 'anthropic', label: 'Claude', icon: '🧠' },
  { id: 'google', label: 'Gemini', icon: '🔮' },
  { id: 'openai', label: 'GPT-4', icon: '🤖' },
  { id: 'xai', label: 'Grok', icon: '⚡' },
]

// Target profit presets
const targetPresets = [
  { pct: 5, label: '5%' },
  { pct: 10, label: '10%' },
  { pct: 25, label: '25%' },
  { pct: 50, label: '50%' },
  { pct: 100, label: '2x' },
]

// Calculate estimated time and risk based on leverage and target
const calculateEstimate = (targetPct, leverage) => {
  // Crypto average daily volatility ~3-4%
  const dailyVolatility = 3.5

  // Effective movement needed (leverage amplifies returns)
  const effectiveMovement = targetPct / leverage

  // Estimated days to reach target
  const estimatedDays = effectiveMovement / dailyVolatility

  // Risk level based on leverage
  let risk = 'low'
  let riskColor = 'text-accent-green'
  if (leverage >= 20) {
    risk = 'extreme'
    riskColor = 'text-accent-red'
  } else if (leverage >= 10) {
    risk = 'high'
    riskColor = 'text-accent-orange'
  } else if (leverage >= 5) {
    risk = 'medium'
    riskColor = 'text-accent-yellow'
  }

  // Format time
  let timeStr = ''
  if (estimatedDays < 0.04) { // < 1 hour
    timeStr = `~${Math.round(estimatedDays * 24 * 60)}min`
  } else if (estimatedDays < 1) {
    timeStr = `~${Math.round(estimatedDays * 24)}h`
  } else if (estimatedDays < 7) {
    timeStr = `~${estimatedDays.toFixed(1)}d`
  } else {
    timeStr = `~${Math.round(estimatedDays / 7)}w`
  }

  // Liquidation risk (simplified: if price moves opposite by 100%/leverage, you're liquidated)
  const liquidationMove = (100 / leverage).toFixed(1)

  return { timeStr, risk, riskColor, liquidationMove, estimatedDays }
}

export default function NewPromptModal() {
  const { setNewPromptModalOpen, addPrompt, generateTrades, prompts, settings } = useStore()
  const [mode, setMode] = useState('library') // 'library' or 'manual'
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [executionTime, setExecutionTime] = useState('target')
  const [capital, setCapital] = useState(1000)
  const [leverage, setLeverage] = useState(5)
  const [minIpe, setMinIpe] = useState(80)
  const [numResults, setNumResults] = useState(3)
  const [targetPct, setTargetPct] = useState(10) // Target profit percentage

  // Get configured AI providers (those with API keys)
  const configuredProviders = useMemo(() => {
    return AI_PROVIDERS.filter(provider => {
      const apiKey = settings?.apiKeys?.[provider.id]
      return apiKey && apiKey.length > 0
    })
  }, [settings?.apiKeys])

  // Default to first configured provider, or 'google' if none
  const [aiProvider, setAiProvider] = useState(() => {
    // First check if current settings provider has a key
    if (settings?.apiKeys?.[settings?.aiProvider]) {
      return settings.aiProvider
    }
    // Otherwise use first configured provider
    const firstConfigured = AI_PROVIDERS.find(p => settings?.apiKeys?.[p.id])
    return firstConfigured?.id || 'google'
  })

  // Selected prompt from library
  const [selectedPromptId, setSelectedPromptId] = useState(null)

  // Step management: 'config' -> 'selection'
  const [step, setStep] = useState('config')
  const [currentPrompt, setCurrentPrompt] = useState(null)

  // Get active prompts for library (include prompts without status for backwards compatibility)
  const savedPrompts = prompts.filter(p => !p.status || p.status === 'active')

  // Check if any provider is configured
  const hasConfiguredProvider = configuredProviders.length > 0

  // Calculate estimate when in target mode
  const estimate = useMemo(() => {
    if (executionTime === 'target') {
      return calculateEstimate(targetPct, leverage)
    }
    return null
  }, [targetPct, leverage, executionTime])

  const handleSelectPrompt = (prompt) => {
    setSelectedPromptId(prompt.id)
    setName(prompt.name)
    setContent(prompt.content || '')
    setExecutionTime(prompt.executionTime || 'target')
    setCapital(prompt.capital || 1000)
    setLeverage(prompt.leverage || 5)
    // Map old aiModel values to new provider IDs
    const providerMap = { 'gemini': 'google', 'openai': 'openai', 'grok': 'xai' }
    const mappedProvider = providerMap[prompt.aiModel] || prompt.aiModel || 'google'
    setAiProvider(mappedProvider)
    setMinIpe(prompt.minIpe || 80)
    setNumResults(prompt.numResults || 3)
    setTargetPct(prompt.targetPct || 10)
  }

  const handleSubmit = async () => {
    if (!hasConfiguredProvider) return

    let promptToUse = null

    if (mode === 'library') {
      const selectedPrompt = prompts.find(p => p.id === selectedPromptId)
      if (!selectedPrompt) return

      // Ensure content is preserved from the library prompt
      promptToUse = {
        ...selectedPrompt,
        content: selectedPrompt.content || selectedPrompt.name, // Fallback to name if no content
        executionTime,
        capital,
        leverage,
        aiModel: aiProvider,
        minIpe,
        numResults,
        targetPct: executionTime === 'target' ? targetPct : null
      }
    } else {
      // Manual mode
      if (!name.trim()) return

      const promptContent = content || name.trim()

      promptToUse = {
        id: `prompt-${Date.now()}`,
        name: name.trim(),
        content: promptContent,
        mode: 'manual',
        executionTime,
        capital,
        leverage,
        aiModel: aiProvider,
        minIpe,
        numResults,
        targetPct: executionTime === 'target' ? targetPct : null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      addPrompt(promptToUse)
    }

    setCurrentPrompt(promptToUse)
    await generateTrades(promptToUse)
    setStep('selection')
  }

  const handleTradeSelectionComplete = () => {
    setNewPromptModalOpen(false)
  }

  const handleTradeSelectionCancel = () => {
    setStep('config')
  }

  const canSubmit = () => {
    if (!hasConfiguredProvider) return false
    if (mode === 'library') return selectedPromptId !== null
    return name.trim().length > 0
  }

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
        className="w-full max-w-lg bg-quant-card rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-quant-border">
          <h2 className="text-base font-bold text-white">New Incubation</h2>
          <button
            onClick={() => setNewPromptModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-quant-surface transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation - Library & Manual only */}
        <div className="shrink-0 px-4 py-2">
          <div className="flex bg-quant-surface rounded-lg p-0.5">
            {[
              { id: 'library', icon: BookOpen, label: 'Library' },
              { id: 'manual', icon: PenTool, label: 'Manual' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-all ${
                  mode === tab.id ? 'bg-quant-card text-accent-cyan' : 'text-gray-500'
                }`}
              >
                <tab.icon size={14} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3 space-y-4">

          {/* LIBRARY MODE - Prompt selector */}
          {mode === 'library' && (
            <div className="space-y-2">
              {savedPrompts.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No saved prompts. Create one in Manual mode first.</p>
                </div>
              ) : (
                savedPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedPromptId === prompt.id
                        ? 'border-accent-cyan bg-accent-cyan/10'
                        : 'border-quant-border bg-quant-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium text-sm ${
                        selectedPromptId === prompt.id ? 'text-white' : 'text-gray-300'
                      }`}>
                        {prompt.name}
                      </span>
                      {selectedPromptId === prompt.id && (
                        <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                      )}
                    </div>
                    {prompt.content && (
                      <p className="text-xs text-gray-500 line-clamp-2">{prompt.content}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Common form fields - only show if not library OR library with selection */}
          {(mode !== 'library' || selectedPromptId) && (
            <>
              {/* Name field - only for manual mode */}
              {mode === 'manual' && (
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Strategy name..."
                    className="w-full bg-quant-surface border border-quant-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                </div>
              )}

              {/* Manual content - Strategy description */}
              {mode === 'manual' && (
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Strategy</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe your trading strategy in detail. The AI will use this to generate trade signals..."
                    rows={4}
                    className="w-full bg-quant-surface border border-quant-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none"
                  />
                </div>
              )}

              {/* Execution Time - Horizontal compact */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock size={10} /> Execution
                </label>
                <div className="flex gap-1.5">
                  {executionTimes.map((time) => (
                    <button
                      key={time.id}
                      onClick={() => setExecutionTime(time.id)}
                      className={`flex-1 py-2 px-1 rounded-lg border text-center transition-all ${
                        executionTime === time.id
                          ? 'border-accent-cyan bg-accent-cyan/10 text-white'
                          : 'border-quant-border bg-quant-surface text-gray-500'
                      }`}
                    >
                      <span className="block text-xs font-medium">{time.label}</span>
                      <span className="text-[9px] opacity-60">{time.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TARGET MODE - Profit target selector with time estimate */}
              {executionTime === 'target' && (
                <div className="bg-quant-surface rounded-xl p-3 border border-quant-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Target size={10} /> Profit Target
                    </label>
                    <span className="text-accent-cyan font-mono font-bold text-sm">+{targetPct}%</span>
                  </div>

                  {/* Target presets */}
                  <div className="flex gap-1.5 mb-3">
                    {targetPresets.map((preset) => (
                      <button
                        key={preset.pct}
                        onClick={() => setTargetPct(preset.pct)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          targetPct === preset.pct
                            ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                            : 'bg-quant-card text-gray-400 border border-transparent'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Slider for fine-tuning */}
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={targetPct}
                    onChange={(e) => setTargetPct(Number(e.target.value))}
                    className="w-full h-1 mb-3"
                  />

                  {/* Time & Risk estimate */}
                  {estimate && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-quant-card rounded-lg p-2">
                        <span className="text-[9px] text-gray-500 block">Est. Time</span>
                        <span className="text-xs font-mono text-white">{estimate.timeStr}</span>
                      </div>
                      <div className="bg-quant-card rounded-lg p-2">
                        <span className="text-[9px] text-gray-500 block">Risk</span>
                        <span className={`text-xs font-mono capitalize ${estimate.riskColor}`}>
                          {estimate.risk}
                        </span>
                      </div>
                      <div className="bg-quant-card rounded-lg p-2">
                        <span className="text-[9px] text-gray-500 block">Liq. at</span>
                        <span className="text-xs font-mono text-accent-red">-{estimate.liquidationMove}%</span>
                      </div>
                    </div>
                  )}

                  {/* Risk warning for high leverage */}
                  {estimate && estimate.risk !== 'low' && (
                    <div className={`flex items-center gap-1.5 mt-2 p-2 rounded-lg text-[10px] ${
                      estimate.risk === 'extreme' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-orange/10 text-accent-orange'
                    }`}>
                      <AlertTriangle size={12} />
                      {estimate.risk === 'extreme'
                        ? `Extreme risk: ${leverage}x leverage can liquidate with ${estimate.liquidationMove}% move`
                        : `Higher leverage = faster target but increased liquidation risk`
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Capital & Leverage - Inline compact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <DollarSign size={10} /> Capital
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                    <input
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(Number(e.target.value))}
                      className="w-full bg-quant-surface border border-quant-border rounded-lg pl-6 pr-2 py-2 text-sm text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Zap size={10} /> Leverage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={leverage}
                      onChange={(e) => setLeverage(Math.max(1, Math.min(125, Number(e.target.value))))}
                      min={1}
                      max={125}
                      className="w-full bg-quant-surface border border-quant-border rounded-lg px-2 py-2 text-sm text-white font-mono"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">x</span>
                  </div>
                </div>
              </div>

              {/* AI Provider Warning if none configured */}
              {!hasConfiguredProvider && (
                <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-accent-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-accent-red">No AI Provider Configured</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Go to Settings → AI Provider to add your API key
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Model & Results - Compact row */}
              <div className="grid grid-cols-2 gap-3">
                {/* AI Provider selection */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Cpu size={10} /> AI Provider
                  </label>
                  <div className="flex gap-1">
                    {AI_PROVIDERS.map((provider) => {
                      const isConfigured = settings?.apiKeys?.[provider.id]?.length > 0
                      const isSelected = aiProvider === provider.id
                      return (
                        <button
                          key={provider.id}
                          onClick={() => isConfigured && setAiProvider(provider.id)}
                          disabled={!isConfigured}
                          className={`flex-1 py-2 rounded-lg border text-center transition-all relative ${
                            isSelected && isConfigured
                              ? 'border-accent-cyan bg-accent-cyan/10'
                              : isConfigured
                                ? 'border-quant-border bg-quant-surface hover:border-gray-600'
                                : 'border-quant-border bg-quant-surface opacity-40 cursor-not-allowed'
                          }`}
                          title={isConfigured ? provider.label : `${provider.label} - No API key`}
                        >
                          <span className="text-sm">{provider.icon}</span>
                          {isConfigured && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-green" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Number of Results */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Hash size={10} /> Results
                  </label>
                  <div className="flex gap-1">
                    {[1, 3, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setNumResults(num)}
                        className={`flex-1 py-2 rounded-lg border font-mono text-xs transition-all ${
                          numResults === num
                            ? 'border-accent-cyan bg-accent-cyan/10 text-white'
                            : 'border-quant-border bg-quant-surface text-gray-500'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Min IPE Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Target size={10} /> Min IPE
                  </label>
                  <span className="text-accent-cyan font-mono text-xs">{minIpe}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={minIpe}
                  onChange={(e) => setMinIpe(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="shrink-0 p-4 border-t border-quant-border">
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-electric-600 text-quant-bg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              boxShadow: canSubmit() ? '0 0 20px rgba(0, 240, 255, 0.25)' : 'none'
            }}
          >
            Generate Trades
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
