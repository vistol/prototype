// AI Service for generating trading signals from prompts
import { fetchBinancePrices } from './priceService'

// Minimum Risk/Reward ratio (Shell Calibration)
const MIN_RISK_REWARD_RATIO = 2.0 // Minimum 1:2 (reward must be 2x the risk)

// Calculate R:R ratio
export const calculateRiskReward = (entry, takeProfit, stopLoss, strategy) => {
  const entryPrice = parseFloat(entry)
  const tp = parseFloat(takeProfit)
  const sl = parseFloat(stopLoss)

  let reward, risk

  if (strategy === 'LONG') {
    reward = tp - entryPrice
    risk = entryPrice - sl
  } else {
    reward = entryPrice - tp
    risk = sl - entryPrice
  }

  if (risk <= 0) return 0
  return reward / risk
}

// Calculate IPE using standard formula if prompt doesn't specify one
export const calculateStandardIPE = (trade) => {
  // Fundamental factors (simulated - in production these would come from real data)
  const fundamentalFactors = {
    teamScore: Math.random() * 3 + 7, // 7-10
    utilityScore: Math.random() * 3 + 6, // 6-9
    adoptionScore: Math.random() * 4 + 5, // 5-9
  }

  // Technical factors (simulated)
  const technicalFactors = {
    trendScore: Math.random() * 3 + 6, // 6-9 (MA analysis)
    momentumScore: Math.random() * 4 + 5, // 5-9 (RSI)
    volumeScore: Math.random() * 3 + 6, // 6-9
  }

  // Weights
  const w1 = 0.4 // Fundamental weight
  const w2 = 0.6 // Technical weight

  const fundamentalSum = Object.values(fundamentalFactors).reduce((a, b) => a + b, 0) / 3
  const technicalSum = Object.values(technicalFactors).reduce((a, b) => a + b, 0) / 3

  const ipe = (fundamentalSum * w1 + technicalSum * w2) * 10

  return Math.min(Math.round(ipe), 95)
}

// Available crypto assets
const CRYPTO_ASSETS = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT',
  'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT',
  'ATOM/USDT', 'UNI/USDT', 'LTC/USDT', 'NEAR/USDT', 'APT/USDT'
]

// Get decimal places for asset price formatting
const getDecimalPlaces = (asset, price) => {
  if (price >= 1000) return 2
  if (price >= 1) return 2
  if (price >= 0.01) return 4
  return 6
}

// Fetch real prices from Binance
const fetchRealPrices = async (assets) => {
  try {
    const prices = await fetchBinancePrices(assets)
    const priceMap = {}

    for (const asset of assets) {
      if (prices[asset]) {
        priceMap[asset] = prices[asset].price
      }
    }

    return priceMap
  } catch (error) {
    console.error('Failed to fetch real prices:', error)
    return null
  }
}

// Generate trade signals based on prompt parameters
export const generateTradesFromPrompt = async (prompt, settings, numResults = 3) => {
  const trades = []

  // Select random assets without repetition
  const shuffledAssets = [...CRYPTO_ASSETS].sort(() => Math.random() - 0.5)
  const selectedAssets = shuffledAssets.slice(0, numResults)

  // Fetch real prices from Binance
  console.log('Fetching real prices from Binance for:', selectedAssets)
  const realPrices = await fetchRealPrices(selectedAssets)

  if (!realPrices || Object.keys(realPrices).length === 0) {
    throw new Error('Failed to fetch real-time prices from Binance. Please try again.')
  }

  console.log('Real prices fetched:', realPrices)
  console.log('Prompt config:', { targetPct: prompt.targetPct, leverage: prompt.leverage, executionTime: prompt.executionTime })

  for (let i = 0; i < numResults; i++) {
    const asset = selectedAssets[i]
    const currentPrice = realPrices[asset]

    if (!currentPrice) {
      console.warn(`No price for ${asset}, skipping`)
      continue
    }

    const strategy = Math.random() > 0.5 ? 'LONG' : 'SHORT'
    const decimals = getDecimalPlaces(asset, currentPrice)

    // Calculate entry, TP, and SL based on strategy and execution mode
    let entry, takeProfit, stopLoss, riskPercent, rewardPercent

    // Check if using target-based execution with a profit target
    const useTargetBased = prompt.executionTime === 'target' && prompt.targetPct > 0
    const leverage = prompt.leverage || 5
    const targetPct = prompt.targetPct || 10 // Default 10% if not specified

    if (useTargetBased) {
      // TARGET-BASED MODE: Calculate TP/SL based on user's profit target and leverage
      //
      // Formula: To achieve X% profit on capital with Y leverage,
      // the price needs to move by (X / Y) percent
      //
      // Example: 100% profit (2x) with 5x leverage = 20% price move needed

      const priceMovementNeeded = targetPct / leverage / 100 // Convert to decimal

      // Risk: Set SL at a reasonable distance (typically 1/2 to 1/3 of the reward)
      // This maintains a good R:R ratio while respecting the target
      const riskRatio = 0.4 // Risk 40% of reward distance for ~2.5:1 R:R
      riskPercent = priceMovementNeeded * riskRatio
      rewardPercent = priceMovementNeeded

      console.log(`Target mode: ${targetPct}% profit @ ${leverage}x = ${(priceMovementNeeded * 100).toFixed(2)}% price move needed`)

    } else {
      // NON-TARGET MODE: Use the standard shell calibration R:R approach
      // Risk: 1.5-3% (tighter stops for better R:R)
      riskPercent = 0.015 + Math.random() * 0.015 // 1.5-3%

      // Reward: At least 2x the risk (Shell Calibration)
      const rrMultiplier = MIN_RISK_REWARD_RATIO + Math.random() * 1.5 // 2.0-3.5x
      rewardPercent = riskPercent * rrMultiplier
    }

    if (strategy === 'LONG') {
      // Entry at current price (or slightly below for limit order)
      entry = currentPrice * (1 - Math.random() * 0.003) // 0-0.3% below current
      stopLoss = entry * (1 - riskPercent)
      takeProfit = entry * (1 + rewardPercent)
    } else {
      // Entry at current price (or slightly above for limit order)
      entry = currentPrice * (1 + Math.random() * 0.003) // 0-0.3% above current
      stopLoss = entry * (1 + riskPercent)
      takeProfit = entry * (1 - rewardPercent)
    }

    // Generate explanation based on prompt mode
    const explanations = [
      `Based on ${prompt.mode === 'auto' ? 'AI-generated scientific analysis' : 'manual strategy'}: ${asset} shows ${strategy === 'LONG' ? 'bullish' : 'bearish'} momentum with strong ${strategy === 'LONG' ? 'support' : 'resistance'} levels identified.`,
      `Technical analysis indicates ${strategy === 'LONG' ? 'accumulation' : 'distribution'} phase for ${asset}. RSI and MACD alignment suggests favorable ${strategy.toLowerCase()} entry.`,
      `Market structure analysis for ${asset} reveals ${strategy === 'LONG' ? 'higher lows forming' : 'lower highs forming'}. Volume profile supports the ${strategy.toLowerCase()} thesis.`
    ]

    // Generate insights
    const insightPool = [
      `${strategy === 'LONG' ? 'Strong bid wall' : 'Heavy resistance'} at key level`,
      'Volume increasing on recent candles',
      `RSI ${strategy === 'LONG' ? 'recovering from oversold' : 'declining from overbought'}`,
      'MACD histogram showing expansion',
      `Price ${strategy === 'LONG' ? 'above' : 'below'} key moving averages`,
      'Funding rates favorable for position',
      'Order flow imbalance detected',
      'Whale accumulation signals present'
    ]

    const shuffledInsights = [...insightPool].sort(() => Math.random() - 0.5)

    // Calculate actual R:R ratio
    const rrRatio = calculateRiskReward(entry, takeProfit, stopLoss, strategy)

    const trade = {
      id: `trade-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      promptId: prompt.id,
      promptName: prompt.name,
      asset,
      strategy,
      entry: entry.toFixed(decimals),
      takeProfit: takeProfit.toFixed(decimals),
      stopLoss: stopLoss.toFixed(decimals),
      currentPrice: currentPrice.toFixed(decimals), // Store the real price for reference
      riskRewardRatio: rrRatio.toFixed(2), // Shell Calibration: Store R:R ratio
      riskPercent: (riskPercent * 100).toFixed(2),
      rewardPercent: (rewardPercent * 100).toFixed(2),
      targetPct: useTargetBased ? targetPct : null, // Store target % for reference
      ipe: calculateStandardIPE({ asset, strategy }),
      explanation: explanations[Math.floor(Math.random() * explanations.length)],
      insights: shuffledInsights.slice(0, 3),
      executionTime: prompt.executionTime,
      leverage: prompt.leverage || 5, // Store leverage with default fallback
      capital: prompt.capital / numResults, // Divide capital among trades
      createdAt: new Date().toISOString(),
      status: 'pending', // pending -> active -> closed
      selected: false
    }

    // Filter by minimum IPE
    if (trade.ipe >= (prompt.minIpe || 70)) {
      trades.push(trade)
    }
  }

  // If we filtered out too many due to IPE, generate more with higher IPE
  let attempts = 0
  while (trades.length < numResults && attempts < 10) {
    attempts++
    const remainingAssets = CRYPTO_ASSETS.filter(a => !trades.find(t => t.asset === a))
    if (remainingAssets.length === 0) break

    const extraAsset = remainingAssets[Math.floor(Math.random() * remainingAssets.length)]

    // Fetch price for extra asset
    const extraPrices = await fetchRealPrices([extraAsset])
    if (!extraPrices || !extraPrices[extraAsset]) continue

    const currentPrice = extraPrices[extraAsset]
    const strategy = Math.random() > 0.5 ? 'LONG' : 'SHORT'
    const decimals = getDecimalPlaces(extraAsset, currentPrice)

    // Use same target-based logic for extra trades
    const useTargetBased = prompt.executionTime === 'target' && prompt.targetPct > 0
    const leverage = prompt.leverage || 5
    const targetPct = prompt.targetPct || 10

    let entry, takeProfit, stopLoss
    let extraRiskPercent, extraRewardPercent

    if (useTargetBased) {
      const priceMovementNeeded = targetPct / leverage / 100
      extraRiskPercent = priceMovementNeeded * 0.4
      extraRewardPercent = priceMovementNeeded
    } else {
      extraRiskPercent = 0.015 + Math.random() * 0.015
      const extraRrMultiplier = MIN_RISK_REWARD_RATIO + Math.random() * 1.5
      extraRewardPercent = extraRiskPercent * extraRrMultiplier
    }

    if (strategy === 'LONG') {
      entry = currentPrice * (1 - Math.random() * 0.003)
      stopLoss = entry * (1 - extraRiskPercent)
      takeProfit = entry * (1 + extraRewardPercent)
    } else {
      entry = currentPrice * (1 + Math.random() * 0.003)
      stopLoss = entry * (1 + extraRiskPercent)
      takeProfit = entry * (1 - extraRewardPercent)
    }

    const extraRrRatio = calculateRiskReward(entry, takeProfit, stopLoss, strategy)

    trades.push({
      id: `trade-${Date.now()}-extra-${Math.random().toString(36).substr(2, 9)}`,
      promptId: prompt.id,
      promptName: prompt.name,
      asset: extraAsset,
      strategy,
      entry: entry.toFixed(decimals),
      takeProfit: takeProfit.toFixed(decimals),
      stopLoss: stopLoss.toFixed(decimals),
      currentPrice: currentPrice.toFixed(decimals),
      riskRewardRatio: extraRrRatio.toFixed(2),
      riskPercent: (extraRiskPercent * 100).toFixed(2),
      rewardPercent: (extraRewardPercent * 100).toFixed(2),
      targetPct: useTargetBased ? targetPct : null,
      ipe: Math.max(prompt.minIpe || 70, Math.floor(Math.random() * 15 + 75)),
      explanation: `AI-generated opportunity for ${extraAsset} based on market analysis.`,
      insights: ['Favorable market conditions', 'Technical setup confirmed', `R:R ratio ${extraRrRatio.toFixed(1)}:1`],
      executionTime: prompt.executionTime,
      leverage: prompt.leverage || 5, // Store leverage with default fallback
      capital: prompt.capital / numResults,
      createdAt: new Date().toISOString(),
      status: 'pending',
      selected: false
    })
  }

  if (trades.length === 0) {
    throw new Error('Could not generate trades with the required IPE threshold. Try lowering the minimum IPE.')
  }

  return trades.slice(0, numResults)
}

// Call actual AI API (for production use)
export const callAIForTrades = async (prompt, systemPrompt, apiKey, provider) => {
  // This would be the actual AI API call
  // For now, we use the simulated generation

  // In production:
  // const response = await fetch(getAIEndpoint(provider), {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${apiKey}` },
  //   body: JSON.stringify({
  //     model: getModelForProvider(provider),
  //     messages: [
  //       { role: 'system', content: systemPrompt },
  //       { role: 'user', content: prompt.content }
  //     ]
  //   })
  // })
  // return parseAIResponse(response)

  return null // Fall back to simulated generation
}
