import { motion } from 'framer-motion'
import { X, Check, TrendingUp, TrendingDown, Loader2, AlertCircle, CheckSquare, Square, Shield } from 'lucide-react'
import useStore from '../store/useStore'
import EggIcon from './EggIcon'

export default function TradeSelectionModal({ prompt, onClose, onComplete }) {
  const {
    pendingTrades,
    isGeneratingTrades,
    generationError,
    toggleTradeSelection,
    selectAllTrades,
    createEgg,
    clearPendingTrades
  } = useStore()

  const selectedCount = pendingTrades.filter(t => t.selected).length
  const allSelected = pendingTrades.length > 0 && selectedCount === pendingTrades.length

  const handleIncubate = () => {
    if (selectedCount === 0) return

    const egg = createEgg(prompt)
    if (egg) {
      onComplete(egg)
    }
  }

  const handleCancel = () => {
    clearPendingTrades()
    onClose()
  }

  if (isGeneratingTrades) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-quant-card rounded-2xl p-8 max-w-sm mx-4 text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <EggIcon size={96} status="incubating" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={32} className="text-accent-cyan animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Generating Trades</h3>
          <p className="text-sm text-gray-400">
            Fetching real-time prices from Binance and generating trading opportunities...
          </p>
        </motion.div>
      </motion.div>
    )
  }

  if (generationError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-quant-card rounded-2xl p-8 max-w-sm mx-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-red/20 flex items-center justify-center">
            <AlertCircle size={32} className="text-accent-red" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Generation Failed</h3>
          <p className="text-sm text-gray-400 mb-6">{generationError}</p>
          <button
            onClick={handleCancel}
            className="w-full py-3 rounded-xl bg-quant-surface text-white"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleCancel}
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
        <div className="shrink-0 bg-quant-card border-b border-quant-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Select Trades</h2>
              <p className="text-xs text-gray-500">{prompt.name}</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 rounded-full hover:bg-quant-surface transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Select All */}
          <button
            onClick={selectAllTrades}
            className="mt-3 flex items-center gap-2 text-sm text-accent-cyan"
          >
            {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            Select All ({pendingTrades.length} trades)
          </button>
        </div>

        {/* Trades List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3">
          {pendingTrades.map((trade, index) => {
            const isLong = trade.strategy === 'LONG'

            return (
              <motion.button
                key={trade.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleTradeSelection(trade.id)}
                className={`w-full text-left bg-quant-surface border-2 rounded-xl p-4 transition-all ${
                  trade.selected
                    ? 'border-accent-cyan bg-accent-cyan/5'
                    : 'border-quant-border hover:border-gray-600'
                }`}
              >
                {/* Trade Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isLong ? 'bg-accent-green/20' : 'bg-accent-red/20'
                    }`}>
                      {isLong ? (
                        <TrendingUp size={18} className="text-accent-green" />
                      ) : (
                        <TrendingDown size={18} className="text-accent-red" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isLong ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
                        }`}>
                          {trade.strategy}
                        </span>
                        <span className="font-semibold text-white">{trade.asset}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    trade.selected
                      ? 'border-accent-cyan bg-accent-cyan'
                      : 'border-gray-500'
                  }`}>
                    {trade.selected && <Check size={14} className="text-quant-bg" />}
                  </div>
                </div>

                {/* Price Levels */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-quant-bg/50 rounded-lg p-2">
                    <span className="text-xs text-accent-cyan block">Market</span>
                    <span className="font-mono text-sm text-accent-cyan">${trade.currentPrice}</span>
                  </div>
                  <div className="bg-quant-bg/50 rounded-lg p-2">
                    <span className="text-xs text-gray-500 block">Entry</span>
                    <span className="font-mono text-sm text-white">${trade.entry}</span>
                  </div>
                  <div className="bg-quant-bg/50 rounded-lg p-2">
                    <span className="text-xs text-accent-green block">TP</span>
                    <span className="font-mono text-sm text-accent-green">${trade.takeProfit}</span>
                  </div>
                  <div className="bg-quant-bg/50 rounded-lg p-2">
                    <span className="text-xs text-accent-red block">SL</span>
                    <span className="font-mono text-sm text-accent-red">${trade.stopLoss}</span>
                  </div>
                </div>

                {/* Shell Calibration: R:R Ratio & Risk/Reward */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-quant-bg/50 rounded-lg p-2 flex items-center gap-2">
                    <Shield size={14} className="text-accent-cyan" />
                    <div>
                      <span className="text-[10px] text-gray-500 block">R:R Ratio</span>
                      <span className={`font-mono text-sm font-bold ${
                        parseFloat(trade.riskRewardRatio) >= 2 ? 'text-accent-green' : 'text-accent-yellow'
                      }`}>
                        1:{trade.riskRewardRatio}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 bg-quant-bg/50 rounded-lg p-2">
                    <span className="text-[10px] text-gray-500 block">Risk</span>
                    <span className="font-mono text-sm text-accent-red">-{trade.riskPercent}%</span>
                  </div>
                  <div className="flex-1 bg-quant-bg/50 rounded-lg p-2">
                    <span className="text-[10px] text-gray-500 block">Reward</span>
                    <span className="font-mono text-sm text-accent-green">+{trade.rewardPercent}%</span>
                  </div>
                </div>

                {/* IPE Score */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Success Probability (IPE)</span>
                  <span className={`font-mono font-bold ${
                    trade.ipe >= 80 ? 'text-accent-green' : trade.ipe >= 70 ? 'text-accent-yellow' : 'text-accent-orange'
                  }`}>
                    {trade.ipe}%
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-quant-border bg-quant-card space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {selectedCount} of {pendingTrades.length} trades selected
            </span>
            {selectedCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-accent-green flex items-center gap-1">
                  <Shield size={12} />
                  R:R 1:{(
                    pendingTrades
                      .filter(t => t.selected)
                      .reduce((sum, t) => sum + parseFloat(t.riskRewardRatio || 0), 0) / selectedCount
                  ).toFixed(1)}
                </span>
                <span className="text-accent-cyan">
                  IPE: {Math.round(
                    pendingTrades
                      .filter(t => t.selected)
                      .reduce((sum, t) => sum + t.ipe, 0) / selectedCount
                  )}%
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <motion.button
            onClick={handleIncubate}
            disabled={selectedCount === 0}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-cyan to-electric-600 text-quant-bg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <EggIcon size={24} status="incubating" />
            Start Incubation ({selectedCount} trades)
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
