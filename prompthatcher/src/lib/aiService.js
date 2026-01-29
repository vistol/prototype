// AI Service for generating trading signals from prompts
import { fetchBinancePrices } from './priceService'

// Minimum Risk/Reward ratio (Shell Calibration)
const MIN_RISK_REWARD_RATIO = 2.0

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

// Build the prompt to send to AI
const buildAIPrompt = (userPrompt, settings, prices, config) => {
  const priceList = Object.entries(prices)
    .map(([asset, price]) => `- ${asset}: $${price.toLocaleString()}`)
    .join('\n')

  return `You are a quantitative trading analyst. Based on the user's trading strategy and current market prices, generate ${config.numResults || 3} specific trade signals.

## USER'S TRADING STRATEGY:
${userPrompt.content}

## CURRENT MARKET PRICES (Real-time from Binance):
${priceList}

## CONFIGURATION:
- Capital: $${config.capital || 1000}
- Leverage: ${config.leverage || 5}x
- Target Profit: ${config.targetPct || 10}% on capital
- Execution Mode: ${config.executionTime || 'target'}
- Minimum IPE Score: ${config.minIpe || 80}%

## REQUIRED OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON array. No markdown, no explanations outside the JSON.
Each trade must have this exact structure:

[
  {
    "asset": "BTC/USDT",
    "strategy": "LONG",
    "entry": 95000.00,
    "takeProfit": 97000.00,
    "stopLoss": 94000.00,
    "ipe": 85,
    "reasoning": "Detailed explanation of why this trade was selected based on the user's strategy...",
    "insights": ["Key factor 1", "Key factor 2", "Key factor 3"]
  }
]

## RULES:
1. Use ONLY the assets from the provided price list
2. Entry price should be very close to current price (within 0.5%)
3. For target-based trades: TP distance = (target% / leverage) from entry
4. Risk:Reward ratio must be at least 2:1
5. IPE score (Investment Potential Estimate) should be 70-95 based on setup quality
6. Reasoning must explain HOW the user's strategy applies to this specific trade
7. Strategy must be either "LONG" or "SHORT"
8. All prices must be numbers (not strings)

Generate ${config.numResults || 3} trades now:`
}

// Parse AI response to extract trades
const parseAIResponse = (responseText, prices, config) => {
  try {
    // Try to extract JSON from the response
    let jsonStr = responseText.trim()

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Find JSON array in the response
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const trades = JSON.parse(jsonStr)

    if (!Array.isArray(trades)) {
      throw new Error('Response is not an array')
    }

    // Validate and enhance each trade
    return trades.map((trade, i) => {
      const asset = trade.asset
      const currentPrice = prices[asset]

      if (!currentPrice) {
        console.warn(`AI suggested unknown asset: ${asset}`)
        return null
      }

      const decimals = getDecimalPlaces(asset, currentPrice)
      const entry = parseFloat(trade.entry) || currentPrice
      const takeProfit = parseFloat(trade.takeProfit)
      const stopLoss = parseFloat(trade.stopLoss)
      const strategy = trade.strategy?.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG'

      // Calculate R:R
      const rrRatio = calculateRiskReward(entry, takeProfit, stopLoss, strategy)

      // Calculate percentages
      let riskPercent, rewardPercent
      if (strategy === 'LONG') {
        rewardPercent = ((takeProfit - entry) / entry) * 100
        riskPercent = ((entry - stopLoss) / entry) * 100
      } else {
        rewardPercent = ((entry - takeProfit) / entry) * 100
        riskPercent = ((stopLoss - entry) / entry) * 100
      }

      return {
        id: `trade-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        promptId: config.promptId,
        promptName: config.promptName,
        asset,
        strategy,
        entry: entry.toFixed(decimals),
        takeProfit: takeProfit.toFixed(decimals),
        stopLoss: stopLoss.toFixed(decimals),
        currentPrice: currentPrice.toFixed(decimals),
        riskRewardRatio: rrRatio.toFixed(2),
        riskPercent: riskPercent.toFixed(2),
        rewardPercent: rewardPercent.toFixed(2),
        targetPct: config.targetPct || null,
        ipe: Math.min(95, Math.max(70, parseInt(trade.ipe) || 80)),
        explanation: trade.reasoning || 'AI-generated trade based on user strategy.',
        insights: trade.insights || ['Technical setup identified', 'Risk parameters calculated'],
        aiReasoning: trade.reasoning || 'No detailed reasoning provided.',
        executionTime: config.executionTime,
        leverage: config.leverage || 5,
        capital: config.capital / (config.numResults || 3),
        createdAt: new Date().toISOString(),
        status: 'pending',
        selected: false
      }
    }).filter(Boolean)

  } catch (error) {
    console.error('Failed to parse AI response:', error)
    console.error('Raw response:', responseText)
    throw new Error(`Failed to parse AI response: ${error.message}`)
  }
}

// Map legacy model names to current valid model names
const normalizeGeminiModel = (model) => {
  const legacyModels = {
    'gemini': 'gemini-1.5-flash',
    'gemini-2.0-flash-exp': 'gemini-1.5-flash',
    'gemini-1.5-flash-latest': 'gemini-1.5-flash',
    'gemini-1.5-pro-latest': 'gemini-1.5-pro',
    'gemini-1.0-pro': 'gemini-pro',
  }
  return legacyModels[model] || model
}

// Call Google Gemini API
const callGeminiAPI = async (prompt, apiKey, model = 'gemini-1.5-flash') => {
  // Normalize legacy model names
  const normalizedModel = normalizeGeminiModel(model)
  console.log(`Using Gemini model: ${normalizedModel} (requested: ${model})`)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${normalizedModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('No response from Gemini')
  }

  return data.candidates[0].content.parts[0].text
}

// Call OpenAI API
const callOpenAIAPI = async (prompt, apiKey, model = 'gpt-4') => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a quantitative trading analyst. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No response from OpenAI')
  }

  return data.choices[0].message.content
}

// Call xAI Grok API
const callGrokAPI = async (prompt, apiKey) => {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a quantitative trading analyst. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Grok API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No response from Grok')
  }

  return data.choices[0].message.content
}

// Main function to generate trades from prompt using AI
export const generateTradesFromPrompt = async (prompt, settings, numResults = 3) => {
  console.log('Generating trades with AI...')
  console.log('Prompt:', prompt.name)
  console.log('Provider:', settings.aiProvider)

  // Check for API key
  const apiKey = settings.apiKeys?.[settings.aiProvider]

  if (!apiKey) {
    throw new Error(`No API key configured for ${settings.aiProvider}. Please add your API key in Settings.`)
  }

  // Select random assets
  const shuffledAssets = [...CRYPTO_ASSETS].sort(() => Math.random() - 0.5)
  const selectedAssets = shuffledAssets.slice(0, Math.min(numResults * 2, 10)) // Get more for AI to choose from

  // Fetch real prices from Binance
  console.log('Fetching real prices from Binance for:', selectedAssets)
  const realPrices = await fetchRealPrices(selectedAssets)

  if (!realPrices || Object.keys(realPrices).length === 0) {
    throw new Error('Failed to fetch real-time prices from Binance. Please try again.')
  }

  console.log('Real prices fetched:', realPrices)

  // Prepare config
  const config = {
    promptId: prompt.id,
    promptName: prompt.name,
    capital: prompt.capital || 1000,
    leverage: prompt.leverage || 5,
    targetPct: prompt.targetPct || 10,
    executionTime: prompt.executionTime || 'target',
    minIpe: prompt.minIpe || 80,
    numResults: numResults
  }

  // Build prompt for AI
  const aiPrompt = buildAIPrompt(prompt, settings, realPrices, config)
  console.log('AI Prompt built, calling API...')

  // Call appropriate AI API
  let aiResponse
  try {
    switch (settings.aiProvider) {
      case 'google':
        aiResponse = await callGeminiAPI(aiPrompt, apiKey, settings.aiModel || 'gemini-1.5-flash')
        break
      case 'openai':
        aiResponse = await callOpenAIAPI(aiPrompt, apiKey, settings.aiModel || 'gpt-4')
        break
      case 'xai':
        aiResponse = await callGrokAPI(aiPrompt, apiKey)
        break
      default:
        throw new Error(`Unknown AI provider: ${settings.aiProvider}`)
    }
  } catch (error) {
    console.error('AI API call failed:', error)
    throw new Error(`AI API call failed: ${error.message}`)
  }

  console.log('AI Response received:', aiResponse.substring(0, 200) + '...')

  // Parse the response
  const trades = parseAIResponse(aiResponse, realPrices, config)

  if (trades.length === 0) {
    throw new Error('AI did not generate any valid trades. Please try again.')
  }

  // Filter by minimum IPE
  const filteredTrades = trades.filter(t => t.ipe >= (prompt.minIpe || 70))

  if (filteredTrades.length === 0) {
    throw new Error('No trades met the minimum IPE threshold. Try lowering the minimum IPE.')
  }

  console.log(`Generated ${filteredTrades.length} trades from AI`)

  return filteredTrades.slice(0, numResults)
}

// Calculate standard IPE (fallback if AI doesn't provide one)
export const calculateStandardIPE = (trade) => {
  const fundamentalFactors = {
    teamScore: Math.random() * 3 + 7,
    utilityScore: Math.random() * 3 + 6,
    adoptionScore: Math.random() * 4 + 5,
  }

  const technicalFactors = {
    trendScore: Math.random() * 3 + 6,
    momentumScore: Math.random() * 4 + 5,
    volumeScore: Math.random() * 3 + 6,
  }

  const w1 = 0.4
  const w2 = 0.6

  const fundamentalSum = Object.values(fundamentalFactors).reduce((a, b) => a + b, 0) / 3
  const technicalSum = Object.values(technicalFactors).reduce((a, b) => a + b, 0) / 3

  const ipe = (fundamentalSum * w1 + technicalSum * w2) * 10

  return Math.min(Math.round(ipe), 95)
}
