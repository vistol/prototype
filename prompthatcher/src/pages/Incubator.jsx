import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, Clock, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Activity, DollarSign, Zap, Cpu, Target, Hash, Radio } from 'lucide-react'
import useStore from '../store/useStore'
import Header from '../components/Header'
import EggIcon from '../components/EggIcon'
import MonitoringConsole from '../components/MonitoringConsole'

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

export default function Incubator() {
  const { eggs, signals, prices, priceStatus } = useStore()
  const [activeFilter, setActiveFilter] = useState('live')
  const [expandedEgg, setExpandedEgg] = useState(null)
  const [expandedConfig, setExpandedConfig] = useState({}) // Track expanded config per egg
  const [showConsole, setShowConsole] = useState(false)

  // Toggle config expansion for an egg
  const toggleConfigExpand = (eggId) => {
    setExpandedConfig(prev => ({ ...prev, [eggId]: !prev[eggId] }))
  }

  // Check if egg is expired
  const isEggExpired = (egg) => egg.expiresAt && new Date(egg.expiresAt) <= new Date()

  // Filter eggs: Live (active & not expired) vs Completed (hatched or expired)
  const filteredEggs = eggs.filter(e => {
    const expired = isEggExpired(e)
    if (activeFilter === 'live') {
      return e.status === 'incubating' && !expired
    } else {
      // Completed tab shows: naturally hatched OR expired eggs
      return e.status === 'hatched' || (e.status === 'incubating' && expired)
    }
  })

  // Get egg status info
  const getEggStatus = (egg) => {
    const eggSignals = signals.filter(s => egg.trades.includes(s.id))
    const closedCount = eggSignals.filter(s => s.status === 'closed').length
    const isExpired = egg.expiresAt && new Date(egg.expiresAt) <= new Date()
    const activeCount = isExpired ? 0 : (eggSignals.length - closedCount)

    return {
      total: eggSignals.length,
      closed: closedCount,
      active: activeCount,
      isExpired,
      progress: eggSignals.length > 0 ? (closedCount / eggSignals.length) * 100 : 0
    }
  }

  // Format time remaining
  const formatTime = (egg) => {
    if (!egg.expiresAt) return null
    const diff = new Date(egg.expiresAt) - new Date()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h`
    return '<1h'
  }

  // Get current price
  const getPrice = (asset) => prices[asset]?.price || null

  // Calculate unrealized PnL
  const getPnl = (signal) => {
    const price = getPrice(signal.asset)
    if (!price || signal.status === 'closed') return null
    const entry = parseFloat(signal.entry)
    return signal.strategy === 'LONG'
      ? ((price - entry) / entry) * 100
      : ((entry - price) / entry) * 100
  }

  // Calculate egg PnL (capital-weighted)
  const getEggPnl = (egg, status) => {
    if (status.isExpired) return null
    const activeSignals = signals.filter(s => egg.trades.includes(s.id) && s.status === 'active')
    let weightedPnl = 0, totalCap = 0

    activeSignals.forEach(signal => {
      const pnl = getPnl(signal)
      const cap = parseFloat(signal.capital) || (egg.totalCapital / egg.trades.length)
      if (pnl !== null) {
        weightedPnl += (pnl / 100) * cap
        totalCap += cap
      }
    })

    return totalCap > 0 ? (weightedPnl / totalCap) * 100 : null
  }

  // CVD validation (simplified)
  const getCVD = (signal) => {
    const price = getPrice(signal.asset)
    if (!price) return null
    const delta = ((price - parseFloat(signal.entry)) / parseFloat(signal.entry)) * 100
    return signal.strategy === 'LONG' ? delta > -0.5 : delta < 0.5
  }

  // Calculate PnL percentage for a signal (handles both closed and active trades)
  const getSignalPnl = (signal) => {
    // If closed, use stored pnl
    if (signal.status === 'closed' && signal.pnl !== undefined) {
      return signal.pnl
    }
    // Calculate from current price (for active trades in expired eggs)
    const currentPrice = prices[signal.asset]?.price
    if (!currentPrice) return 0
    const entry = parseFloat(signal.entry)
    if (signal.strategy === 'LONG') {
      return ((currentPrice - entry) / entry) * 100
    } else {
      return ((entry - currentPrice) / entry) * 100
    }
  }

  // Calculate results for an egg (handles both closed and expired trades)
  const calculateEggResults = (egg) => {
    const eggSignals = signals.filter(s => egg.trades.includes(s.id))
    const closedSignals = eggSignals.filter(s => s.status === 'closed')
    const activeSignals = eggSignals.filter(s => s.status === 'active')

    // For expired eggs, treat active trades as "expired" with their unrealized PnL
    const expired = isEggExpired(egg)

    // All signals to consider for PnL calculation
    const signalsForPnl = expired ? eggSignals : closedSignals

    if (signalsForPnl.length === 0) {
      return {
        totalTrades: eggSignals.length,
        closedTrades: closedSignals.length,
        expiredTrades: expired ? activeSignals.length : 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        profitFactor: 0
      }
    }

    // Calculate PnL for all relevant signals
    const pnlValues = signalsForPnl.map(s => getSignalPnl(s))
    const avgPnl = pnlValues.reduce((sum, p) => sum + p, 0) / pnlValues.length

    // Count wins/losses based on PnL
    const wins = pnlValues.filter(p => p > 0).length
    const losses = pnlValues.filter(p => p < 0).length

    // Profit factor
    const grossProfit = pnlValues.filter(p => p > 0).reduce((sum, p) => sum + p, 0)
    const grossLoss = Math.abs(pnlValues.filter(p => p < 0).reduce((sum, p) => sum + p, 0))

    return {
      totalTrades: eggSignals.length,
      closedTrades: closedSignals.length,
      expiredTrades: expired ? activeSignals.length : 0,
      wins,
      losses,
      winRate: signalsForPnl.length > 0 ? Math.round((wins / signalsForPnl.length) * 100) : 0,
      totalPnl: avgPnl, // Average PnL percentage
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-4"
    >
      <Header
        title="Incubator"
        subtitle={`${filteredEggs.length} ${activeFilter === 'live' ? 'active' : 'completed'}`}
      />

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setActiveFilter('live')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeFilter === 'live'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              : 'bg-quant-surface text-gray-400 border border-transparent'
          }`}
        >
          <Radio size={16} />
          Live
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeFilter === 'completed'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              : 'bg-quant-surface text-gray-400 border border-transparent'
          }`}
        >
          <Archive size={16} />
          Completed
        </button>
        {/* Console Toggle */}
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`p-2.5 rounded-xl transition-all ${
            showConsole
              ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
              : 'bg-quant-surface text-gray-400 border border-transparent'
          }`}
        >
          <Activity size={16} />
        </button>
      </div>

      {/* Collapsible Console */}
      <AnimatePresence>
        {showConsole && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-3 overflow-hidden"
          >
            <MonitoringConsole />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eggs List */}
      <div className="px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredEggs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quant-surface flex items-center justify-center">
                <EggIcon size={48} status={activeFilter === 'live' ? 'incubating' : 'hatched'} />
              </div>
              <p className="text-gray-400 mb-1">No {activeFilter === 'live' ? 'live' : 'completed'} eggs</p>
              <p className="text-sm text-gray-500">
                {activeFilter === 'live' ? 'Create a prompt to start incubating' : 'Completed eggs appear here'}
              </p>
            </motion.div>
          ) : (
            filteredEggs.map((egg, index) => {
              const status = getEggStatus(egg)
              const eggSignals = signals.filter(s => egg.trades.includes(s.id))
              const isExpanded = expandedEgg === egg.id
              const isExpiredEgg = isEggExpired(egg)
              const isCompleted = egg.status === 'hatched' || isExpiredEgg
              const pnl = !isCompleted ? getEggPnl(egg, status) : null
              const timeLeft = formatTime(egg)

              // Calculate results for completed eggs (hatched or expired)
              const results = isCompleted
                ? (egg.results || calculateEggResults(egg))
                : null

              return (
                <motion.div
                  key={egg.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-quant-card rounded-2xl overflow-hidden border ${
                    isExpiredEgg
                      ? 'border-accent-orange/30'
                      : egg.status === 'hatched'
                        ? 'border-accent-green/30'
                        : 'border-quant-border'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedEgg(isExpanded ? null : egg.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Egg Icon with status indicator */}
                      <div className="relative flex-shrink-0">
                        <EggIcon
                          size={52}
                          status={isExpiredEgg ? 'expired' : egg.status}
                          winRate={results?.winRate || 0}
                        />
                        {!isCompleted && status.active > 0 && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-green rounded-full border-2 border-quant-card animate-pulse" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-white truncate text-base">{egg.promptName}</h3>
                          {pnl !== null && (
                            <span className={`text-lg font-mono font-bold flex-shrink-0 ${
                              pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                            }`}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                            </span>
                          )}
                        </div>

                        {/* Status row - single line */}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          {isCompleted ? (
                            // Completed egg status
                            <span className={isExpiredEgg ? 'text-accent-orange' : 'text-accent-green'}>
                              {isExpiredEgg ? '⏱ Expired' : '✓ Hatched'}
                              <span className="text-gray-500 mx-1">·</span>
                              <span className="text-gray-400">{results?.closedTrades || status.closed}/{status.total} closed</span>
                            </span>
                          ) : (
                            // Active egg status
                            <span className="text-accent-cyan">
                              {status.active} open
                              <span className="text-gray-500 mx-1">·</span>
                              <span className="text-gray-400">{status.closed}/{status.total} closed</span>
                            </span>
                          )}

                          {/* Time - only show for active eggs */}
                          {!isCompleted && timeLeft && (
                            <>
                              <span className="text-gray-600">|</span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {timeLeft}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Progress bar - minimal */}
                        {!isCompleted && (
                          <div className="mt-3 h-1.5 bg-quant-surface rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${status.progress}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-green"
                            />
                          </div>
                        )}
                      </div>

                      {/* Expand indicator */}
                      <div className="flex-shrink-0 text-gray-500">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Results for completed eggs (hatched or expired) */}
                    {isCompleted && results && (
                      <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-quant-border">
                        {[
                          { label: 'Closed', value: `${results.closedTrades}/${results.totalTrades}`, color: 'text-white' },
                          { label: 'Win Rate', value: `${results.winRate}%`, color: results.winRate >= 50 ? 'text-accent-green' : 'text-accent-red' },
                          { label: 'PF', value: results.profitFactor === Infinity ? '∞' : results.profitFactor.toFixed(1), color: results.profitFactor >= 1 ? 'text-accent-green' : 'text-accent-red' },
                          { label: 'PnL', value: `${results.totalPnl >= 0 ? '+' : ''}${results.totalPnl.toFixed(1)}%`, color: results.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red' }
                        ].map(stat => (
                          <div key={stat.label} className="text-center">
                            <span className="text-[10px] text-gray-500 uppercase block">{stat.label}</span>
                            <span className={`text-sm font-mono ${stat.color}`}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-quant-border overflow-hidden"
                      >
                        <div className="p-3 space-y-4 bg-quant-surface/20">
                          {/* Configuration Section - Collapsible Accordion */}
                          {(() => {
                            // Create fallback config for old eggs without config
                            const baseConfig = egg.config || {
                              capital: egg.totalCapital || 1000,
                              leverage: 5,
                              executionTime: egg.executionTime || 'target',
                              aiModel: 'gemini',
                              minIpe: 80,
                              numResults: eggSignals.length,
                              targetPct: null
                            }

                            // Calculate target % from trade data if not stored
                            let effectiveTargetPct = baseConfig.targetPct
                            if (!effectiveTargetPct && eggSignals.length > 0) {
                              const firstSignal = eggSignals[0]
                              const rewardPct = parseFloat(firstSignal.rewardPercent) || 0
                              const lev = firstSignal.leverage || baseConfig.leverage || 5
                              effectiveTargetPct = Math.round(rewardPct * lev)
                            }

                            const config = { ...baseConfig, targetPct: effectiveTargetPct }
                            const potentialGain = config.targetPct ? (config.capital * config.targetPct / 100) : 0
                            const finalAmount = config.capital + potentialGain
                            const priceMove = config.targetPct ? (config.targetPct / config.leverage) : 0
                            const isConfigExpanded = expandedConfig[egg.id]

                            return (
                            <div className="bg-quant-card rounded-xl border border-quant-border overflow-hidden">
                              {/* Collapsed Header - Always visible */}
                              <button
                                onClick={() => toggleConfigExpand(egg.id)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-quant-surface/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <DollarSign size={16} className="text-accent-cyan" />
                                  <span className="font-mono text-white font-medium">
                                    ${config.capital.toLocaleString()}
                                  </span>
                                  <span className="text-gray-500">→</span>
                                  <span className="font-mono text-accent-green font-medium">
                                    ${finalAmount.toLocaleString()}
                                  </span>
                                  {config.targetPct > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green font-medium">
                                      +{config.targetPct}%
                                    </span>
                                  )}
                                </div>
                                <ChevronDown
                                  size={18}
                                  className={`text-gray-500 transition-transform ${isConfigExpanded ? 'rotate-180' : ''}`}
                                />
                              </button>

                              {/* Expanded Content */}
                              <AnimatePresence>
                                {isConfigExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 pt-2 border-t border-quant-border">
                                      {/* Explanation */}
                                      {config.targetPct > 0 && (
                                        <div className="text-center text-sm text-gray-400 mb-3">
                                          Con <span className="text-white font-medium">{config.leverage}x</span> leverage,
                                          solo necesitas <span className="text-accent-cyan font-medium">{priceMove.toFixed(1)}%</span> de movimiento
                                        </div>
                                      )}

                                      {/* Config Pills Row */}
                                      <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500">
                                        <span>{EXECUTION_LABELS[config.executionTime] || config.executionTime}</span>
                                        <span>•</span>
                                        <span>{AI_MODEL_LABELS[config.aiModel]?.icon} {AI_MODEL_LABELS[config.aiModel]?.name || config.aiModel}</span>
                                        <span>•</span>
                                        <span>IPE {config.minIpe}%</span>
                                        <span>•</span>
                                        <span>{config.numResults} trade{config.numResults !== 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )})()}

                          {/* Trades Section */}
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2">Trades ({eggSignals.length})</span>
                            <div className="space-y-2">
                          {eggSignals.map((signal) => {
                            const isLong = signal.strategy === 'LONG'
                            const isClosed = signal.status === 'closed'
                            const price = getPrice(signal.asset)
                            const unrealizedPnl = getPnl(signal)
                            const cvdOk = !isClosed && !status.isExpired ? getCVD(signal) : null

                            return (
                              <div
                                key={signal.id}
                                className={`rounded-xl p-3 ${
                                  isClosed
                                    ? signal.result === 'win'
                                      ? 'bg-accent-green/5 border border-accent-green/20'
                                      : 'bg-accent-red/5 border border-accent-red/20'
                                    : 'bg-quant-card border border-quant-border'
                                }`}
                              >
                                {/* Trade header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isLong ? (
                                      <TrendingUp size={16} className="text-accent-green" />
                                    ) : (
                                      <TrendingDown size={16} className="text-accent-red" />
                                    )}
                                    <span className="font-medium text-white">{signal.asset}</span>
                                    {cvdOk !== null && (
                                      <span className={`w-1.5 h-1.5 rounded-full ${cvdOk ? 'bg-accent-green' : 'bg-accent-red'}`} />
                                    )}
                                  </div>

                                  {/* PnL display */}
                                  {isClosed ? (
                                    <span className={`font-mono font-bold ${
                                      signal.result === 'win' ? 'text-accent-green' : 'text-accent-red'
                                    }`}>
                                      {signal.pnl >= 0 ? '+' : ''}{signal.pnl?.toFixed(2) || '0.00'}%
                                    </span>
                                  ) : unrealizedPnl !== null ? (
                                    <span className={`font-mono font-bold ${
                                      unrealizedPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                                    }`}>
                                      {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}%
                                    </span>
                                  ) : status.isExpired ? (
                                    <span className="text-xs text-accent-orange">Expired</span>
                                  ) : (
                                    <span className="text-xs text-gray-500">Waiting...</span>
                                  )}
                                </div>

                                {/* Price levels - compact */}
                                <div className="flex items-center gap-4 mt-2 text-xs font-mono">
                                  <span className="text-gray-400">
                                    E <span className="text-white">{parseFloat(signal.entry).toFixed(2)}</span>
                                  </span>
                                  {price && !isClosed && (
                                    <span className="text-accent-cyan">
                                      Now {price.toFixed(2)}
                                    </span>
                                  )}
                                  <span className="text-accent-green ml-auto">
                                    TP {parseFloat(signal.takeProfit).toFixed(2)}
                                  </span>
                                  <span className="text-accent-red">
                                    SL {parseFloat(signal.stopLoss).toFixed(2)}
                                  </span>
                                </div>

                                {/* POTENTIAL PROFIT - Clear display for dummies */}
                                {!isClosed && (
                                  (() => {
                                    const entry = parseFloat(signal.entry)
                                    const tp = parseFloat(signal.takeProfit)
                                    const sl = parseFloat(signal.stopLoss)
                                    // Use signal values or fall back to egg config (default 5x leverage)
                                    const lev = signal.leverage || egg.config?.leverage || 5
                                    const totalCap = egg.config?.capital || signal.capital || 1000
                                    const numTrades = eggSignals.length || 1
                                    const cap = signal.capital || (totalCap / numTrades)

                                    // Calculate price movement percentages
                                    const tpMovePct = isLong
                                      ? ((tp - entry) / entry) * 100
                                      : ((entry - tp) / entry) * 100
                                    const slMovePct = isLong
                                      ? ((entry - sl) / entry) * 100
                                      : ((sl - entry) / entry) * 100

                                    // Calculate $ profit/loss with leverage
                                    const potentialProfit = (tpMovePct / 100) * lev * cap
                                    const potentialLoss = (slMovePct / 100) * lev * cap
                                    const profitPct = tpMovePct * lev

                                    return (
                                      <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-accent-green/10 to-accent-red/10 border border-quant-border">
                                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                          <span>SI GANAS ({isLong ? '↑' : '↓'} al TP)</span>
                                          <span>SI PIERDES ({isLong ? '↓' : '↑'} al SL)</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <div className="text-accent-green font-bold">
                                            <span className="text-lg">+${potentialProfit.toFixed(0)}</span>
                                            <span className="text-xs ml-1 opacity-70">(+{profitPct.toFixed(0)}%)</span>
                                          </div>
                                          <div className="text-accent-red font-bold text-right">
                                            <span className="text-lg">-${potentialLoss.toFixed(0)}</span>
                                            <span className="text-xs ml-1 opacity-70">(-{(slMovePct * lev).toFixed(0)}%)</span>
                                          </div>
                                        </div>
                                        <div className="text-[9px] text-gray-500 text-center mt-1">
                                          Capital: ${cap.toFixed(0)} × {lev}x leverage
                                        </div>
                                      </div>
                                    )
                                  })()
                                )}

                                {/* Progress bar - only for active trades */}
                                {price && !isClosed && !status.isExpired && (
                                  <div className="mt-2">
                                    {(() => {
                                      const entry = parseFloat(signal.entry)
                                      const tp = parseFloat(signal.takeProfit)
                                      const sl = parseFloat(signal.stopLoss)
                                      const range = tp - sl
                                      const progressRaw = ((price - sl) / range) * 100
                                      const entryRaw = ((entry - sl) / range) * 100
                                      const progress = Math.max(0, Math.min(100, isLong ? progressRaw : (100 - progressRaw)))
                                      const entryPos = Math.max(0, Math.min(100, isLong ? entryRaw : (100 - entryRaw)))
                                      const isProfit = progressRaw > entryRaw

                                      return (
                                        <div className="h-1 bg-quant-surface rounded-full relative">
                                          <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10"
                                            style={{ left: `${entryPos}%` }}
                                          />
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className={`h-full rounded-full ${
                                              isProfit ? 'bg-accent-green' : 'bg-accent-red'
                                            }`}
                                          />
                                        </div>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                            </div>
                          </div>
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
