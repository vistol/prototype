// AI Service for generating trading signals from prompts

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

// Simulated current prices (in production, fetch from Binance API)
const SIMULATED_PRICES = {
  'BTC/USDT': 42500,
  'ETH/USDT': 2280,
  'SOL/USDT': 98,
  'BNB/USDT': 315,
  'XRP/USDT': 0.52,
  'ADA/USDT': 0.48,
  'AVAX/USDT': 35,
  'DOT/USDT': 7.2,
  'MATIC/USDT': 0.85,
  'LINK/USDT': 14.5,
  'ATOM/USDT': 9.8,
  'UNI/USDT': 6.2,
  'LTC/USDT': 72,
  'NEAR/USDT': 3.1,
  'APT/USDT': 8.5
}

// Generate trade signals based on prompt parameters
export const generateTradesFromPrompt = async (prompt, settings, numResults = 3) => {
  // In production, this would call the actual AI API
  // For now, we simulate the AI response

  const trades = []

  // Select random assets without repetition
  const shuffledAssets = [...CRYPTO_ASSETS].sort(() => Math.random() - 0.5)
  const selectedAssets = shuffledAssets.slice(0, numResults)

  for (let i = 0; i < numResults; i++) {
    const asset = selectedAssets[i]
    const currentPrice = SIMULATED_PRICES[asset]
    const strategy = Math.random() > 0.5 ? 'LONG' : 'SHORT'

    // Calculate entry, TP, and SL based on strategy
    let entry, takeProfit, stopLoss

    if (strategy === 'LONG') {
      entry = currentPrice * (1 - Math.random() * 0.02) // Slightly below current
      takeProfit = entry * (1 + 0.03 + Math.random() * 0.05) // 3-8% profit target
      stopLoss = entry * (1 - 0.02 - Math.random() * 0.03) // 2-5% stop loss
    } else {
      entry = currentPrice * (1 + Math.random() * 0.02) // Slightly above current
      takeProfit = entry * (1 - 0.03 - Math.random() * 0.05) // 3-8% profit target
      stopLoss = entry * (1 + 0.02 + Math.random() * 0.03) // 2-5% stop loss
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

    const trade = {
      id: `trade-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      promptId: prompt.id,
      promptName: prompt.name,
      asset,
      strategy,
      entry: entry.toFixed(asset.includes('BTC') ? 2 : asset.includes('XRP') || asset.includes('ADA') ? 4 : 2),
      takeProfit: takeProfit.toFixed(asset.includes('BTC') ? 2 : asset.includes('XRP') || asset.includes('ADA') ? 4 : 2),
      stopLoss: stopLoss.toFixed(asset.includes('BTC') ? 2 : asset.includes('XRP') || asset.includes('ADA') ? 4 : 2),
      ipe: calculateStandardIPE({ asset, strategy }),
      explanation: explanations[Math.floor(Math.random() * explanations.length)],
      insights: shuffledInsights.slice(0, 3),
      executionTime: prompt.executionTime,
      leverage: prompt.leverage,
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

  // If we filtered out too many, generate more until we have numResults
  while (trades.length < numResults) {
    const extraAsset = CRYPTO_ASSETS[Math.floor(Math.random() * CRYPTO_ASSETS.length)]
    if (!trades.find(t => t.asset === extraAsset)) {
      const strategy = Math.random() > 0.5 ? 'LONG' : 'SHORT'
      const currentPrice = SIMULATED_PRICES[extraAsset]
      let entry, takeProfit, stopLoss

      if (strategy === 'LONG') {
        entry = currentPrice * (1 - Math.random() * 0.02)
        takeProfit = entry * (1 + 0.03 + Math.random() * 0.05)
        stopLoss = entry * (1 - 0.02 - Math.random() * 0.03)
      } else {
        entry = currentPrice * (1 + Math.random() * 0.02)
        takeProfit = entry * (1 - 0.03 - Math.random() * 0.05)
        stopLoss = entry * (1 + 0.02 + Math.random() * 0.03)
      }

      trades.push({
        id: `trade-${Date.now()}-extra-${Math.random().toString(36).substr(2, 9)}`,
        promptId: prompt.id,
        promptName: prompt.name,
        asset: extraAsset,
        strategy,
        entry: entry.toFixed(2),
        takeProfit: takeProfit.toFixed(2),
        stopLoss: stopLoss.toFixed(2),
        ipe: Math.max(prompt.minIpe || 70, Math.floor(Math.random() * 15 + 75)),
        explanation: `AI-generated opportunity for ${extraAsset} based on market analysis.`,
        insights: ['Favorable market conditions', 'Technical setup confirmed', 'Risk/reward ratio optimal'],
        executionTime: prompt.executionTime,
        leverage: prompt.leverage,
        capital: prompt.capital / numResults,
        createdAt: new Date().toISOString(),
        status: 'pending',
        selected: false
      })
    }
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
