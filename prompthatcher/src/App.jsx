import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Cloud } from 'lucide-react'
import useStore from './store/useStore'
import BottomNav from './components/BottomNav'
import Incubator from './pages/Incubator'
import Signals from './pages/Signals'
import Hatchlings from './pages/Hatchlings'
import Settings from './pages/Settings'
import PromptDetail from './pages/PromptDetail'
import NewPromptModal from './components/NewPromptModal'
import SignalDetailModal from './components/SignalDetailModal'
import FAB from './components/FAB'
import Onboarding from './components/Onboarding'
import EggIcon from './components/EggIcon'

function App() {
  const {
    activeTab,
    isNewPromptModalOpen,
    setNewPromptModalOpen,
    isSignalDetailOpen,
    selectedPromptId,
    onboardingCompleted,
    startPriceRefresh,
    stopPriceRefresh,
    isCloudInitialized,
    isInitializing,
    initializeFromCloud,
    settings
  } = useStore()

  // Initialize data from Supabase cloud on app start
  useEffect(() => {
    if (onboardingCompleted && !isCloudInitialized && !isInitializing) {
      // Check if Supabase is configured
      if (settings.supabase?.url && settings.supabase?.anonKey) {
        initializeFromCloud()
      } else {
        // No Supabase, mark as initialized with empty data
        useStore.setState({ isCloudInitialized: true })
      }
    }
  }, [onboardingCompleted, isCloudInitialized, isInitializing, settings.supabase, initializeFromCloud])

  // Start price refresh interval when cloud data is loaded
  useEffect(() => {
    if (onboardingCompleted && isCloudInitialized) {
      // Start automatic price refresh (every 15 minutes)
      startPriceRefresh()

      // Cleanup on unmount
      return () => {
        stopPriceRefresh()
      }
    }
  }, [onboardingCompleted, isCloudInitialized, startPriceRefresh, stopPriceRefresh])

  // Show onboarding if not completed
  if (!onboardingCompleted) {
    return <Onboarding />
  }

  // Show loading screen while initializing from cloud
  if (!isCloudInitialized || isInitializing) {
    return (
      <div className="min-h-screen bg-quant-bg flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <EggIcon size={96} status="incubating" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={32} className="text-accent-cyan animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Loading from Cloud</h2>
          <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
            <Cloud size={16} />
            Syncing with Supabase...
          </p>
        </motion.div>
      </div>
    )
  }

  const renderPage = () => {
    if (selectedPromptId) {
      return <PromptDetail />
    }

    switch (activeTab) {
      case 'incubator':
        return <Incubator />
      case 'signals':
        return <Signals />
      case 'hatchlings':
        return <Hatchlings />
      case 'settings':
        return <Settings />
      default:
        return <Incubator />
    }
  }

  return (
    <div className="min-h-screen bg-quant-bg flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar pb-20 safe-area-top">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </main>

      {/* FAB for adding new prompts */}
      {activeTab === 'incubator' && !selectedPromptId && (
        <FAB onClick={() => setNewPromptModalOpen(true)} />
      )}

      {/* Bottom Navigation */}
      {!selectedPromptId && <BottomNav />}

      {/* Modals */}
      <AnimatePresence>
        {isNewPromptModalOpen && <NewPromptModal />}
        {isSignalDetailOpen && <SignalDetailModal />}
      </AnimatePresence>
    </div>
  )
}

export default App
