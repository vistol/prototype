import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getSupabaseClient,
  syncPrompts,
  syncSignals,
  syncSettings,
  loadPrompts,
  loadSignals,
  loadSettings,
  deletePromptFromCloud
} from '../lib/supabase'
import { generateTradesFromPrompt } from '../lib/aiService'
import {
  fetchPrices,
  fetchBinance24hStats,
  calculateTradeStatus,
  calculatePnL,
  SUPPORTED_PAIRS
} from '../lib/priceService'

// Price refresh interval (15 minutes)
const PRICE_REFRESH_INTERVAL = 15 * 60 * 1000

// Execution time limits in milliseconds
const EXECUTION_LIMITS = {
  target: null, // No time limit, only SL/TP
  scalping: 60 * 60 * 1000, // 1 hour max
  intraday: 24 * 60 * 60 * 1000, // 24 hours max
  swing: 7 * 24 * 60 * 60 * 1000 // 7 days max
}

// Sample Eggs (incubating trade groups)
const initialEggs = [
  {
    id: 'egg-1',
    promptId: 'prompt-1',
    promptName: 'Alpha Momentum',
    status: 'incubating', // incubating | hatched
    trades: ['sig-1', 'sig-2'],
    totalCapital: 1000,
    executionTime: 'intraday',
    createdAt: '2024-01-22T10:00:00Z',
    hatchedAt: null,
    results: null
  }
]

// Sample data generators
const generateSignal = (promptId, promptName) => ({
  id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  promptId,
  promptName,
  asset: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'][Math.floor(Math.random() * 5)],
  strategy: Math.random() > 0.5 ? 'LONG' : 'SHORT',
  entry: (Math.random() * 50000 + 1000).toFixed(2),
  takeProfit: (Math.random() * 60000 + 5000).toFixed(2),
  stopLoss: (Math.random() * 45000 + 500).toFixed(2),
  ipe: Math.floor(Math.random() * 20 + 75),
  explanation: 'Based on technical analysis including RSI divergence, MACD crossover, and volume profile analysis. The current market structure suggests a high probability setup.',
  insights: [
    'Strong support level identified at current entry',
    'Volume increasing on recent candles',
    'RSI showing bullish divergence on 4H timeframe'
  ],
  createdAt: new Date().toISOString(),
  status: 'active'
})

const initialPrompts = [
  {
    id: 'prompt-1',
    name: 'Alpha Momentum',
    content: 'Analyze momentum indicators and volume patterns to identify high-probability breakout opportunities in crypto markets.',
    mode: 'auto',
    executionTime: 'intraday',
    capital: 1000,
    leverage: 5,
    aiModel: 'gemini',
    minIpe: 80,
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
    trades: 24,
    winRate: 68,
    profitFactor: 2.1,
    totalPnl: 1250.50,
    maxDrawdown: 8.5
  },
  {
    id: 'prompt-2',
    name: 'Mean Reversion Pro',
    content: 'Identify oversold conditions using RSI, Bollinger Bands, and order flow to execute mean reversion trades.',
    mode: 'manual',
    executionTime: 'swing',
    capital: 2500,
    leverage: 3,
    aiModel: 'gemini',
    minIpe: 85,
    status: 'active',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-22T16:30:00Z',
    trades: 12,
    winRate: 75,
    profitFactor: 2.8,
    totalPnl: 890.25,
    maxDrawdown: 5.2
  },
  {
    id: 'prompt-3',
    name: 'Scalp Hunter',
    content: 'Execute quick scalping trades based on order book imbalances and micro-structure analysis.',
    mode: 'auto',
    executionTime: 'scalping',
    capital: 500,
    leverage: 10,
    aiModel: 'openai',
    minIpe: 75,
    status: 'archived',
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    trades: 156,
    winRate: 52,
    profitFactor: 1.3,
    totalPnl: -120.75,
    maxDrawdown: 15.3
  }
]

const initialSignals = [
  {
    id: 'sig-1',
    promptId: 'prompt-1',
    promptName: 'Alpha Momentum',
    asset: 'BTC/USDT',
    strategy: 'LONG',
    entry: '42350.00',
    takeProfit: '44500.00',
    stopLoss: '41200.00',
    ipe: 85,
    explanation: 'Strong bullish momentum detected with increasing volume. MACD histogram showing expansion and price breaking above 20 EMA.',
    insights: [
      'Volume 35% above 20-day average',
      'Price reclaimed key support at 42000',
      'Funding rates neutral - room for upside'
    ],
    createdAt: '2024-01-22T14:30:00Z',
    status: 'active'
  },
  {
    id: 'sig-2',
    promptId: 'prompt-2',
    promptName: 'Mean Reversion Pro',
    asset: 'ETH/USDT',
    strategy: 'LONG',
    entry: '2280.00',
    takeProfit: '2450.00',
    stopLoss: '2180.00',
    ipe: 82,
    explanation: 'ETH showing oversold conditions on RSI with bullish divergence. Price at lower Bollinger Band with historical support.',
    insights: [
      'RSI at 28 - deeply oversold',
      'Bullish divergence on 4H chart',
      'Strong buyer interest at 2250 level'
    ],
    createdAt: '2024-01-22T12:15:00Z',
    status: 'active'
  },
  {
    id: 'sig-3',
    promptId: 'prompt-1',
    promptName: 'Alpha Momentum',
    asset: 'SOL/USDT',
    strategy: 'SHORT',
    entry: '98.50',
    takeProfit: '92.00',
    stopLoss: '102.00',
    ipe: 78,
    explanation: 'Bearish momentum building with decreasing volume on rallies. Price rejected at resistance with bearish engulfing pattern.',
    insights: [
      'Double top pattern forming',
      'Volume declining on recent highs',
      'Resistance at 100 holding strong'
    ],
    createdAt: '2024-01-22T10:00:00Z',
    status: 'closed',
    result: 'win',
    pnl: 156.25
  },
  {
    id: 'sig-4',
    promptId: 'prompt-3',
    promptName: 'Scalp Hunter',
    asset: 'BNB/USDT',
    strategy: 'LONG',
    entry: '312.50',
    takeProfit: '318.00',
    stopLoss: '309.00',
    ipe: 76,
    explanation: 'Order book showing strong bid support. Quick scalp opportunity with tight risk management.',
    insights: [
      'Large bid wall at 312',
      'Spread tightening',
      'Quick 1.5% target achievable'
    ],
    createdAt: '2024-01-21T16:45:00Z',
    status: 'closed',
    result: 'loss',
    pnl: -42.50
  }
]

const useStore = create(
  persist(
    (set, get) => ({
      // Prompts
      prompts: initialPrompts,
      addPrompt: (prompt) => {
        set((state) => ({
          prompts: [...state.prompts, {
            ...prompt,
            id: `prompt-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            trades: 0,
            winRate: 0,
            profitFactor: 0,
            totalPnl: 0,
            maxDrawdown: 0
          }]
        }))
        get().triggerSync()
      },
      updatePrompt: (id, updates) => {
        set((state) => ({
          prompts: state.prompts.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        }))
        get().triggerSync()
      },
      archivePrompt: (id) => {
        set((state) => ({
          prompts: state.prompts.map(p =>
            p.id === id ? { ...p, status: 'archived', updatedAt: new Date().toISOString() } : p
          )
        }))
        get().triggerSync()
      },
      deletePrompt: async (id) => {
        const client = get().getClient()
        if (client) {
          await deletePromptFromCloud(client, id)
        }
        set((state) => ({
          prompts: state.prompts.filter(p => p.id !== id),
          signals: state.signals.filter(s => s.promptId !== id)
        }))
        get().triggerSync()
      },

      // Signals
      signals: initialSignals,
      addSignal: (promptId) => {
        const prompt = get().prompts.find(p => p.id === promptId)
        if (prompt) {
          const signal = generateSignal(promptId, prompt.name)
          set((state) => ({ signals: [signal, ...state.signals] }))
          get().triggerSync()
          return signal
        }
      },
      updateSignal: (id, updates) => {
        set((state) => ({
          signals: state.signals.map(s => s.id === id ? { ...s, ...updates } : s)
        }))
        get().triggerSync()
      },

      // Eggs (incubating trade groups)
      eggs: initialEggs,

      // Pending trades (generated but not yet selected for incubation)
      pendingTrades: [],
      isGeneratingTrades: false,
      generationError: null,

      // Generate trades from prompt using AI
      generateTrades: async (prompt) => {
        set({ isGeneratingTrades: true, generationError: null, pendingTrades: [] })

        try {
          const numResults = prompt.numResults || 3
          const trades = await generateTradesFromPrompt(prompt, get().settings, numResults)

          set({
            pendingTrades: trades,
            isGeneratingTrades: false
          })

          return { success: true, trades }
        } catch (error) {
          set({
            isGeneratingTrades: false,
            generationError: error.message
          })
          return { success: false, error: error.message }
        }
      },

      // Toggle trade selection
      toggleTradeSelection: (tradeId) => {
        set((state) => ({
          pendingTrades: state.pendingTrades.map(t =>
            t.id === tradeId ? { ...t, selected: !t.selected } : t
          )
        }))
      },

      // Select all trades
      selectAllTrades: () => {
        set((state) => ({
          pendingTrades: state.pendingTrades.map(t => ({ ...t, selected: true }))
        }))
      },

      // Clear pending trades
      clearPendingTrades: () => {
        set({ pendingTrades: [], generationError: null })
      },

      // Create egg from selected trades (start incubation)
      createEgg: (prompt) => {
        const state = get()
        const selectedTrades = state.pendingTrades.filter(t => t.selected)

        if (selectedTrades.length === 0) return null

        // Add trades to signals with 'active' status
        const newSignals = selectedTrades.map(t => ({
          ...t,
          status: 'active',
          selected: undefined // Remove selection flag
        }))

        // Create the egg
        const egg = {
          id: `egg-${Date.now()}`,
          promptId: prompt.id,
          promptName: prompt.name,
          status: 'incubating',
          trades: newSignals.map(s => s.id),
          totalCapital: selectedTrades.reduce((sum, t) => sum + (t.capital || 0), 0),
          executionTime: prompt.executionTime,
          expiresAt: EXECUTION_LIMITS[prompt.executionTime]
            ? new Date(Date.now() + EXECUTION_LIMITS[prompt.executionTime]).toISOString()
            : null,
          createdAt: new Date().toISOString(),
          hatchedAt: null,
          results: null
        }

        set((state) => ({
          signals: [...newSignals, ...state.signals],
          eggs: [egg, ...state.eggs],
          pendingTrades: []
        }))

        get().triggerSync()

        return egg
      },

      // Update egg status
      updateEgg: (eggId, updates) => {
        set((state) => ({
          eggs: state.eggs.map(e =>
            e.id === eggId ? { ...e, ...updates } : e
          )
        }))
        get().triggerSync()
      },

      // Check if egg should hatch (all trades executed)
      checkEggHatch: (eggId) => {
        const state = get()
        const egg = state.eggs.find(e => e.id === eggId)

        if (!egg || egg.status === 'hatched') return false

        const eggSignals = state.signals.filter(s => egg.trades.includes(s.id))
        const allClosed = eggSignals.every(s => s.status === 'closed')

        if (allClosed) {
          // Calculate results
          const wins = eggSignals.filter(s => s.result === 'win').length
          const losses = eggSignals.filter(s => s.result === 'loss').length
          const totalPnl = eggSignals.reduce((sum, s) => sum + (s.pnl || 0), 0)
          const winRate = eggSignals.length > 0 ? (wins / eggSignals.length) * 100 : 0

          const results = {
            totalTrades: eggSignals.length,
            wins,
            losses,
            winRate: Math.round(winRate),
            totalPnl,
            profitFactor: losses > 0
              ? Math.abs(eggSignals.filter(s => s.result === 'win').reduce((sum, s) => sum + (s.pnl || 0), 0)) /
                Math.abs(eggSignals.filter(s => s.result === 'loss').reduce((sum, s) => sum + (s.pnl || 0), 0))
              : wins > 0 ? Infinity : 0
          }

          set((state) => ({
            eggs: state.eggs.map(e =>
              e.id === eggId ? {
                ...e,
                status: 'hatched',
                hatchedAt: new Date().toISOString(),
                results
              } : e
            )
          }))

          get().triggerSync()
          return true
        }

        return false
      },

      // Get incubating eggs
      getIncubatingEggs: () => {
        return get().eggs.filter(e => e.status === 'incubating')
      },

      // Get hatched eggs
      getHatchedEggs: () => {
        return get().eggs.filter(e => e.status === 'hatched')
      },

      // Onboarding
      onboardingCompleted: false,
      completeOnboarding: () => set({ onboardingCompleted: true }),
      resetOnboarding: () => set({ onboardingCompleted: false }),
      isConfigured: () => {
        const state = get()
        const hasAiKey = Object.values(state.settings.apiKeys).some(key => key && key.length > 0)
        const hasSupabase = state.settings.supabase.url && state.settings.supabase.anonKey
        return hasAiKey && hasSupabase
      },

      // Settings
      settings: {
        aiProvider: 'google',
        aiModel: 'gemini-pro',
        apiKeys: {
          google: '',
          openai: '',
          xai: ''
        },
        supabase: {
          url: '',
          anonKey: '',
          connected: false
        },
        tradingPlatform: {
          primary: 'binance',
          secondary: 'tradingview'
        },
        systemPrompt: `You are an autonomous quantitative research agent specialized in cryptocurrency markets.

Your task is to generate ONE completely new trading strategy every time you are invoked.

This strategy MUST be original and must NOT reuse the same combination of:
- Market hypothesis
- Indicators
- Timeframes
- Entry/exit logic
- Risk model
- Market regime assumption
as any previous strategy generated in this session or application lifecycle.

If there is any risk of similarity, you must deliberately explore a different conceptual space.

---

## SCIENTIFIC METHOD (MANDATORY)

You MUST follow the scientific method explicitly and structure the output accordingly:

1. OBSERVATION
   - Describe a specific, non-trivial market behavior observed in crypto markets.
   - The observation must be measurable and not opinion-based.

2. QUESTION
   - Formulate a precise research question derived from the observation.

3. HYPOTHESIS
   - Propose a falsifiable hypothesis.
   - The hypothesis must predict a measurable outcome.

4. EXPERIMENT DESIGN
   - Define:
     - Market type (spot, futures, perpetuals)
     - Timeframe(s)
     - Assets selection logic
     - Indicators or raw data used (can be non-standard)
     - Entry conditions
     - Exit conditions
     - Risk management rules
   - All rules must be explicit and unambiguous.

5. VARIABLES
   - Independent variables
   - Dependent variables
   - Control variables

6. METRICS & EVALUATION
   - Define objective performance metrics:
     - e.g. expectancy, Sharpe, max drawdown, win rate, profit factor
   - Define failure conditions (when the hypothesis is rejected).

7. RANDOMIZATION CONSTRAINT
   - Introduce controlled randomness in ONE of the following:
     - Indicator parameters
     - Asset universe
     - Time segmentation
     - Position sizing
   - Randomness must be bounded and justifiable.

8. BIAS & LIMITATIONS
   - Explicitly state possible biases and limitations of the strategy.

---

## CONSTRAINTS

- The strategy must be implementable programmatically.
- No vague language (e.g. "strong trend", "significant move").
- No price prediction or discretionary judgment.
- No reuse of common retail strategies unless fundamentally transformed.
- Do NOT mention news sentiment unless it is quantifiable.
- Do NOT optimize parameters; assume default values unless randomized.

---

## OUTPUT FORMAT (STRICT)

Return the strategy using this exact structure:

- Strategy Name
- Observation
- Research Question
- Hypothesis
- Experiment Design
- Variables
- Entry Rules
- Exit Rules
- Risk Management
- Randomized Component
- Evaluation Metrics
- Failure Criteria
- Biases & Limitations

---

## FINAL REQUIREMENT

Each strategy must explore a different market inefficiency or behavioral pattern.
If no truly new strategy can be generated, you must invent a new angle rather than repeating prior logic.`
      },
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }))
        get().triggerSync()
      },
      updateSystemPrompt: (prompt) => {
        set((state) => ({
          settings: { ...state.settings, systemPrompt: prompt }
        }))
        get().triggerSync()
      },
      updateApiKey: (provider, key) => set((state) => ({
        settings: {
          ...state.settings,
          apiKeys: { ...state.settings.apiKeys, [provider]: key }
        }
      })),
      updateSupabase: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          supabase: { ...state.settings.supabase, ...updates }
        }
      })),
      updateTradingPlatform: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          tradingPlatform: { ...state.settings.tradingPlatform, ...updates }
        }
      })),

      // Price State
      prices: {},
      priceStatus: {
        isFetching: false,
        lastUpdated: null,
        error: null,
        source: null,
        fallbackUsed: false
      },
      priceRefreshInterval: null,

      // Fetch prices for all active trades
      fetchAllPrices: async () => {
        const state = get()
        const { primary, secondary } = state.settings.tradingPlatform

        // Get unique assets from active signals and eggs
        const activeSignals = state.signals.filter(s => s.status === 'active')
        const incubatingEggs = state.eggs.filter(e => e.status === 'incubating')
        const eggTradeIds = incubatingEggs.flatMap(e => e.trades)
        const eggSignals = state.signals.filter(s => eggTradeIds.includes(s.id) && s.status === 'active')

        const allActiveSignals = [...activeSignals, ...eggSignals]
        const uniqueAssets = [...new Set(allActiveSignals.map(s => s.asset))]

        if (uniqueAssets.length === 0) {
          // If no active trades, still fetch main pairs for display
          uniqueAssets.push('BTC/USDT', 'ETH/USDT')
        }

        set({
          priceStatus: { ...state.priceStatus, isFetching: true, error: null }
        })

        try {
          const result = await fetchPrices(uniqueAssets, primary, secondary)

          if (result.error) {
            set({
              priceStatus: {
                isFetching: false,
                lastUpdated: state.priceStatus.lastUpdated,
                error: result.error,
                source: null,
                fallbackUsed: false
              }
            })
            return { success: false, error: result.error }
          }

          set({
            prices: { ...state.prices, ...result.prices },
            priceStatus: {
              isFetching: false,
              lastUpdated: new Date().toISOString(),
              error: null,
              source: result.source,
              fallbackUsed: result.fallbackUsed || false
            }
          })

          // After fetching prices, update trade statuses
          get().updateTradeStatuses()

          return { success: true, prices: result.prices }
        } catch (error) {
          set({
            priceStatus: {
              ...state.priceStatus,
              isFetching: false,
              error: error.message
            }
          })
          return { success: false, error: error.message }
        }
      },

      // Update trade statuses based on current prices
      updateTradeStatuses: () => {
        const state = get()
        const { prices, signals, eggs, settings } = state

        let signalsUpdated = false
        const updatedSignals = signals.map(signal => {
          if (signal.status !== 'active') return signal

          const priceData = prices[signal.asset]
          if (!priceData) return signal

          const currentPrice = priceData.price
          const tradeStatus = calculateTradeStatus(signal, currentPrice)

          if (tradeStatus.status === 'win' || tradeStatus.status === 'loss') {
            signalsUpdated = true
            // Find which egg this trade belongs to
            const egg = eggs.find(e => e.trades.includes(signal.id))
            const capital = egg ? (egg.totalCapital / egg.trades.length) : 100

            return {
              ...signal,
              status: 'closed',
              result: tradeStatus.status,
              exitPrice: tradeStatus.exitPrice,
              pnl: (tradeStatus.pnlPercent / 100) * capital,
              closedAt: new Date().toISOString()
            }
          }

          return {
            ...signal,
            currentPrice,
            unrealizedPnl: tradeStatus.pnlPercent
          }
        })

        if (signalsUpdated) {
          set({ signals: updatedSignals })

          // Check if any eggs should hatch
          eggs.filter(e => e.status === 'incubating').forEach(egg => {
            get().checkEggHatch(egg.id)
          })

          get().triggerSync()
        } else {
          set({ signals: updatedSignals })
        }
      },

      // Start auto-refresh interval
      startPriceRefresh: () => {
        const state = get()

        // Clear existing interval if any
        if (state.priceRefreshInterval) {
          clearInterval(state.priceRefreshInterval)
        }

        // Initial fetch
        get().fetchAllPrices()

        // Set up interval
        const intervalId = setInterval(() => {
          get().fetchAllPrices()
        }, PRICE_REFRESH_INTERVAL)

        set({ priceRefreshInterval: intervalId })
      },

      // Stop auto-refresh interval
      stopPriceRefresh: () => {
        const state = get()
        if (state.priceRefreshInterval) {
          clearInterval(state.priceRefreshInterval)
          set({ priceRefreshInterval: null })
        }
      },

      // Manual price refresh (sync button)
      refreshPrices: async () => {
        return await get().fetchAllPrices()
      },

      // Get price for a specific asset
      getPrice: (asset) => {
        const state = get()
        return state.prices[asset]?.price || null
      },

      // Get 24h stats for an asset
      fetch24hStats: async (asset) => {
        try {
          const stats = await fetchBinance24hStats(asset)
          return stats
        } catch (error) {
          console.error('Failed to fetch 24h stats:', error)
          return null
        }
      },

      // UI State
      activeTab: 'incubator',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Modal states
      isNewPromptModalOpen: false,
      setNewPromptModalOpen: (open) => set({ isNewPromptModalOpen: open }),

      isSignalDetailOpen: false,
      selectedSignal: null,
      openSignalDetail: (signal) => set({ isSignalDetailOpen: true, selectedSignal: signal }),
      closeSignalDetail: () => set({ isSignalDetailOpen: false, selectedSignal: null }),

      // Prompt detail
      selectedPromptId: null,
      setSelectedPromptId: (id) => set({ selectedPromptId: id }),

      // Cloud Sync State
      syncStatus: {
        syncing: false,
        lastSynced: null,
        error: null,
        loading: false
      },

      // Get Supabase client if configured
      getClient: () => {
        const state = get()
        const { url, anonKey } = state.settings.supabase
        if (url && anonKey) {
          return getSupabaseClient(url, anonKey)
        }
        return null
      },

      // Sync all data to cloud
      syncToCloud: async () => {
        const state = get()
        const client = state.getClient()

        if (!client) {
          return { success: false, error: 'Supabase not configured' }
        }

        set({ syncStatus: { ...state.syncStatus, syncing: true, error: null } })

        try {
          // Sync all data in parallel
          const [promptsResult, signalsResult, settingsResult] = await Promise.all([
            syncPrompts(client, state.prompts),
            syncSignals(client, state.signals),
            syncSettings(client, state.settings)
          ])

          const hasError = !promptsResult.success || !signalsResult.success || !settingsResult.success
          const errorMsg = promptsResult.error || signalsResult.error || settingsResult.error

          set({
            syncStatus: {
              syncing: false,
              lastSynced: hasError ? state.syncStatus.lastSynced : new Date().toISOString(),
              error: hasError ? errorMsg : null,
              loading: false
            }
          })

          // Update Supabase connected status
          if (!hasError) {
            set((s) => ({
              settings: {
                ...s.settings,
                supabase: { ...s.settings.supabase, connected: true }
              }
            }))
          }

          return { success: !hasError, error: errorMsg }
        } catch (err) {
          set({
            syncStatus: {
              ...state.syncStatus,
              syncing: false,
              error: err.message,
              loading: false
            }
          })
          return { success: false, error: err.message }
        }
      },

      // Load all data from cloud
      loadFromCloud: async () => {
        const state = get()
        const client = state.getClient()

        if (!client) {
          return { success: false, error: 'Supabase not configured' }
        }

        set({ syncStatus: { ...state.syncStatus, loading: true, error: null } })

        try {
          const [promptsResult, signalsResult, settingsResult] = await Promise.all([
            loadPrompts(client),
            loadSignals(client),
            loadSettings(client)
          ])

          // Merge cloud data with local (cloud takes precedence if newer)
          if (promptsResult.success && promptsResult.data.length > 0) {
            set({ prompts: promptsResult.data })
          }

          if (signalsResult.success && signalsResult.data.length > 0) {
            set({ signals: signalsResult.data })
          }

          if (settingsResult.success && settingsResult.data) {
            set((s) => ({
              settings: {
                ...s.settings,
                aiProvider: settingsResult.data.aiProvider || s.settings.aiProvider,
                aiModel: settingsResult.data.aiModel || s.settings.aiModel,
                systemPrompt: settingsResult.data.systemPrompt || s.settings.systemPrompt
              }
            }))
          }

          set({
            syncStatus: {
              syncing: false,
              lastSynced: new Date().toISOString(),
              error: null,
              loading: false
            },
            settings: {
              ...get().settings,
              supabase: { ...get().settings.supabase, connected: true }
            }
          })

          return { success: true }
        } catch (err) {
          set({
            syncStatus: {
              ...state.syncStatus,
              loading: false,
              error: err.message
            }
          })
          return { success: false, error: err.message }
        }
      },

      // Auto-sync helper (debounced in real usage)
      triggerSync: () => {
        const state = get()
        if (state.settings.supabase.connected && !state.syncStatus.syncing) {
          // Debounce sync to avoid too many requests
          setTimeout(() => {
            get().syncToCloud()
          }, 1000)
        }
      },
    }),
    {
      name: 'prompthatcher-storage',
      partialize: (state) => ({
        prompts: state.prompts,
        signals: state.signals,
        settings: state.settings,
        onboardingCompleted: state.onboardingCompleted
      })
    }
  )
)

export default useStore
