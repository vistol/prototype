import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Save, FileText } from 'lucide-react'
import useStore from '../store/useStore'

export default function PromptEditorModal({ prompt, onClose, onSave }) {
  const { addPrompt, updatePrompt } = useStore()
  const isEditing = !!prompt

  const [name, setName] = useState(prompt?.name || '')
  const [content, setContent] = useState(prompt?.content || '')

  const handleSave = () => {
    if (!name.trim()) return

    const promptData = {
      name: name.trim(),
      content: content.trim() || name.trim(),
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
        className="w-full max-w-md bg-quant-card rounded-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-quant-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <FileText size={16} className="text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Strategy' : 'New Strategy'}
              </h2>
              <p className="text-[10px] text-gray-500">Define your trading strategy</p>
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
        <div className="flex-1 px-4 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">
              Strategy Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., RSI Oversold Bounce"
              className="w-full bg-quant-surface border border-quant-border rounded-xl px-3 py-3 text-sm text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">
              Strategy Description *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your trading strategy in detail...

Example:
Find cryptocurrencies with RSI below 30 on the 4H timeframe, near historical support levels, with increasing volume in the last 24 hours. Look for bullish divergence patterns."
              rows={8}
              className="w-full bg-quant-surface border border-quant-border rounded-xl px-3 py-3 text-sm text-white placeholder-gray-500 resize-none focus:border-accent-cyan focus:outline-none transition-colors"
            />
            <p className="text-[10px] text-gray-600 mt-1.5">
              💡 Be specific about indicators, timeframes, and conditions. The AI will use this to find opportunities.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-quant-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-quant-surface text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-3 rounded-xl bg-accent-cyan text-quant-bg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-accent-cyan/90 transition-colors"
          >
            <Save size={16} />
            {isEditing ? 'Update' : 'Save Strategy'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
