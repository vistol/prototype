import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Target, AlertTriangle, Award, ChevronRight } from 'lucide-react'
import useStore from '../store/useStore'
import Header from '../components/Header'
import EggIcon from '../components/EggIcon'

export default function Hatchlings() {
  const { prompts, setSelectedPromptId } = useStore()

  // Only prompts with trades (hatched)
  const hatchedPrompts = prompts
    .filter(p => p.trades > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl)

  // Dashboard stats
  const totalPnl = hatchedPrompts.reduce((sum, p) => sum + p.totalPnl, 0)
  const avgWinRate = hatchedPrompts.length > 0
    ? hatchedPrompts.reduce((sum, p) => sum + p.winRate, 0) / hatchedPrompts.length
    : 0
  const totalTrades = hatchedPrompts.reduce((sum, p) => sum + p.trades, 0)
  const bestPrompt = hatchedPrompts[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header
        title="Hatchlings"
        subtitle="Your successful strategies"
      />

      {/* Dashboard */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
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
              <Award size={16} className="text-accent-cyan" />
              <span className="text-xs text-gray-400">Total Trades</span>
            </div>
            <span className="text-2xl font-bold font-mono text-white">
              {totalTrades}
            </span>
          </motion.div>

          {/* Best Performer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-quant-card border border-quant-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-accent-yellow" />
              <span className="text-xs text-gray-400">Top Performer</span>
            </div>
            <span className="text-sm font-semibold text-white truncate block">
              {bestPrompt?.name || '-'}
            </span>
          </motion.div>
        </div>

        {/* Hatchlings List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            All Hatchlings
          </h2>

          {hatchedPrompts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4">
                <EggIcon size={80} status="incubating" />
              </div>
              <p className="text-gray-400 mb-2">No hatched prompts yet</p>
              <p className="text-sm text-gray-500">
                Prompts that generate trades will appear here
              </p>
            </div>
          ) : (
            hatchedPrompts.map((prompt, index) => {
              const isWinner = prompt.totalPnl >= 0
              const rank = index + 1

              return (
                <motion.button
                  key={prompt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  className={`w-full bg-quant-card border rounded-2xl p-4 text-left transition-all hover:border-accent-cyan/30 ${
                    isWinner ? 'border-accent-green/20' : 'border-accent-red/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
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
                    <EggIcon size={44} status="hatched" winRate={prompt.winRate} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white truncate">{prompt.name}</h3>
                        <ChevronRight size={18} className="text-gray-500 flex-shrink-0" />
                      </div>

                      {/* KPIs */}
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-xs text-gray-500">Win Rate</span>
                          <span className={`block font-mono text-sm ${
                            prompt.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'
                          }`}>
                            {prompt.winRate}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">PF</span>
                          <span className={`block font-mono text-sm ${
                            prompt.profitFactor >= 1 ? 'text-accent-green' : 'text-accent-red'
                          }`}>
                            {prompt.profitFactor.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">MDD</span>
                          <span className="block font-mono text-sm text-accent-red">
                            {prompt.maxDrawdown}%
                          </span>
                        </div>
                        <div className="ml-auto text-right">
                          <span className="text-xs text-gray-500">PnL</span>
                          <span className={`block font-mono font-bold ${
                            prompt.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                          }`}>
                            {prompt.totalPnl >= 0 ? '+' : ''}{prompt.totalPnl.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>
    </motion.div>
  )
}
