import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Target, Award, ChevronDown, ChevronUp, BarChart3, Percent, FileText, Filter, ExternalLink, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import Header from '../components/Header'
import EggIcon from '../components/EggIcon'

export default function Hatchlings() {
  const navigate = useNavigate()
  const { eggs, signals, prices, prompts } = useStore()
  const [expandedPrompt, setExpandedPrompt] = useState(null)
  const [sortBy, setSortBy] = useState('pnl') // 'pnl', 'winRate', 'eggs', 'trades'
  const [filterBy, setFilterBy] = useState('all') // 'all', 'profitable', 'unprofitable'

  // Check if egg is expired
  const isEggExpired = (egg) => egg.expiresAt && new Date(egg.expiresAt) <= new Date()

  // Check if egg is completed (hatched or expired)
  const isEggCompleted = (egg) => {
    return egg.status === 'hatched' || (egg.status === 'incubating' && isEggExpired(egg))
  }

  // Calculate PnL for a signal
  const getSignalPnl = (signal) => {
    if (signal.status === 'closed' && signal.pnl !== undefined) {
      return signal.pnl
    }
    if (signal.unrealizedPnl !== undefined) {
      return signal.unrealizedPnl
    }
    const currentPrice = prices[signal.asset]?.price
    if (!currentPrice) return 0
    const entry = parseFloat(signal.entry)
    if (signal.strategy === 'LONG') {
      return ((currentPrice - entry) / entry) * 100
    } else {
      return ((entry - currentPrice) / entry) * 100
    }
  }

  // Calculate egg results
  const calculateEggResults = (egg) => {
    const eggSignals = signals.filter(s => egg.trades.includes(s.id))
    if (eggSignals.length === 0) {
      return { totalPnl: 0, winRate: 0, totalTrades: 0, wins: 0, losses: 0 }
    }

    const pnlValues = eggSignals.map(s => getSignalPnl(s))
    const avgPnl = pnlValues.reduce((sum, p) => sum + p, 0) / pnlValues.length
    const wins = pnlValues.filter(p => p > 0).length
    const losses = pnlValues.filter(p => p < 0).length

    return {
      totalPnl: avgPnl,
      winRate: Math.round((wins / eggSignals.length) * 100),
      totalTrades: eggSignals.length,
      wins,
      losses
    }
  }

  // Aggregate data by prompt
  const promptStats = useMemo(() => {
    // Get all completed eggs
    const completedEggs = eggs.filter(isEggCompleted)

    // Group eggs by promptId or promptName
    const promptGroups = {}

    completedEggs.forEach(egg => {
      const promptKey = egg.promptId || egg.promptName || 'Unknown'
      const promptName = egg.promptName || 'Unknown Strategy'

      if (!promptGroups[promptKey]) {
        // Try to find the prompt in the prompts list
        const promptData = prompts.find(p => p.id === egg.promptId || p.name === egg.promptName)

        promptGroups[promptKey] = {
          id: promptKey,
          name: promptName,
          content: promptData?.content || egg.promptContent || '',
          eggs: [],
          totalPnl: 0,
          totalTrades: 0,
          totalWins: 0,
          totalLosses: 0
        }
      }

      const results = egg.results || calculateEggResults(egg)
      const eggData = {
        ...egg,
        results,
        isExpired: isEggExpired(egg)
      }

      promptGroups[promptKey].eggs.push(eggData)
      promptGroups[promptKey].totalTrades += results.totalTrades
      promptGroups[promptKey].totalWins += results.wins
      promptGroups[promptKey].totalLosses += results.losses
    })

    // Calculate aggregate stats for each prompt
    Object.values(promptGroups).forEach(group => {
      // Calculate average PnL across all eggs
      if (group.eggs.length > 0) {
        group.totalPnl = group.eggs.reduce((sum, e) => sum + (e.results?.totalPnl || 0), 0) / group.eggs.length
      }
      group.winRate = group.totalTrades > 0
        ? Math.round((group.totalWins / group.totalTrades) * 100)
        : 0
      group.eggWinRate = group.eggs.length > 0
        ? Math.round((group.eggs.filter(e => (e.results?.totalPnl || 0) >= 0).length / group.eggs.length) * 100)
        : 0

      // Sort eggs by PnL within each prompt
      group.eggs.sort((a, b) => (b.results?.totalPnl || 0) - (a.results?.totalPnl || 0))
    })

    // Convert to array and apply filters
    let result = Object.values(promptGroups)

    // Apply filter
    if (filterBy === 'profitable') {
      result = result.filter(p => p.totalPnl >= 0)
    } else if (filterBy === 'unprofitable') {
      result = result.filter(p => p.totalPnl < 0)
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          return b.winRate - a.winRate
        case 'eggs':
          return b.eggs.length - a.eggs.length
        case 'trades':
          return b.totalTrades - a.totalTrades
        case 'pnl':
        default:
          return b.totalPnl - a.totalPnl
      }
    })

    return result
  }, [eggs, signals, prices, prompts, filterBy, sortBy])

  // Global stats
  const globalStats = useMemo(() => {
    const allPnl = promptStats.reduce((sum, p) => sum + p.totalPnl * p.eggs.length, 0)
    const totalEggs = promptStats.reduce((sum, p) => sum + p.eggs.length, 0)
    const avgPnl = totalEggs > 0 ? allPnl / totalEggs : 0

    const totalTrades = promptStats.reduce((sum, p) => sum + p.totalTrades, 0)
    const totalWins = promptStats.reduce((sum, p) => sum + p.totalWins, 0)
    const avgWinRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0

    const profitablePrompts = promptStats.filter(p => p.totalPnl >= 0).length

    return {
      totalPrompts: promptStats.length,
      totalEggs,
      totalTrades,
      avgPnl,
      avgWinRate,
      profitablePrompts
    }
  }, [promptStats])

  const sortOptions = [
    { id: 'pnl', label: 'PnL' },
    { id: 'winRate', label: 'Win Rate' },
    { id: 'eggs', label: 'Most Eggs' },
    { id: 'trades', label: 'Most Trades' }
  ]

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'profitable', label: 'Profitable' },
    { id: 'unprofitable', label: 'Loss' }
  ]

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header
        title="Strategy Report"
        subtitle={`${globalStats.totalPrompts} strategies analyzed`}
      />

      <div className="px-4 pb-4">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Avg PnL per Egg */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-quant-card border rounded-2xl p-4 ${
              globalStats.avgPnl >= 0 ? 'border-accent-green/30' : 'border-accent-red/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {globalStats.avgPnl >= 0 ? (
                <TrendingUp size={16} className="text-accent-green" />
              ) : (
                <TrendingDown size={16} className="text-accent-red" />
              )}
              <span className="text-xs text-gray-400">Avg PnL / Egg</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${
              globalStats.avgPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
            }`}>
              {globalStats.avgPnl >= 0 ? '+' : ''}{globalStats.avgPnl.toFixed(1)}%
            </span>
          </motion.div>

          {/* Avg Win Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`bg-quant-card border rounded-2xl p-4 ${
              globalStats.avgWinRate >= 50 ? 'border-accent-green/30' : 'border-accent-red/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-accent-cyan" />
              <span className="text-xs text-gray-400">Win Rate</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${
              globalStats.avgWinRate >= 50 ? 'text-accent-green' : 'text-accent-red'
            }`}>
              {globalStats.avgWinRate}%
            </span>
          </motion.div>

          {/* Total Eggs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Layers size={16} className="text-accent-purple" />
              <span className="text-xs text-gray-400">Total Eggs</span>
            </div>
            <span className="text-2xl font-bold font-mono text-white">
              {globalStats.totalEggs}
            </span>
          </motion.div>

          {/* Total Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-accent-cyan" />
              <span className="text-xs text-gray-400">Total Trades</span>
            </div>
            <span className="text-2xl font-bold font-mono text-white">
              {globalStats.totalTrades}
            </span>
          </motion.div>
        </div>

        {/* Strategy Success Bar */}
        {globalStats.totalPrompts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Strategy Success Rate</span>
              <span className="text-sm font-mono text-accent-cyan">
                {globalStats.profitablePrompts}/{globalStats.totalPrompts} profitable
              </span>
            </div>
            <div className="h-3 bg-quant-surface rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(globalStats.profitablePrompts / globalStats.totalPrompts) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-full bg-gradient-to-r from-accent-green to-accent-cyan"
              />
            </div>
          </motion.div>
        )}

        {/* Filters */}
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

        {/* Prompts List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} />
            Strategies by Performance ({promptStats.length})
          </h2>

          {promptStats.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quant-surface flex items-center justify-center">
                <FileText size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-400 mb-2">No completed strategies yet</p>
              <p className="text-sm text-gray-500">
                Strategies will appear here when their eggs complete
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {promptStats.map((prompt, index) => {
                const isWinner = prompt.totalPnl >= 0
                const rank = index + 1
                const isExpanded = expandedPrompt === prompt.id

                return (
                  <motion.div
                    key={prompt.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`bg-quant-card border rounded-2xl overflow-hidden transition-all ${
                      isWinner ? 'border-accent-green/20' : 'border-accent-red/20'
                    }`}
                  >
                    {/* Prompt Header */}
                    <button
                      onClick={() => setExpandedPrompt(isExpanded ? null : prompt.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          rank === 1 ? 'bg-accent-yellow/20 text-accent-yellow' :
                          rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                          rank === 3 ? 'bg-accent-orange/20 text-accent-orange' :
                          'bg-quant-surface text-gray-500'
                        }`}>
                          {rank <= 3 ? <Trophy size={18} /> : `#${rank}`}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white truncate">{prompt.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 bg-quant-surface px-2 py-0.5 rounded-full">
                                {prompt.eggs.length} eggs
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={16} className="text-gray-500" />
                              ) : (
                                <ChevronDown size={16} className="text-gray-500" />
                              )}
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase">PnL</span>
                              <span className={`block font-mono text-sm font-bold ${
                                isWinner ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {isWinner ? '+' : ''}{prompt.totalPnl.toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase">Win Rate</span>
                              <span className={`block font-mono text-sm ${
                                prompt.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'
                              }`}>
                                {prompt.winRate}%
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase">Trades</span>
                              <span className="block font-mono text-sm text-white">
                                {prompt.totalTrades}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase">W/L</span>
                              <span className="block font-mono text-sm">
                                <span className="text-accent-green">{prompt.totalWins}</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-accent-red">{prompt.totalLosses}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded: Eggs List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-quant-border overflow-hidden"
                        >
                          <div className="p-4 bg-quant-surface/30 space-y-3">
                            {/* Strategy Content Preview */}
                            {prompt.content && (
                              <div className="p-3 bg-quant-bg/50 rounded-xl border border-quant-border">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Strategy</span>
                                <p className="text-xs text-gray-300 line-clamp-3">{prompt.content}</p>
                              </div>
                            )}

                            {/* Eggs Header */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 uppercase tracking-wider">
                                Eggs sorted by PnL ({prompt.eggs.length})
                              </span>
                              <span className="text-xs text-gray-500">
                                {prompt.eggs.filter(e => (e.results?.totalPnl || 0) >= 0).length} profitable
                              </span>
                            </div>

                            {/* Eggs List */}
                            <div className="space-y-2">
                              {prompt.eggs.map((egg, eggIndex) => {
                                const eggPnl = egg.results?.totalPnl || 0
                                const eggIsWinner = eggPnl >= 0

                                return (
                                  <div
                                    key={egg.id}
                                    className={`bg-quant-card rounded-xl p-3 border transition-all ${
                                      egg.isExpired
                                        ? 'border-accent-orange/20'
                                        : eggIsWinner
                                          ? 'border-accent-green/20'
                                          : 'border-accent-red/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Egg Rank within prompt */}
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                        eggIndex === 0 ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-quant-surface text-gray-500'
                                      }`}>
                                        {eggIndex + 1}
                                      </div>

                                      {/* Egg Icon */}
                                      <EggIcon
                                        size={32}
                                        status={egg.isExpired ? 'expired' : 'hatched'}
                                        winRate={egg.results?.winRate || 0}
                                      />

                                      {/* Egg Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-white">
                                            {formatDate(egg.createdAt)}
                                          </span>
                                          {egg.isExpired && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-orange/20 text-accent-orange">
                                              Expired
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                          <span>{egg.results?.totalTrades || 0} trades</span>
                                          <span>
                                            <span className="text-accent-green">{egg.results?.wins || 0}W</span>
                                            {' / '}
                                            <span className="text-accent-red">{egg.results?.losses || 0}L</span>
                                          </span>
                                          <span>WR: {egg.results?.winRate || 0}%</span>
                                        </div>
                                      </div>

                                      {/* PnL */}
                                      <div className="text-right">
                                        <span className={`font-mono font-bold ${
                                          eggIsWinner ? 'text-accent-green' : 'text-accent-red'
                                        }`}>
                                          {eggIsWinner ? '+' : ''}{eggPnl.toFixed(1)}%
                                        </span>
                                      </div>

                                      {/* Link to Incubator */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigate('/incubator')
                                        }}
                                        className="p-2 rounded-lg hover:bg-quant-surface text-gray-500 hover:text-accent-cyan transition-colors"
                                        title="View in Incubator"
                                      >
                                        <ExternalLink size={14} />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
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
