import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Target, Award, ChevronRight, ChevronDown, ChevronUp, BarChart3, Percent, DollarSign, Clock, Calendar } from 'lucide-react'
import useStore from '../store/useStore'
import Header from '../components/Header'
import EggIcon from '../components/EggIcon'

export default function Hatchlings() {
  const { eggs, signals } = useStore()
  const [expandedEgg, setExpandedEgg] = useState(null)
  const [sortBy, setSortBy] = useState('pnl') // 'pnl', 'winRate', 'profitFactor', 'date'

  // Only hatched eggs
  const hatchedEggs = eggs
    .filter(e => e.status === 'hatched' && e.results)
    .sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          return b.results.winRate - a.results.winRate
        case 'profitFactor':
          return (b.results.profitFactor || 0) - (a.results.profitFactor || 0)
        case 'date':
          return new Date(b.hatchedAt) - new Date(a.hatchedAt)
        case 'pnl':
        default:
          return b.results.totalPnl - a.results.totalPnl
      }
    })

  // Dashboard stats
  const totalPnl = hatchedEggs.reduce((sum, e) => sum + (e.results?.totalPnl || 0), 0)
  const avgWinRate = hatchedEggs.length > 0
    ? hatchedEggs.reduce((sum, e) => sum + (e.results?.winRate || 0), 0) / hatchedEggs.length
    : 0
  const totalTrades = hatchedEggs.reduce((sum, e) => sum + (e.results?.totalTrades || 0), 0)
  const winningEggs = hatchedEggs.filter(e => e.results?.totalPnl >= 0).length
  const bestEgg = hatchedEggs[0]

  // Calculate overall profit factor
  const totalWins = hatchedEggs.reduce((sum, e) => {
    const eggSignals = signals.filter(s => e.trades.includes(s.id) && s.result === 'win')
    return sum + eggSignals.reduce((s, t) => s + (t.pnl || 0), 0)
  }, 0)
  const totalLosses = Math.abs(hatchedEggs.reduce((sum, e) => {
    const eggSignals = signals.filter(s => e.trades.includes(s.id) && s.result === 'loss')
    return sum + eggSignals.reduce((s, t) => s + (t.pnl || 0), 0)
  }, 0))
  const overallProfitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0

  const getEggSignals = (egg) => {
    return signals.filter(s => egg.trades.includes(s.id))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const sortOptions = [
    { id: 'pnl', label: 'PnL' },
    { id: 'winRate', label: 'Win Rate' },
    { id: 'profitFactor', label: 'Profit Factor' },
    { id: 'date', label: 'Recent' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header
        title="Hatchlings"
        subtitle={`${hatchedEggs.length} hatched eggs`}
      />

      {/* Dashboard */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total PnL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-quant-card border rounded-2xl p-4 ${
              totalPnl >= 0 ? 'stat-glow-positive' : 'stat-glow-negative'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {totalPnl >= 0 ? (
                <TrendingUp size={16} className="text-accent-green" />
              ) : (
                <TrendingDown size={16} className="text-accent-red" />
              )}
              <span className="text-xs text-gray-400">Total PnL</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${
              totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
            }`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 ml-1">USD</span>
          </motion.div>

          {/* Avg Win Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`bg-quant-card border rounded-2xl p-4 ${
              avgWinRate >= 50 ? 'stat-glow-positive' : 'stat-glow-negative'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-accent-cyan" />
              <span className="text-xs text-gray-400">Avg Win Rate</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${
              avgWinRate >= 50 ? 'text-accent-green' : 'text-accent-red'
            }`}>
              {avgWinRate.toFixed(1)}%
            </span>
          </motion.div>

          {/* Total Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-accent-cyan" />
              <span className="text-xs text-gray-400">Total Trades</span>
            </div>
            <span className="text-2xl font-bold font-mono text-white">
              {totalTrades}
            </span>
          </motion.div>

          {/* Profit Factor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Percent size={16} className="text-accent-cyan" />
              <span className="text-xs text-gray-400">Profit Factor</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${
              overallProfitFactor >= 1 ? 'text-accent-green' : 'text-accent-red'
            }`}>
              {overallProfitFactor === Infinity ? '∞' : overallProfitFactor.toFixed(2)}
            </span>
          </motion.div>
        </div>

        {/* Success Rate Bar */}
        {hatchedEggs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Egg Success Rate</span>
              <span className="text-sm font-mono text-accent-cyan">
                {winningEggs}/{hatchedEggs.length} profitable
              </span>
            </div>
            <div className="h-3 bg-quant-surface rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(winningEggs / hatchedEggs.length) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-full bg-gradient-to-r from-accent-green to-accent-cyan"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((hatchedEggs.length - winningEggs) / hatchedEggs.length) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-full bg-accent-red/50"
              />
            </div>
          </motion.div>
        )}

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar">
          <span className="text-xs text-gray-500 shrink-0">Sort by:</span>
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                sortBy === option.id
                  ? 'bg-accent-cyan/20 text-accent-cyan'
                  : 'bg-quant-surface text-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Hatchlings List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Award size={14} />
            Hatched Eggs
          </h2>

          {hatchedEggs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quant-surface flex items-center justify-center">
                <EggIcon size={48} status="hatched" />
              </div>
              <p className="text-gray-400 mb-2">No hatched eggs yet</p>
              <p className="text-sm text-gray-500">
                Eggs will hatch when all their trades complete
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {hatchedEggs.map((egg, index) => {
                const isWinner = egg.results?.totalPnl >= 0
                const rank = index + 1
                const isExpanded = expandedEgg === egg.id
                const eggSignals = getEggSignals(egg)

                return (
                  <motion.div
                    key={egg.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-quant-card border rounded-2xl overflow-hidden transition-all ${
                      isWinner ? 'border-accent-green/20' : 'border-accent-red/20'
                    }`}
                  >
                    {/* Main Card */}
                    <button
                      onClick={() => setExpandedEgg(isExpanded ? null : egg.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          rank === 1 ? 'bg-accent-yellow/20 text-accent-yellow' :
                          rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                          rank === 3 ? 'bg-accent-orange/20 text-accent-orange' :
                          'bg-quant-surface text-gray-500'
                        }`}>
                          {rank <= 3 ? (
                            <Trophy size={16} />
                          ) : rank}
                        </div>

                        {/* Egg Icon */}
                        <EggIcon size={44} status="hatched" winRate={egg.results?.winRate || 0} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white truncate">{egg.promptName}</h3>
                            {isExpanded ? (
                              <ChevronUp size={18} className="text-gray-500 shrink-0" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-500 shrink-0" />
                            )}
                          </div>

                          {/* KPIs */}
                          <div className="flex items-center gap-4 mt-2">
                            <div>
                              <span className="text-xs text-gray-500">Win</span>
                              <span className={`block font-mono text-sm ${
                                egg.results?.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {egg.results?.winRate || 0}%
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">PF</span>
                              <span className={`block font-mono text-sm ${
                                egg.results?.profitFactor >= 1 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {egg.results?.profitFactor === Infinity ? '∞' : (egg.results?.profitFactor || 0).toFixed(1)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Trades</span>
                              <span className="block font-mono text-sm text-white">
                                {egg.results?.totalTrades || 0}
                              </span>
                            </div>
                            <div className="ml-auto text-right">
                              <span className="text-xs text-gray-500">PnL</span>
                              <span className={`block font-mono font-bold ${
                                egg.results?.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {egg.results?.totalPnl >= 0 ? '+' : ''}{(egg.results?.totalPnl || 0).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-quant-border overflow-hidden"
                        >
                          <div className="p-4 bg-quant-surface/30 space-y-4">
                            {/* Extended Stats */}
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-quant-card rounded-xl p-3 text-center">
                                <span className="text-xs text-gray-500 block">Wins</span>
                                <span className="font-mono text-accent-green font-bold">
                                  {egg.results?.wins || 0}
                                </span>
                              </div>
                              <div className="bg-quant-card rounded-xl p-3 text-center">
                                <span className="text-xs text-gray-500 block">Losses</span>
                                <span className="font-mono text-accent-red font-bold">
                                  {egg.results?.losses || 0}
                                </span>
                              </div>
                              <div className="bg-quant-card rounded-xl p-3 text-center">
                                <span className="text-xs text-gray-500 block">Avg IPE</span>
                                <span className="font-mono text-accent-cyan font-bold">
                                  {egg.results?.avgIpe || 0}%
                                </span>
                              </div>
                              <div className="bg-quant-card rounded-xl p-3 text-center">
                                <span className="text-xs text-gray-500 block">MDD</span>
                                <span className="font-mono text-accent-red font-bold">
                                  {egg.results?.maxDrawdown || 0}%
                                </span>
                              </div>
                            </div>

                            {/* Date Info */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>Incubated: {formatDate(egg.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>Hatched: {formatDate(egg.hatchedAt)}</span>
                              </div>
                            </div>

                            {/* Trade History */}
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                                Trade History
                              </span>
                              <div className="space-y-2">
                                {eggSignals.map((signal) => (
                                  <div
                                    key={signal.id}
                                    className={`bg-quant-card rounded-xl p-3 border ${
                                      signal.result === 'win'
                                        ? 'border-accent-green/30'
                                        : 'border-accent-red/30'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                          signal.strategy === 'LONG'
                                            ? 'bg-accent-green/20 text-accent-green'
                                            : 'bg-accent-red/20 text-accent-red'
                                        }`}>
                                          {signal.strategy}
                                        </span>
                                        <span className="font-medium text-white">{signal.asset}</span>
                                      </div>
                                      <span className={`font-mono font-bold ${
                                        signal.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                                      }`}>
                                        {signal.pnl >= 0 ? '+' : ''}{(signal.pnl || 0).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                      <span>Entry: <span className="text-white font-mono">${signal.entry}</span></span>
                                      <span className={signal.result === 'win' ? 'text-accent-green' : 'text-accent-red'}>
                                        {signal.result === 'win' ? `TP: $${signal.takeProfit}` : `SL: $${signal.stopLoss}`}
                                      </span>
                                      <span className={`font-bold ${
                                        signal.ipe >= 80 ? 'text-accent-green' : 'text-accent-yellow'
                                      }`}>
                                        IPE: {signal.ipe}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  )
}
