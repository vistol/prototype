import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartPulse, Plus, Clock, Target, Zap, Trash2, Play, Pause, Settings, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import useStore from '../store/useStore'
import HealthCheckModal from './HealthCheckModal'

export default function HealthChecks() {
  const healthChecks = useStore((state) => state.healthChecks) || []
  const showHealthCheckModal = useStore((state) => state.showHealthCheckModal) || false
  const updateHealthCheck = useStore((state) => state.updateHealthCheck)
  const deleteHealthCheck = useStore((state) => state.deleteHealthCheck)
  const [expandedCheck, setExpandedCheck] = useState(null)
  const [editingCheck, setEditingCheck] = useState(null)

  const handleOpenModal = (check = null) => {
    setEditingCheck(check)
    useStore.setState({ showHealthCheckModal: true })
  }

  const handleCloseModal = () => {
    setEditingCheck(null)
    useStore.setState({ showHealthCheckModal: false })
  }

  const toggleCheckStatus = (checkId) => {
    const check = healthChecks.find(c => c.id === checkId)
    if (check) {
      updateHealthCheck(checkId, { isActive: !check.isActive })
    }
  }

  const handleDeleteCheck = (checkId) => {
    deleteHealthCheck(checkId)
  }

  const formatSchedule = (schedule) => {
    if (!schedule) return 'Not set'
    const { frequency, time, days } = schedule
    if (frequency === 'daily') return `Daily at ${time}`
    if (frequency === 'weekly') return `Weekly on ${days?.join(', ')} at ${time}`
    if (frequency === 'hourly') return `Every ${schedule.interval || 1} hour(s)`
    return 'Custom'
  }

  return (
    <div className="px-4 pb-4">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-accent-purple/20 to-accent-cyan/10 border border-accent-purple/30 rounded-2xl p-4 mb-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
            <HeartPulse size={20} className="text-accent-purple" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Health Checks</h3>
            <p className="text-xs text-gray-400">Automated batch preset monitoring</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Set up scheduled health checks to automatically run your prompts and monitor trading opportunities.
        </p>
        <button
          onClick={() => handleOpenModal()}
          className="w-full py-2.5 rounded-xl bg-accent-purple/20 border border-accent-purple/30 text-accent-purple font-medium text-sm flex items-center justify-center gap-2 hover:bg-accent-purple/30 transition-colors"
        >
          <Plus size={16} />
          Create Health Check
        </button>
      </motion.div>

      {/* Health Checks List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Settings size={14} />
          Active Presets ({healthChecks.length})
        </h2>

        {healthChecks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quant-surface flex items-center justify-center">
              <HeartPulse size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400 mb-2">No health checks configured</p>
            <p className="text-sm text-gray-500">
              Create a health check to automate your trading analysis
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {healthChecks.map((check, index) => {
              const isExpanded = expandedCheck === check.id

              return (
                <motion.div
                  key={check.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-quant-card border rounded-2xl overflow-hidden ${
                    check.isActive ? 'border-accent-green/30' : 'border-quant-border'
                  }`}
                >
                  {/* Check Header */}
                  <button
                    onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {/* Status Indicator */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        check.isActive ? 'bg-accent-green/20' : 'bg-quant-surface'
                      }`}>
                        {check.isActive ? (
                          <HeartPulse size={20} className="text-accent-green" />
                        ) : (
                          <Pause size={20} className="text-gray-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate">{check.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              check.isActive
                                ? 'bg-accent-green/20 text-accent-green'
                                : 'bg-quant-surface text-gray-500'
                            }`}>
                              {check.isActive ? 'Active' : 'Paused'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={16} className="text-gray-500" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-500" />
                            )}
                          </div>
                        </div>

                        {/* Info Row */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatSchedule(check.schedule)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target size={12} />
                            {check.prompts?.length || 0} prompts
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-quant-border overflow-hidden"
                      >
                        <div className="p-4 bg-quant-surface/30 space-y-3">
                          {/* Configuration Details */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-quant-card rounded-xl p-3 border border-quant-border">
                              <span className="text-[10px] text-gray-500 uppercase block mb-1">Capital</span>
                              <span className="text-sm font-mono text-white">${check.capital || 1000}</span>
                            </div>
                            <div className="bg-quant-card rounded-xl p-3 border border-quant-border">
                              <span className="text-[10px] text-gray-500 uppercase block mb-1">Leverage</span>
                              <span className="text-sm font-mono text-white">{check.leverage || 5}x</span>
                            </div>
                            <div className="bg-quant-card rounded-xl p-3 border border-quant-border">
                              <span className="text-[10px] text-gray-500 uppercase block mb-1">Target</span>
                              <span className="text-sm font-mono text-accent-green">+{check.targetPct || 10}%</span>
                            </div>
                            <div className="bg-quant-card rounded-xl p-3 border border-quant-border">
                              <span className="text-[10px] text-gray-500 uppercase block mb-1">Min IPE</span>
                              <span className="text-sm font-mono text-accent-cyan">{check.minIpe || 80}%</span>
                            </div>
                          </div>

                          {/* Prompts List */}
                          {check.prompts && check.prompts.length > 0 && (
                            <div className="bg-quant-card rounded-xl p-3 border border-quant-border">
                              <span className="text-[10px] text-gray-500 uppercase block mb-2">Included Prompts</span>
                              <div className="space-y-1">
                                {check.prompts.map((prompt, idx) => (
                                  <div key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                                    <Zap size={10} className="text-accent-cyan" />
                                    {prompt.name || prompt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Last Run Info */}
                          {check.lastRun && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <AlertCircle size={12} />
                              Last run: {new Date(check.lastRun).toLocaleString()}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCheckStatus(check.id)
                              }}
                              className={`flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                                check.isActive
                                  ? 'bg-accent-orange/20 border border-accent-orange/30 text-accent-orange'
                                  : 'bg-accent-green/20 border border-accent-green/30 text-accent-green'
                              }`}
                            >
                              {check.isActive ? <Pause size={14} /> : <Play size={14} />}
                              {check.isActive ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenModal(check)
                              }}
                              className="py-2.5 px-4 rounded-xl bg-quant-surface border border-quant-border text-gray-400 font-medium text-sm flex items-center justify-center gap-2 hover:text-white transition-colors"
                            >
                              <Settings size={14} />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCheck(check.id)
                              }}
                              className="py-2.5 px-4 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red font-medium text-sm flex items-center justify-center gap-2 hover:bg-accent-red/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* Health Check Modal */}
      <AnimatePresence>
        {showHealthCheckModal && (
          <HealthCheckModal
            check={editingCheck}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
