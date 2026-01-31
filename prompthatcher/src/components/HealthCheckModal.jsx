import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, HeartPulse, Clock, DollarSign, Zap, Target, Check, Hash } from 'lucide-react'
import useStore from '../store/useStore'

// Schedule frequency options
const frequencyOptions = [
  { id: 'hourly', label: 'Hourly', desc: 'Every X hours' },
  { id: 'daily', label: 'Daily', desc: 'Once per day' },
  { id: 'weekly', label: 'Weekly', desc: 'Select days' },
]

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const targetPresets = [
  { pct: 5, label: '5%' },
  { pct: 10, label: '10%' },
  { pct: 25, label: '25%' },
  { pct: 50, label: '50%' },
]

export default function HealthCheckModal({ check, onClose }) {
  const prompts = useStore((state) => state.prompts) || []
  const healthChecks = useStore((state) => state.healthChecks) || []

  const isEditing = !!check

  // Form state
  const [name, setName] = useState(check?.name || '')
  const [selectedPrompts, setSelectedPrompts] = useState(check?.prompts || [])
  const [frequency, setFrequency] = useState(check?.schedule?.frequency || 'daily')
  const [time, setTime] = useState(check?.schedule?.time || '09:00')
  const [interval, setInterval] = useState(check?.schedule?.interval || 4)
  const [selectedDays, setSelectedDays] = useState(check?.schedule?.days || ['Mon', 'Wed', 'Fri'])
  const [capital, setCapital] = useState(check?.capital || 1000)
  const [leverage, setLeverage] = useState(check?.leverage || 5)
  const [targetPct, setTargetPct] = useState(check?.targetPct || 10)
  const [minIpe, setMinIpe] = useState(check?.minIpe || 80)
  const [numResults, setNumResults] = useState(check?.numResults || 3)

  const togglePrompt = (prompt) => {
    setSelectedPrompts(prev => {
      const exists = prev.find(p => p.id === prompt.id)
      if (exists) {
        return prev.filter(p => p.id !== prompt.id)
      }
      return [...prev, { id: prompt.id, name: prompt.name }]
    })
  }

  const toggleDay = (day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      }
      return [...prev, day]
    })
  }

  const canSave = name.trim() && selectedPrompts.length > 0

  const handleSave = () => {
    if (!canSave) return

    const newCheck = {
      id: check?.id || `hc-${Date.now()}`,
      name: name.trim(),
      prompts: selectedPrompts,
      schedule: {
        frequency,
        time: frequency !== 'hourly' ? time : null,
        interval: frequency === 'hourly' ? interval : null,
        days: frequency === 'weekly' ? selectedDays : null,
      },
      capital,
      leverage,
      targetPct,
      minIpe,
      numResults,
      isActive: check?.isActive ?? true,
      createdAt: check?.createdAt || new Date().toISOString(),
      lastRun: check?.lastRun || null,
    }

    const updatedChecks = isEditing
      ? healthChecks.map(c => c.id === check.id ? newCheck : c)
      : [...healthChecks, newCheck]

    useStore.setState({ healthChecks: updatedChecks })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
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
        <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-quant-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">
              <HeartPulse size={16} className="text-accent-purple" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Health Check' : 'Create Health Check'}
              </h2>
              <p className="text-[10px] text-gray-500">Set up automated batch monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-quant-surface transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">
              Health Check Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Market Scan"
              className="w-full bg-quant-surface border border-quant-border rounded-xl px-3 py-3 text-sm text-white placeholder-gray-500 focus:border-accent-purple focus:outline-none"
              autoFocus
            />
          </div>

          {/* Select Prompts */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">
              Select Prompts to Monitor ({selectedPrompts.length} selected)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {prompts.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  No prompts available. Create prompts first.
                </div>
              ) : (
                prompts.map((prompt) => {
                  const isSelected = selectedPrompts.find(p => p.id === prompt.id)
                  return (
                    <button
                      key={prompt.id}
                      onClick={() => togglePrompt(prompt)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-quant-border bg-quant-surface hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {prompt.name}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-accent-purple bg-accent-purple' : 'border-gray-600'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Clock size={10} /> Schedule
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {frequencyOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFrequency(opt.id)}
                  className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                    frequency === opt.id
                      ? 'border-accent-purple bg-accent-purple/10 text-white'
                      : 'border-quant-border bg-quant-surface text-gray-500 hover:border-gray-600'
                  }`}
                >
                  <span className="block text-xs font-medium">{opt.label}</span>
                  <span className="text-[9px] opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Hourly Interval */}
            {frequency === 'hourly' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Every</span>
                <input
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, Math.min(24, Number(e.target.value))))}
                  min={1}
                  max={24}
                  className="w-16 bg-quant-surface border border-quant-border rounded-lg px-2 py-1.5 text-sm text-white text-center font-mono focus:border-accent-purple focus:outline-none"
                />
                <span className="text-xs text-gray-500">hour(s)</span>
              </div>
            )}

            {/* Daily/Weekly Time */}
            {(frequency === 'daily' || frequency === 'weekly') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Run at</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-quant-surface border border-quant-border rounded-lg px-2 py-1.5 text-sm text-white font-mono focus:border-accent-purple focus:outline-none"
                  />
                </div>

                {frequency === 'weekly' && (
                  <div className="flex gap-1">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedDays.includes(day)
                            ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                            : 'bg-quant-surface text-gray-500 border border-transparent'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Execution Config */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign size={10} /> Capital
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  className="w-full bg-quant-surface border border-quant-border rounded-xl pl-7 pr-3 py-2.5 text-sm text-white font-mono focus:border-accent-purple focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Zap size={10} /> Leverage
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={leverage}
                  onChange={(e) => setLeverage(Math.max(1, Math.min(125, Number(e.target.value))))}
                  min={1}
                  max={125}
                  className="w-full bg-quant-surface border border-quant-border rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-accent-purple focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">x</span>
              </div>
            </div>
          </div>

          {/* Target & IPE */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Target size={10} /> Profit Target
            </label>
            <div className="flex gap-1.5 mb-2">
              {targetPresets.map((preset) => (
                <button
                  key={preset.pct}
                  onClick={() => setTargetPct(preset.pct)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all ${
                    targetPct === preset.pct
                      ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                      : 'bg-quant-surface text-gray-400 border border-transparent hover:border-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Target size={10} /> Min IPE
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={minIpe}
                  onChange={(e) => setMinIpe(Math.max(50, Math.min(99, Number(e.target.value))))}
                  min={50}
                  max={99}
                  className="w-full bg-quant-surface border border-quant-border rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-accent-purple focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Hash size={10} /> Results
              </label>
              <div className="flex gap-1">
                {[1, 3, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumResults(num)}
                    className={`flex-1 py-2.5 rounded-xl border font-mono text-sm transition-all ${
                      numResults === num
                        ? 'border-accent-purple bg-accent-purple/10 text-white'
                        : 'border-quant-border bg-quant-surface text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-quant-border">
          <motion.button
            onClick={handleSave}
            disabled={!canSave}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              boxShadow: canSave ? '0 0 20px rgba(139, 92, 246, 0.25)' : 'none'
            }}
          >
            <HeartPulse size={18} />
            {isEditing ? 'Update Health Check' : 'Create Health Check'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
