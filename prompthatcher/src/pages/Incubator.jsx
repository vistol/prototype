import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, MoreVertical, Trash2, Eye, Clock, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import useStore from '../store/useStore'
import Header from '../components/Header'
import EggIcon from '../components/EggIcon'

export default function Incubator() {
  const { eggs, signals, deletePrompt, setSelectedPromptId } = useStore()
  const [activeFilter, setActiveFilter] = useState('incubating')
  const [expandedEgg, setExpandedEgg] = useState(null)

  const filteredEggs = eggs.filter(e =>
    activeFilter === 'incubating' ? e.status === 'incubating' : e.status === 'hatched'
  )

  const getEggProgress = (egg) => {
    const eggSignals = signals.filter(s => egg.trades.includes(s.id))
    const closedCount = eggSignals.filter(s => s.status === 'closed').length
    return {
      total: eggSignals.length,
      closed: closedCount,
      active: eggSignals.length - closedCount,
      percentage: eggSignals.length > 0 ? (closedCount / eggSignals.length) * 100 : 0
    }
  }

  const getTimeRemaining = (egg) => {
    if (!egg.expiresAt) return 'Target-based'
    const now = new Date()
    const expires = new Date(egg.expiresAt)
    const diff = expires - now

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h left`
    if (hours > 0) return `${hours}h left`
    return 'Less than 1h'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header
        title="Incubator"
        subtitle={`${filteredEggs.length} eggs ${activeFilter}`}
      />

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setActiveFilter('incubating')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            activeFilter === 'incubating'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              : 'bg-quant-surface text-gray-400 border border-transparent'
          }`}
        >
          Incubating
        </button>
        <button
          onClick={() => setActiveFilter('hatched')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeFilter === 'hatched'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              : 'bg-quant-surface text-gray-400 border border-transparent'
          }`}
        >
          <Archive size={16} />
          Hatched
        </button>
      </div>

      {/* Eggs List */}
      <div className="px-4 pb-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredEggs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quant-surface flex items-center justify-center">
                <EggIcon size={48} status={activeFilter === 'incubating' ? 'incubating' : 'hatched'} />
              </div>
              <p className="text-gray-400 mb-2">No {activeFilter} eggs</p>
              <p className="text-sm text-gray-500">
                {activeFilter === 'incubating'
                  ? 'Tap + to create a new prompt and start incubating'
                  : 'Hatched eggs will appear here'}
              </p>
            </motion.div>
          ) : (
            filteredEggs.map((egg, index) => {
              const progress = getEggProgress(egg)
              const eggSignals = signals.filter(s => egg.trades.includes(s.id))
              const isExpanded = expandedEgg === egg.id

              return (
                <motion.div
                  key={egg.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-quant-card border border-quant-border rounded-2xl overflow-hidden card-hover"
                >
                  {/* Main Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Egg Icon */}
                      <div className="relative">
                        <EggIcon
                          size={56}
                          status={egg.status}
                          winRate={egg.results?.winRate || 0}
                        />
                        {egg.status === 'incubating' && progress.active > 0 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-green rounded-full border-2 border-quant-card pulse-ring" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white truncate">{egg.promptName}</h3>
                          <button
                            onClick={() => setExpandedEgg(isExpanded ? null : egg.id)}
                            className="p-1.5 rounded-lg hover:bg-quant-surface transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp size={18} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan">
                            {progress.total} trades
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {getTimeRemaining(egg)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="text-accent-cyan">
                              {progress.closed}/{progress.total} executed
                            </span>
                          </div>
                          <div className="h-2 bg-quant-surface rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.percentage}%` }}
                              className="h-full bg-gradient-to-r from-accent-cyan to-accent-green rounded-full"
                            />
                          </div>
                        </div>

                        {/* Results (for hatched eggs) */}
                        {egg.status === 'hatched' && egg.results && (
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                              <span className="text-xs text-gray-500 block">Trades</span>
                              <span className="text-sm font-mono text-white">{egg.results.totalTrades}</span>
                            </div>
                            <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                              <span className="text-xs text-gray-500 block">Win</span>
                              <span className={`text-sm font-mono ${
                                egg.results.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {egg.results.winRate}%
                              </span>
                            </div>
                            <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                              <span className="text-xs text-gray-500 block">PF</span>
                              <span className={`text-sm font-mono ${
                                egg.results.profitFactor >= 1 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {egg.results.profitFactor === Infinity ? '∞' : egg.results.profitFactor.toFixed(1)}
                              </span>
                            </div>
                            <div className="bg-quant-surface/50 rounded-lg p-2 text-center">
                              <span className="text-xs text-gray-500 block">PnL</span>
                              <span className={`text-sm font-mono ${
                                egg.results.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {egg.results.totalPnl >= 0 ? '+' : ''}{egg.results.totalPnl.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Trades List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-quant-border"
                      >
                        <div className="p-3 space-y-2 bg-quant-surface/30">
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Trades in this egg</span>
                          {eggSignals.map((signal) => {
                            const isLong = signal.strategy === 'LONG'
                            const isClosed = signal.status === 'closed'

                            return (
                              <div
                                key={signal.id}
                                className={`bg-quant-card rounded-xl p-3 border ${
                                  isClosed
                                    ? signal.result === 'win'
                                      ? 'border-accent-green/30'
                                      : 'border-accent-red/30'
                                    : 'border-quant-border'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${
                                      isLong ? 'bg-accent-green/20' : 'bg-accent-red/20'
                                    }`}>
                                      {isLong ? (
                                        <TrendingUp size={14} className="text-accent-green" />
                                      ) : (
                                        <TrendingDown size={14} className="text-accent-red" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-white">{signal.asset}</span>
                                      <span className={`ml-2 text-xs ${
                                        isLong ? 'text-accent-green' : 'text-accent-red'
                                      }`}>
                                        {signal.strategy}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    {isClosed ? (
                                      <span className={`text-sm font-mono font-bold ${
                                        signal.result === 'win' ? 'text-accent-green' : 'text-accent-red'
                                      }`}>
                                        {signal.pnl >= 0 ? '+' : ''}{signal.pnl?.toFixed(2) || '0.00'}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-accent-cyan flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse" />
                                        Active
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-2 text-xs">
                                  <span className="text-gray-500">
                                    Entry: <span className="text-white font-mono">${signal.entry}</span>
                                  </span>
                                  <span className="text-accent-green">
                                    TP: ${signal.takeProfit}
                                  </span>
                                  <span className="text-accent-red">
                                    SL: ${signal.stopLoss}
                                  </span>
                                  <span className={`font-bold ${
                                    signal.ipe >= 80 ? 'text-accent-green' : 'text-accent-yellow'
                                  }`}>
                                    {signal.ipe}%
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
