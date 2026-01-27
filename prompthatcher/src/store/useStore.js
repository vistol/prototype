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
