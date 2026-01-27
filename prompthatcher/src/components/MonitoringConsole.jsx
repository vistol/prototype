import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, ChevronDown, ChevronUp, Trash2, Circle, Wifi, WifiOff, Database, TrendingUp, Cpu, AlertTriangle, Egg } from 'lucide-react'
import useStore from '../store/useStore'

// Log type icons and colors
const LOG_CONFIG = {
  price: { icon: TrendingUp, color: 'text-accent-green', bgColor: 'bg-accent-green/20' },
  sync: { icon: Database, color: 'text-accent-cyan', bgColor: 'bg-accent-cyan/20' },
  trade: { icon: TrendingUp, color: 'text-accent-yellow', bgColor: 'bg-accent-yellow/20' },
  egg: { icon: Egg, color: 'text-purple-400', bgColor: 'bg-purple-400/20' },
  system: { icon: Terminal, color: 'text-blue-400', bgColor: 'bg-blue-400/20' },
  error: { icon: AlertTriangle, color: 'text-accent-red', bgColor: 'bg-accent-red/20' },
  ai: { icon: Cpu, color: 'text-pink-400', bgColor: 'bg-pink-400/20' }
}

function formatTimestamp(isoString) {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function LogEntry({ log, isNew }) {
  const config = LOG_CONFIG[log.type] || LOG_CONFIG.system
  const Icon = config.icon

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20 } : false}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 py-1.5 px-2 hover:bg-white/5 rounded transition-colors group"
    >
      <div className={`shrink-0 p-1 rounded ${config.bgColor}`}>
        <Icon size={12} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 font-mono leading-relaxed break-words">
          {log.message}
        </p>
      </div>
      <span className="shrink-0 text-[10px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTimestamp(log.timestamp)}
      </span>
    </motion.div>
  )
}

export default function MonitoringConsole() {
  const { activityLogs, clearLogs, priceStatus, syncStatus } = useStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef(null)
  const [newLogIds, setNewLogIds] = useState(new Set())

  // Mark new logs for animation
  useEffect(() => {
    if (activityLogs.length > 0 && activityLogs[0]) {
      const newId = activityLogs[0].id
      setNewLogIds(prev => new Set([...prev, newId]))

      // Remove from new after animation
      setTimeout(() => {
        setNewLogIds(prev => {
          const updated = new Set(prev)
          updated.delete(newId)
          return updated
        })
      }, 500)
    }
  }, [activityLogs])

  // Auto-scroll to top (newest) when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current && activityLogs.length > 0) {
      scrollRef.current.scrollTop = 0
    }
  }, [activityLogs, autoScroll])

  const isOnline = priceStatus.source !== null || syncStatus.lastSynced !== null
  const isFetching = priceStatus.isFetching || syncStatus.syncing || syncStatus.loading

  return (
    <div className="bg-quant-card border border-quant-border rounded-2xl overflow-hidden">
      {/* Console Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-quant-surface/50 hover:bg-quant-surface/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-accent-cyan" />
            <span className="text-sm font-medium text-white font-mono">Monitor</span>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
              isOnline ? 'bg-accent-green/20 text-accent-green' : 'bg-gray-500/20 text-gray-500'
            }`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>

            {/* Activity indicator */}
            {isFetching && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan text-[10px] font-mono">
                <Circle size={6} className="fill-current animate-pulse" />
                ACTIVE
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">
            {activityLogs.length} logs
          </span>
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Console Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mini toolbar */}
            <div className="px-3 py-2 border-b border-quant-border flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                {/* Log type filters - could be expanded */}
                <div className="flex items-center gap-1">
                  {Object.entries(LOG_CONFIG).map(([type, config]) => {
                    const Icon = config.icon
                    const count = activityLogs.filter(l => l.type === type).length
                    if (count === 0) return null
                    return (
                      <div
                        key={type}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bgColor}`}
                        title={`${type}: ${count}`}
                      >
                        <Icon size={10} className={config.color} />
                        <span className={`text-[10px] font-mono ${config.color}`}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearLogs()
                }}
                className="p-1 rounded hover:bg-quant-surface transition-colors"
                title="Clear logs"
              >
                <Trash2 size={12} className="text-gray-500 hover:text-gray-300" />
              </button>
            </div>

            {/* Log entries */}
            <div
              ref={scrollRef}
              className="max-h-64 overflow-y-auto hide-scrollbar bg-black/30"
            >
              {activityLogs.length === 0 ? (
                <div className="py-8 text-center">
                  <Terminal size={24} className="mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-500 font-mono">No activity yet</p>
                  <p className="text-[10px] text-gray-600 mt-1">Logs will appear here in real-time</p>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {activityLogs.map((log) => (
                    <LogEntry
                      key={log.id}
                      log={log}
                      isNew={newLogIds.has(log.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with last update time */}
            {priceStatus.lastUpdated && (
              <div className="px-3 py-1.5 border-t border-quant-border bg-black/20 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono">
                  Last price update: {formatTimestamp(priceStatus.lastUpdated)}
                </span>
                {priceStatus.source && (
                  <span className="text-[10px] text-accent-cyan font-mono uppercase">
                    {priceStatus.source}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
