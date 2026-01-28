import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Sparkles, PenTool, Clock, DollarSign, Zap, Cpu, Target, Hash } from 'lucide-react'
import useStore from '../store/useStore'

const executionTimes = [
  { id: 'target', label: 'Target', desc: 'Until TP/SL' },
  { id: 'scalping', label: 'Scalp', desc: '15m-1h' },
  { id: 'intraday', label: 'Intraday', desc: '4-24h' },
  { id: 'swing', label: 'Swing', desc: '2-7d' },
]

const aiModels = [
  { id: 'gemini', label: 'Gemini', icon: '🔮' },
  { id: 'openai', label: 'GPT-4', icon: '🤖' },
  { id: 'grok', label: 'Grok', icon: '⚡' },
]

export default function PromptEditorModal({ prompt, onClose, onSave }) {
  const { addPrompt, updatePrompt } = useStore()
  const isEditing = !!prompt

  const [name, setName] = useState(prompt?.name || '')
  const [content, setContent] = useState(prompt?.content || '')
  const [mode, setMode] = useState(prompt?.mode || 'auto')
  const [executionTime, setExecutionTime] = useState(prompt?.executionTime || 'target')
  const [capital, setCapital] = useState(prompt?.capital || 1000)
  const [leverage, setLeverage] = useState(prompt?.leverage || 5)
  const [aiModel, setAiModel] = useState(prompt?.aiModel || 'gemini')
  const [minIpe, setMinIpe] = useState(prompt?.minIpe || 80)
  const [numResults, setNumResults] = useState(prompt?.numResults || 3)

  const handleSave = () => {
    if (!name.trim()) return

    const promptData = {
      name: name.trim(),
      content: content || `[${mode.toUpperCase()}] Strategy template`,
      mode,
      executionTime,
      capital,
      leverage,
      aiModel,
      minIpe,
      numResults,
      status: 'active'
    }

    if (isEditing) {
      updatePrompt(prompt.id, promptData)
    } else {
      addPrompt(promptData)
    }

    onSave?.()
    onClose()
  }

  const canSave = name.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-quant-card rounded-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-quant-border">
          <h2 className="text-base font-bold text-white">
            {isEditing ? 'Edit Prompt' : 'New Prompt Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-quant-surface transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
              Prompt Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alpha Momentum Strategy"
              className="w-full bg-quant-surface border border-quant-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* Mode */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">
              Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('auto')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${
                  mode === 'auto'
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border-quant-border bg-quant-surface text-gray-400'
                }`}
              >
                <Sparkles size={14} />
                <span className="text-xs font-medium">Auto</span>
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${
                  mode === 'manual'
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border-quant-border bg-quant-surface text-gray-400'
                }`}
              >
                <PenTool size={14} />
                <span className="text-xs font-medium">Manual</span>
              </button>
            </div>
          </div>

          {/* Strategy content (for manual mode) */}
          {mode === 'manual' && (
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
                Strategy Description
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your trading strategy in detail..."
                rows={4}
                className="w-full bg-quant-surface border border-quant-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none"
              />
            </div>
          )}

          {/* Default Settings */}
          <div className="pt-2 border-t border-quant-border">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-3">
              Default Configuration
            </span>

            {/* Execution Time */}
            <div className="mb-3">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={10} /> Execution
              </label>
              <div className="flex gap-1.5">
                {executionTimes.map((time) => (
                  <button
                    key={time.id}
                    onClick={() => setExecutionTime(time.id)}
                    className={`flex-1 py-1.5 rounded-lg border text-center transition-all ${
                      executionTime === time.id
                        ? 'border-accent-cyan bg-accent-cyan/10 text-white'
                        : 'border-quant-border bg-quant-surface text-gray-500'
                    }`}
                  >
                    <span className="text-[10px] font-medium">{time.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Capital & Leverage */}
            <div className="grid grid-cols-2 gap-3 mb-3">
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

            {/* AI Model & Results */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Cpu size={10} /> AI Model
                </label>
                <div className="flex gap-1">
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setAiModel(model.id)}
                      className={`flex-1 py-2 rounded-lg border text-center transition-all ${
                        aiModel === model.id
                          ? 'border-accent-cyan bg-accent-cyan/10'
                          : 'border-quant-border bg-quant-surface'
                      }`}
                      title={model.label}
                    >
                      <span className="text-sm">{model.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
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

            {/* Min IPE (for auto mode) */}
            {mode === 'auto' && (
              <div className="mt-3">
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-quant-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-quant-surface text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-xl bg-accent-cyan text-quant-bg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
