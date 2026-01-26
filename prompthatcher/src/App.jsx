import { AnimatePresence } from 'framer-motion'
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

function App() {
  const {
    activeTab,
    isNewPromptModalOpen,
    setNewPromptModalOpen,
    isSignalDetailOpen,
    selectedPromptId
  } = useStore()

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
