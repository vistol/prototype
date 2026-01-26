import { motion } from 'framer-motion'

export default function EggIcon({
  size = 48,
  status = 'incubating',
  winRate = 0,
  className = ''
}) {
  const getEggColor = () => {
    if (status === 'hatched') {
      return winRate >= 60 ? '#10b981' : '#ef4444'
    }
    return '#00f0ff'
  }

  const getGlowIntensity = () => {
    if (status === 'incubating') return 0.4
    if (status === 'hatched' && winRate >= 60) return 0.6
    return 0.3
  }

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${status === 'incubating' ? 'egg-incubating' : ''} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <defs>
        <linearGradient id={`eggGrad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: getEggColor(), stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        </linearGradient>
        <filter id={`glow-${status}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow */}
      <ellipse
        cx="50"
        cy="55"
        rx="32"
        ry="40"
        fill={getEggColor()}
        opacity={getGlowIntensity()}
        filter={`url(#glow-${status})`}
      />

      {/* Main egg */}
      <ellipse
        cx="50"
        cy="55"
        rx="28"
        ry="36"
        fill={`url(#eggGrad-${status})`}
      />

      {/* Inner shadow */}
      <ellipse
        cx="50"
        cy="55"
        rx="23"
        ry="31"
        fill="#0a0e17"
        opacity="0.25"
      />

      {/* Highlight */}
      <ellipse
        cx="42"
        cy="42"
        rx="7"
        ry="9"
        fill="white"
        opacity="0.35"
      />

      {/* Crack lines for hatched eggs */}
      {status === 'hatched' && (
        <g stroke={getEggColor()} strokeWidth="2" fill="none">
          <motion.path
            d="M 35 45 L 50 55 L 38 65"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.path
            d="M 50 55 L 65 48"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          />
          <motion.path
            d="M 50 55 L 58 68"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          />
        </g>
      )}
    </motion.svg>
  )
}
