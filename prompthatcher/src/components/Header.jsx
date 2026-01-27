import { motion } from 'framer-motion'
import SyncStatus from './SyncStatus'

export default function Header({ title, subtitle, rightAction }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 bg-quant-bg/80 backdrop-blur-lg border-b border-quant-border px-4 py-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold gradient-text">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus />
          {rightAction && rightAction}
        </div>
      </div>
    </motion.header>
  )
}
