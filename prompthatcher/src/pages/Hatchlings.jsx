import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Target, Award, ChevronDown, ChevronUp, BarChart3, Percent, DollarSign, Clock, Calendar, Zap, Cpu, Hash, Filter } from 'lucide-react'
import useStore from '../store/useStore'
import Header from '../components/Header'
import EggIcon from '../components/EggIcon'

// Execution time labels
const EXECUTION_LABELS = {
  target: 'Target Based',
  scalping: 'Scalping',
  intraday: 'Intraday',
  swing: 'Swing'
}

// AI Model labels
const AI_MODEL_LABELS = {
  gemini: { name: 'Gemini', icon: '🔮' },
  openai: { name: 'GPT-4', icon: '🤖' },
  grok: { name: 'Grok', icon: '⚡' }
}

export default function Hatchlings() {
  const { eggs, signals } = useStore()
  const [expandedEgg, setExpandedEgg] = useState(null)
  const [sortBy, setSortBy] = useState('pnl') // 'pnl', 'winRate', 'profitFactor', 'date'
  const [filterBy, setFilterBy] = useState('all') // 'all', 'profitable', 'unprofitable', 'hatched', 'expired'

  // Check if egg is expired
  const isEggExpired = (egg) => egg.expiresAt && new Date(egg.expiresAt) <= new Date()

  // Calculate results for an egg (pnl is now percentage)
  const calculateEggResults = (egg) => {
    const eggSignals = signals.filter(s => egg.trades.includes(s.id))
    const closedSignals = eggSignals.filter(s => s.status === 'closed')

    if (closedSignals.length === 0) {
      return {
        totalTrades: eggSignals.length,
        closedTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        profitFactor: 0,
        avgIpe: eggSignals.length > 0 ? Math.round(eggSignals.reduce((sum, s) => sum + (s.ipe || 0), 0) / eggSignals.length) : 0,
        maxDrawdown: 0
      }
    }

    const wins = closedSignals.filter(s => s.result === 'win').length
    const losses = closedSignals.length - wins

    // pnl is now percentage - calculate average
    const totalPnlPercent = closedSignals.reduce((sum, s) => sum + (s.pnl || 0), 0)
    const avgPnl = totalPnlPercent / closedSignals.length

    // Profit factor using percentage
    const grossProfit = closedSignals.filter(s => (s.pnl || 0) > 0).reduce((sum, s) => sum + s.pnl, 0)
    const grossLoss = Math.abs(closedSignals.filter(s => (s.pnl || 0) < 0).reduce((sum, s) => sum + s.pnl, 0))

    const avgIpe = eggSignals.reduce((sum, s) => sum + (s.ipe || 0), 0) / eggSignals.length

    return {
      totalTrades: eggSignals.length,
      closedTrades: closedSignals.length,
      wins,
      losses,
      winRate: closedSignals.length > 0 ? Math.round((wins / closedSignals.length) * 100) : 0,
      totalPnl: avgPnl, // Average PnL percentage
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0),
      avgIpe: Math.round(avgIpe),
      maxDrawdown: 0
    }
  }

  // Get all completed eggs (hatched + expired)
  const completedEggs = eggs
    .filter(e => {
      const expired = isEggExpired(e)
      const isCompleted = e.status === 'hatched' || (e.status === 'incubating' && expired)
      if (!isCompleted) return false

      // Get results for filtering
      const results = e.results || calculateEggResults(e)

      // Apply filter
      switch (filterBy) {
        case 'profitable':
          return results.totalPnl >= 0
        case 'unprofitable':
          return results.totalPnl < 0
        case 'hatched':
          return e.status === 'hatched'
        case 'expired':
          return e.status === 'incubating' && expired
        default:
          return true
      }
    })
    .map(e => ({
      ...e,
      isExpired: isEggExpired(e),
      results: e.results || calculateEggResults(e)
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          return b.results.winRate - a.results.winRate
        case 'profitFactor':
          const pfA = a.results.profitFactor === Infinity ? 9999 : a.results.profitFactor
          const pfB = b.results.profitFactor === Infinity ? 9999 : b.results.profitFactor
          return pfB - pfA
        case 'date':
          return new Date(b.hatchedAt || b.expiresAt) - new Date(a.hatchedAt || a.expiresAt)
        case 'pnl':
        default:
          return b.results.totalPnl - a.results.totalPnl
      }
    })

  // Dashboard stats
  const totalPnl = completedEggs.reduce((sum, e) => sum + (e.results?.totalPnl || 0), 0)
  const avgWinRate = completedEggs.length > 0
    ? completedEggs.reduce((sum, e) => sum + (e.results?.winRate || 0), 0) / completedEggs.length
    : 0
  const totalTrades = completedEggs.reduce((sum, e) => sum + (e.results?.totalTrades || 0), 0)
  const winningEggs = completedEggs.filter(e => e.results?.totalPnl >= 0).length
  const hatchedCount = completedEggs.filter(e => e.status === 'hatched').length
  const expiredCount = completedEggs.filter(e => e.isExpired).length

  // Calculate overall profit factor
  const totalWins = completedEggs.reduce((sum, e) => {
    const eggSignals = signals.filter(s => e.trades.includes(s.id) && s.result === 'win')
    return sum + eggSignals.reduce((s, t) => s + (t.pnl || 0), 0)
  }, 0)
  const totalLosses = Math.abs(completedEggs.reduce((sum, e) => {
    const eggSignals = signals.filter(s => e.trades.includes(s.id) && s.result === 'loss')
    return sum + eggSignals.reduce((s, t) => s + (t.pnl || 0), 0)
  }, 0))
  const overallProfitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0

  const getEggSignals = (egg) => {
    return signals.filter(s => egg.trades.includes(s.id))
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const sortOptions = [
    { id: 'pnl', label: 'PnL' },
    { id: 'winRate', label: 'Win Rate' },
    { id: 'profitFactor', label: 'Profit Factor' },
    { id: 'date', label: 'Recent' }
  ]

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'profitable', label: 'Profitable' },
    { id: 'unprofitable', label: 'Loss' },
    { id: 'hatched', label: 'Hatched' },
    { id: 'expired', label: 'Expired' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header
        title="Hatchlings"
        subtitle={`${completedEggs.length} completed`}
      />

      {/* Dashboard */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total PnL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-quant-card border rounded-2xl p-4 ${
              totalPnl >= 0 ? 'border-accent-green/30' : 'border-accent-red/30'
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
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(1)}%
            </span>
          </motion.div>

          {/* Avg Win Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`bg-quant-card border rounded-2xl p-4 ${
              avgWinRate >= 50 ? 'border-accent-green/30' : 'border-accent-red/30'
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
        {completedEggs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Egg Success Rate</span>
              <span className="text-sm font-mono text-accent-cyan">
                {winningEggs}/{completedEggs.length} profitable
              </span>
            </div>
            <div className="h-3 bg-quant-surface rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(winningEggs / completedEggs.length) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-full bg-gradient-to-r from-accent-green to-accent-cyan"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((completedEggs.length - winningEggs) / completedEggs.length) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-full bg-accent-red/50"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{hatchedCount} hatched</span>
              <span>{expiredCount} expired</span>
            </div>
          </motion.div>
        )}

        {/* Filter Options */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto hide-scrollbar">
          <Filter size={14} className="text-gray-500 shrink-0" />
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setFilterBy(option.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                filterBy === option.id
                  ? 'bg-accent-cyan/20 text-accent-cyan'
                  : 'bg-quant-surface text-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar">
          <span className="text-xs text-gray-500 shrink-0">Sort:</span>
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                sortBy === option.id
                  ? 'bg-accent-purple/20 text-accent-purple'
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
            Results ({completedEggs.length})
          </h2>

          {completedEggs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quant-surface flex items-center justify-center">
                <EggIcon size={48} status="hatched" />
              </div>
              <p className="text-gray-400 mb-2">No completed eggs yet</p>
              <p className="text-sm text-gray-500">
                Eggs will appear here when all their trades complete
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {completedEggs.map((egg, index) => {
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
                      egg.isExpired
                        ? 'border-accent-orange/20'
                        : isWinner
                          ? 'border-accent-green/20'
                          : 'border-accent-red/20'
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
                        <EggIcon
                          size={44}
                          status={egg.isExpired ? 'expired' : 'hatched'}
                          winRate={egg.results?.winRate || 0}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white truncate">{egg.promptName}</h3>
                              {egg.isExpired && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-orange/20 text-accent-orange">
                                  Expired
                                </span>
                              )}
                            </div>
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
                                {egg.results?.closedTrades || 0}/{egg.results?.totalTrades || 0}
                              </span>
                            </div>
                            <div className="ml-auto text-right">
                              <span className="text-xs text-gray-500">PnL</span>
                              <span className={`block font-mono font-bold ${
                                egg.results?.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {egg.results?.totalPnl >= 0 ? '+' : ''}{(egg.results?.totalPnl || 0).toFixed(1)}%
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
                            {/* Configuration Section */}
                            {egg.config && (
                              <div className="bg-quant-card rounded-xl p-3 border border-quant-border">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2">Configuration</span>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign size={12} className="text-accent-cyan" />
                                    <span className="text-xs text-gray-400">Capital</span>
                                    <span className="text-xs font-mono text-white ml-auto">${egg.config.capital}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Zap size={12} className="text-accent-yellow" />
                                    <span className="text-xs text-gray-400">Leverage</span>
                                    <span className="text-xs font-mono text-white ml-auto">{egg.config.leverage}x</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-accent-purple" />
                                    <span className="text-xs text-gray-400">Time</span>
                                    <span className="text-xs text-white ml-auto">{EXECUTION_LABELS[egg.config.executionTime] || egg.config.executionTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Cpu size={12} className="text-accent-green" />
                                    <span className="text-xs text-gray-400">AI</span>
                                    <span className="text-xs text-white ml-auto">
                                      {AI_MODEL_LABELS[egg.config.aiModel]?.icon} {AI_MODEL_LABELS[egg.config.aiModel]?.name || egg.config.aiModel}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Target size={12} className="text-accent-orange" />
                                    <span className="text-xs text-gray-400">Min IPE</span>
                                    <span className="text-xs font-mono text-white ml-auto">{egg.config.minIpe}%</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Hash size={12} className="text-gray-400" />
                                    <span className="text-xs text-gray-400">Results</span>
                                    <span className="text-xs font-mono text-white ml-auto">{egg.config.numResults}</span>
                                  </div>
                                </div>
                              </div>
                            )}

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
                                <span className="text-xs text-gray-500 block">Status</span>
                                <span className={`font-mono font-bold ${
                                  egg.isExpired ? 'text-accent-orange' : 'text-accent-green'
                                }`}>
                                  {egg.isExpired ? 'Exp' : 'Done'}
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
                                <span>
                                  {egg.isExpired ? 'Expired' : 'Hatched'}: {formatDate(egg.hatchedAt || egg.expiresAt)}
                                </span>
                              </div>
                            </div>

                            {/* Trade History */}
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                                Trade History ({eggSignals.length})
                              </span>
                              <div className="space-y-2">
                                {eggSignals.map((signal) => (
                                  <div
                                    key={signal.id}
                                    className={`bg-quant-card rounded-xl p-3 border ${
                                      signal.result === 'win'
                                        ? 'border-accent-green/30'
                                        : signal.result === 'loss'
                                          ? 'border-accent-red/30'
                                          : 'border-quant-border'
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
                                        {signal.status !== 'closed' && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-orange/20 text-accent-orange">
                                            Open
                                          </span>
                                        )}
                                      </div>
                                      <span className={`font-mono font-bold ${
                                        signal.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                                      }`}>
                                        {signal.pnl !== undefined ? (
                                          <>{signal.pnl >= 0 ? '+' : ''}{(signal.pnl || 0).toFixed(2)}%</>
                                        ) : '-'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                      <span>Entry: <span className="text-white font-mono">${signal.entry}</span></span>
                                      <span className={signal.result === 'win' ? 'text-accent-green' : signal.result === 'loss' ? 'text-accent-red' : 'text-gray-400'}>
                                        {signal.result === 'win' ? `TP: $${signal.takeProfit}` : signal.result === 'loss' ? `SL: $${signal.stopLoss}` : `TP: $${signal.takeProfit}`}
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
