import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, FileText, Database, ChevronRight, Eye, EyeOff, Check, X, AlertCircle, Edit3, Plus, Crown, ChevronDown, ChevronUp, Cloud, RefreshCw, Download, Upload, Activity, TrendingUp } from 'lucide-react'
import useStore from '../store/useStore'
import Header from '../components/Header'

const tabs = ['AI Provider', 'Prompts', 'System']

const tradingPlatforms = [
  {
    id: 'binance',
    name: 'Binance',
    description: 'Largest crypto exchange by volume',
    icon: '🔶',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'tradingview',
    name: 'TradingView',
    description: 'Advanced charting platform',
    icon: '📊',
    color: 'from-blue-500 to-purple-500'
  }
]

const aiProviders = [
  {
    id: 'google',
    name: 'Google',
    models: ['gemini-pro', 'gemini-1.5-pro'],
    icon: '🔮',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    icon: '🤖',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    models: ['grok-1', 'grok-2'],
    icon: '⚡',
    color: 'from-orange-500 to-red-500'
  }
]

export default function Settings() {
  const {
    settings,
    prompts,
    updateSettings,
    updateApiKey,
    updateSupabase,
    updateTradingPlatform,
    updatePrompt,
    updateSystemPrompt,
    addPrompt,
    setNewPromptModalOpen,
    syncToCloud,
    loadFromCloud,
    syncStatus,
    priceStatus,
    refreshPrices
  } = useStore()

  const [activeTab, setActiveTab] = useState(0)
  const [showApiKey, setShowApiKey] = useState({})
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState(null)
  const [editingSystemPrompt, setEditingSystemPrompt] = useState(false)
  const [systemPromptContent, setSystemPromptContent] = useState(settings.systemPrompt || '')
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false)

  const handleSaveSystemPrompt = () => {
    updateSystemPrompt(systemPromptContent)
    setEditingSystemPrompt(false)
  }

  const handleSavePrompt = (promptId) => {
    updatePrompt(promptId, { content: editContent })
    setEditingPrompt(null)
  }

  const testSupabaseConnection = async () => {
    setTestingConnection(true)
    setConnectionResult(null)

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500))

    const success = settings.supabase.url && settings.supabase.anonKey
    setConnectionResult(success ? 'success' : 'error')
    if (success) {
      updateSupabase({ connected: true })
    }
    setTestingConnection(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Header title="Settings" subtitle="Configure your app" />

      {/* Tabs */}
      <div className="px-4 py-3">
        <div className="flex bg-quant-surface rounded-xl p-1">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === index
                  ? 'bg-quant-card text-white shadow'
                  : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {/* AI Provider Tab */}
          {activeTab === 0 && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Provider Selection */}
              <div className="space-y-3">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Select Provider</label>
                {aiProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => updateSettings({ aiProvider: provider.id })}
                    className={`w-full bg-quant-card border rounded-xl p-4 text-left transition-all ${
                      settings.aiProvider === provider.id
                        ? 'border-accent-cyan'
                        : 'border-quant-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <span className="font-semibold text-white block">{provider.name}</span>
                          <span className="text-xs text-gray-500">
                            {provider.models.length} models available
                          </span>
                        </div>
                      </div>
                      {settings.aiProvider === provider.id && (
                        <div className="w-5 h-5 rounded-full bg-accent-cyan flex items-center justify-center">
                          <Check size={14} className="text-quant-bg" />
                        </div>
                      )}
                    </div>

                    {/* API Key Input */}
                    {settings.aiProvider === provider.id && (
                      <div className="mt-4 pt-4 border-t border-quant-border">
                        <label className="text-xs text-gray-400 block mb-2">API Key</label>
                        <div className="relative">
                          <input
                            type={showApiKey[provider.id] ? 'text' : 'password'}
                            value={settings.apiKeys[provider.id] || ''}
                            onChange={(e) => updateApiKey(provider.id, e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full bg-quant-surface border border-quant-border rounded-lg px-4 py-2.5 pr-10 text-white text-sm font-mono"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowApiKey({ ...showApiKey, [provider.id]: !showApiKey[provider.id] })
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showApiKey[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {/* Model Selection */}
                        <label className="text-xs text-gray-400 block mt-4 mb-2">Model</label>
                        <div className="flex flex-wrap gap-2">
                          {provider.models.map((model) => (
                            <button
                              key={model}
                              onClick={(e) => {
                                e.stopPropagation()
                                updateSettings({ aiModel: model })
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                                settings.aiModel === model
                                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                                  : 'bg-quant-surface text-gray-400 border border-transparent'
                              }`}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Prompts Tab */}
          {activeTab === 1 && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* System Prompt (Parent) - Most Important */}
              <div className="bg-gradient-to-br from-accent-cyan/10 to-electric-600/10 border-2 border-accent-cyan/30 rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-accent-cyan/20">
                        <Crown size={18} className="text-accent-cyan" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">System Prompt</h3>
                        <span className="text-xs text-accent-cyan">Parent prompt for AUTO mode</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (editingSystemPrompt) {
                            handleSaveSystemPrompt()
                          } else {
                            setEditingSystemPrompt(true)
                            setSystemPromptContent(settings.systemPrompt || '')
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          editingSystemPrompt
                            ? 'bg-accent-green/20 text-accent-green'
                            : 'hover:bg-quant-surface text-gray-400'
                        }`}
                      >
                        {editingSystemPrompt ? <Check size={16} /> : <Edit3 size={16} />}
                      </button>
                      {!editingSystemPrompt && (
                        <button
                          onClick={() => setSystemPromptExpanded(!systemPromptExpanded)}
                          className="p-2 rounded-lg hover:bg-quant-surface text-gray-400 transition-colors"
                        >
                          {systemPromptExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {editingSystemPrompt ? (
                    <div className="space-y-3">
                      <textarea
                        value={systemPromptContent}
                        onChange={(e) => setSystemPromptContent(e.target.value)}
                        className="w-full bg-quant-surface border border-quant-border rounded-lg px-3 py-2 text-sm text-white font-mono resize-none"
                        rows={15}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSystemPrompt(false)}
                          className="flex-1 py-2 rounded-lg bg-quant-surface text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSystemPrompt}
                          className="flex-1 py-2 rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm text-gray-400 font-mono ${systemPromptExpanded ? '' : 'line-clamp-3'}`}>
                        {settings.systemPrompt}
                      </p>
                      {!systemPromptExpanded && (
                        <button
                          onClick={() => setSystemPromptExpanded(true)}
                          className="text-xs text-accent-cyan mt-2 hover:underline"
                        >
                          Show full prompt...
                        </button>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-accent-cyan/20">
                    <span className="text-xs text-accent-cyan bg-accent-cyan/10 px-2 py-1 rounded-full">
                      MASTER TEMPLATE
                    </span>
                    <span className="text-xs text-gray-500">
                      All AUTO prompts inherit from this
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-quant-border" />
                <span className="text-xs text-gray-500">Child Prompts</span>
                <div className="flex-1 h-px bg-quant-border" />
              </div>

              {/* Add New Button */}
              <button
                onClick={() => setNewPromptModalOpen(true)}
                className="w-full bg-quant-surface border border-dashed border-quant-border rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:border-accent-cyan hover:text-accent-cyan transition-all"
              >
                <Plus size={18} />
                <span>Create New Prompt</span>
              </button>

              {/* Prompts List */}
              <div className="space-y-3">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="bg-quant-card border border-quant-border rounded-xl overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{prompt.name}</h3>
                        <button
                          onClick={() => {
                            if (editingPrompt === prompt.id) {
                              handleSavePrompt(prompt.id)
                            } else {
                              setEditingPrompt(prompt.id)
                              setEditContent(prompt.content)
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            editingPrompt === prompt.id
                              ? 'bg-accent-green/20 text-accent-green'
                              : 'hover:bg-quant-surface text-gray-400'
                          }`}
                        >
                          {editingPrompt === prompt.id ? <Check size={16} /> : <Edit3 size={16} />}
                        </button>
                      </div>

                      {editingPrompt === prompt.id ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-quant-surface border border-quant-border rounded-lg px-3 py-2 text-sm text-white font-mono resize-none"
                          rows={4}
                        />
                      ) : (
                        <p className="text-sm text-gray-400 font-mono line-clamp-2">
                          {prompt.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-quant-border">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          prompt.mode === 'auto'
                            ? 'bg-accent-cyan/20 text-accent-cyan'
                            : 'bg-accent-orange/20 text-accent-orange'
                        }`}>
                          {prompt.mode.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Modified: {new Date(prompt.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* System Tab */}
          {activeTab === 2 && (
            <motion.div
              key="system"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Trading Platforms */}
              <div className="bg-quant-card border border-quant-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-accent-green/20">
                    <Activity size={20} className="text-accent-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Trading Platforms</h3>
                    <span className="text-xs text-gray-500">Real-time price data sources</span>
                  </div>
                  {priceStatus.lastUpdated && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-2 h-2 rounded-full ${priceStatus.error ? 'bg-accent-red' : 'bg-accent-green'} animate-pulse`} />
                      <span className="text-gray-400">
                        {priceStatus.source === 'binance' ? 'BN' : 'TV'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Primary Platform */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-accent-cyan/20 flex items-center justify-center text-[10px] text-accent-cyan font-bold">1</span>
                      Primary Platform
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {tradingPlatforms.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => updateTradingPlatform({ primary: platform.id })}
                          className={`p-3 rounded-xl border transition-all ${
                            settings.tradingPlatform?.primary === platform.id
                              ? 'bg-accent-cyan/10 border-accent-cyan'
                              : 'bg-quant-surface border-quant-border hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{platform.icon}</span>
                            <div className="text-left">
                              <span className="text-sm font-medium text-white block">{platform.name}</span>
                              <span className="text-[10px] text-gray-500">{platform.description}</span>
                            </div>
                          </div>
                          {settings.tradingPlatform?.primary === platform.id && (
                            <div className="flex justify-end mt-2">
                              <Check size={14} className="text-accent-cyan" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Platform (Fallback) */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-accent-yellow/20 flex items-center justify-center text-[10px] text-accent-yellow font-bold">2</span>
                      Fallback Platform
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {tradingPlatforms
                        .filter(p => p.id !== settings.tradingPlatform?.primary)
                        .map((platform) => (
                          <button
                            key={platform.id}
                            onClick={() => updateTradingPlatform({ secondary: platform.id })}
                            className={`p-3 rounded-xl border transition-all ${
                              settings.tradingPlatform?.secondary === platform.id
                                ? 'bg-accent-yellow/10 border-accent-yellow'
                                : 'bg-quant-surface border-quant-border hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{platform.icon}</span>
                              <div className="text-left">
                                <span className="text-sm font-medium text-white block">{platform.name}</span>
                                <span className="text-[10px] text-gray-500">Backup source</span>
                              </div>
                            </div>
                            {settings.tradingPlatform?.secondary === platform.id && (
                              <div className="flex justify-end mt-2">
                                <Check size={14} className="text-accent-yellow" />
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Price Status */}
                  <div className="pt-3 border-t border-quant-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">Price Refresh</span>
                      <span className="text-xs text-gray-500">Every 15 minutes</span>
                    </div>

                    <button
                      onClick={() => refreshPrices()}
                      disabled={priceStatus.isFetching}
                      className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                        priceStatus.isFetching
                          ? 'bg-quant-surface text-gray-400'
                          : 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30'
                      }`}
                    >
                      <RefreshCw size={16} className={priceStatus.isFetching ? 'animate-spin' : ''} />
                      {priceStatus.isFetching ? 'Fetching Prices...' : 'Refresh Prices Now'}
                    </button>

                    {/* Last Update Info */}
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-gray-500">Last updated:</span>
                      <span className="text-gray-400 font-mono">
                        {priceStatus.lastUpdated
                          ? new Date(priceStatus.lastUpdated).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </div>

                    {priceStatus.fallbackUsed && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent-yellow/20 text-accent-yellow text-xs mt-2">
                        <AlertCircle size={14} />
                        <span>Using fallback platform (primary unavailable)</span>
                      </div>
                    )}

                    {priceStatus.error && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent-red/20 text-accent-red text-xs mt-2">
                        <AlertCircle size={14} />
                        <span>{priceStatus.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Supabase */}
              <div className="bg-quant-card border border-quant-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-accent-cyan/20">
                    <Database size={20} className="text-accent-cyan" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Supabase</h3>
                    <span className="text-xs text-gray-500">Cloud database connection</span>
                  </div>
                  {settings.supabase.connected && (
                    <div className="ml-auto flex items-center gap-1 text-accent-green text-xs">
                      <Check size={14} />
                      Connected
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Project URL</label>
                    <input
                      type="text"
                      value={settings.supabase.url || ''}
                      onChange={(e) => updateSupabase({ url: e.target.value, connected: false })}
                      placeholder="https://xxx.supabase.co"
                      className="w-full bg-quant-surface border border-quant-border rounded-lg px-4 py-2.5 text-white text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Anon Key</label>
                    <input
                      type="password"
                      value={settings.supabase.anonKey || ''}
                      onChange={(e) => updateSupabase({ anonKey: e.target.value, connected: false })}
                      placeholder="eyJhbGci..."
                      className="w-full bg-quant-surface border border-quant-border rounded-lg px-4 py-2.5 text-white text-sm font-mono"
                    />
                  </div>

                  <button
                    onClick={testSupabaseConnection}
                    disabled={testingConnection}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${
                      testingConnection
                        ? 'bg-quant-surface text-gray-400'
                        : 'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30'
                    }`}
                  >
                    {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                  </button>

                  {connectionResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      connectionResult === 'success'
                        ? 'bg-accent-green/20 text-accent-green'
                        : 'bg-accent-red/20 text-accent-red'
                    }`}>
                      {connectionResult === 'success' ? (
                        <>
                          <Check size={16} />
                          <span className="text-sm">Connection successful!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} />
                          <span className="text-sm">Connection failed. Check your credentials.</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Sync Actions */}
                  {settings.supabase.url && settings.supabase.anonKey && (
                    <div className="pt-4 border-t border-quant-border space-y-3">
                      <h4 className="text-xs text-gray-400 uppercase tracking-wider">Data Sync</h4>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => syncToCloud()}
                          disabled={syncStatus.syncing}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-quant-surface border border-quant-border text-gray-400 hover:text-white hover:border-accent-cyan/50 transition-all disabled:opacity-50"
                        >
                          {syncStatus.syncing ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Upload size={16} />
                          )}
                          <span className="text-sm">Push to Cloud</span>
                        </button>

                        <button
                          onClick={() => loadFromCloud()}
                          disabled={syncStatus.loading}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-quant-surface border border-quant-border text-gray-400 hover:text-white hover:border-accent-cyan/50 transition-all disabled:opacity-50"
                        >
                          {syncStatus.loading ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                          <span className="text-sm">Pull from Cloud</span>
                        </button>
                      </div>

                      {/* Sync Status */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Last synced:</span>
                        <span className="text-gray-400 font-mono">
                          {syncStatus.lastSynced
                            ? new Date(syncStatus.lastSynced).toLocaleString()
                            : 'Never'
                          }
                        </span>
                      </div>

                      {syncStatus.error && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent-red/20 text-accent-red text-xs">
                          <AlertCircle size={14} />
                          <span>{syncStatus.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* App Info */}
              <div className="bg-quant-card border border-quant-border rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">App Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Version</span>
                    <span className="text-white font-mono">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Build</span>
                    <span className="text-white font-mono">2024.01.22</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage</span>
                    <span className="text-white font-mono">Local + Cloud</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
