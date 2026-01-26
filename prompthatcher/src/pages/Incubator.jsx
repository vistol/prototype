import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, Play, Pause, MoreVertical, Trash2, Eye } from 'lucide-react'
import useStore from '../store/useStore'
import Header from '../components/Header'
import EggIcon from '../components/EggIcon'

export default function Incubator() {
  const { prompts, archivePrompt, deletePrompt, setSelectedPromptId, addSignal } = useStore()
  const [activeFilter, setActiveFilter] = useState('active')
  const [menuOpen, setMenuOpen] = useState(null)

  const filteredPrompts = prompts.filter(p =>
    activeFilter === 'active' ? p.status === 'active' : p.status === 'archived'
  )

  const handleRunPrompt = (promptId) => {
    addSignal(promptId)
    setMenuOpen(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header
        title="Incubator"
        subtitle={`${filteredPrompts.length} prompts ${activeFilter}`}
      />

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setActiveFilter('active')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            activeFilter === 'active'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              : 'bg-quant-surface text-gray-400 border border-transparent'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveFilter('archived')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeFilter === 'archived'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              : 'bg-quant-surface text-gray-400 border border-transparent'
          }`}
        >
          <Archive size={16} />
          Archived
        </button>
      </div>

      {/* Prompts List */}
      <div className="px-4 pb-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredPrompts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quant-surface flex items-center justify-center">
                <EggIcon size={48} status="incubating" />
              </div>
              <p className="text-gray-400 mb-2">No {activeFilter} prompts</p>
              <p className="text-sm text-gray-500">
                {activeFilter === 'active'
                  ? 'Tap + to create your first prompt'
                  : 'Archived prompts will appear here'}
              </p>
            </motion.div>
          ) : (
            filteredPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-quant-card border border-quant-border rounded-2xl p-4 card-hover"
              >
                <div className="flex items-start gap-3">
                  {/* Egg Icon */}
                  <div className="relative">
                    <EggIcon
                      size={56}
                      status={prompt.status === 'active' ? 'incubating' : 'hatched'}
                      winRate={prompt.winRate}
                    />
                    {prompt.status === 'active' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-green rounded-full border-2 border-quant-card pulse-ring" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">{prompt.name}</h3>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === prompt.id ? null : prompt.id)}
                          className="p-1.5 rounded-lg hover:bg-quant-surface transition-colors"
                        >
                          <MoreVertical size={18} className="text-gray-400" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {menuOpen === prompt.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-quant-surface border border-quant-border rounded-xl overflow-hidden z-20 shadow-xl"
                            >
                              <button
                                onClick={() => {
                                  setSelectedPromptId(prompt.id)
                                  setMenuOpen(null)
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-quant-border/50 flex items-center gap-2"
                              >
                                <Eye size={16} />
                                View Details
                              </button>
                              {prompt.status === 'active' && (
                                <button
                                  onClick={() => handleRunPrompt(prompt.id)}
                                  className="w-full px-4 py-3 text-left text-sm text-accent-cyan hover:bg-quant-border/50 flex items-center gap-2"
                                >
                                  <Play size={16} />
                                  Run Now
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  archivePrompt(prompt.id)
                                  setMenuOpen(null)
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-quant-border/50 flex items-center gap-2"
                              >
                                {prompt.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                                {prompt.status === 'active' ? 'Archive' : 'Reactivate'}
                              </button>
                              <button
                                onClick={() => {
                                  deletePrompt(prompt.id)
                                  setMenuOpen(null)
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-accent-red hover:bg-quant-border/50 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        prompt.mode === 'auto'
                          ? 'bg-accent-cyan/20 text-accent-cyan'
                          : 'bg-accent-orange/20 text-accent-orange'
                      }`}>
                        {prompt.mode === 'auto' ? 'AUTO' : 'MANUAL'}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{prompt.executionTime}</span>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                        <span className="text-xs text-gray-500 block">Trades</span>
                        <span className="text-sm font-mono text-white">{prompt.trades}</span>
                      </div>
                      <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                        <span className="text-xs text-gray-500 block">Win</span>
                        <span className={`text-sm font-mono ${
                          prompt.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'
                        }`}>
                          {prompt.winRate}%
                        </span>
                      </div>
                      <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                        <span className="text-xs text-gray-500 block">PF</span>
                        <span className={`text-sm font-mono ${
                          prompt.profitFactor >= 1 ? 'text-accent-green' : 'text-accent-red'
                        }`}>
                          {prompt.profitFactor.toFixed(1)}
                        </span>
                      </div>
                      <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                        <span className="text-xs text-gray-500 block">PnL</span>
                        <span className={`text-sm font-mono ${
                          prompt.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                        }`}>
                          {prompt.totalPnl >= 0 ? '+' : ''}{prompt.totalPnl.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </motion.div>
  )
}
