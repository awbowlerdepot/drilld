import { useState } from 'react'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import { CustomerManagement } from './components/customers/CustomerManagement'
import { BowlingBallManagement } from './components/balls/BowlingBallManagement'
import { WorkOrderManagement } from './components/workorders/WorkOrderManagement'
import { SettingsPage } from './components/settings/SettingsPage'

// Uncomment these imports when you have Amplify configured
// import { AuthWrapper } from './components/auth/AuthWrapper'
// import { ProtectedRoute } from './components/auth/ProtectedRoute'
// import { useAuthenticator } from '@aws-amplify/ui-react'

// For development without authentication, use this version:
function App() {
    const [activeTab, setActiveTab] = useState('customers')
    const [searchTerm, setSearchTerm] = useState('')

    const handleSettingsClick = () => {
        setActiveTab('settings');
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'customers':
                return <CustomerManagement searchTerm={searchTerm} />
            case 'balls':
                return <BowlingBallManagement searchTerm={searchTerm} />
            case 'workorders':
                return <WorkOrderManagement searchTerm={searchTerm} />
            case 'analytics':
                return <div className="text-center py-12">Analytics Dashboard - Coming soon...</div>
            case 'settings':
                return <SettingsPage searchTerm={searchTerm} />
            default:
                return <div className="text-center py-12">Coming soon...</div>
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSettingsClick={handleSettingsClick}
            />
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {renderActiveTab()}
            </main>
        </div>
    )
}

// When you're ready to add authentication, replace the above with this:
/*
function AppContent() {
  const { user, signOut } = useAuthenticator((context) => [context.user, context.signOut])
  const [activeTab, setActiveTab] = useState('customers')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSettingsClick = () => {
    setActiveTab('settings');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'customers':
        return (
          <ProtectedRoute requiredPermissions={['read:customers']}>
            <CustomerManagement searchTerm={searchTerm} />
          </ProtectedRoute>
        )
      case 'drillsheets':
        return (
          <ProtectedRoute requiredPermissions={['read:drillsheets']}>
            <DrillSheetManagement searchTerm={searchTerm} />
          </ProtectedRoute>
        )
      case 'balls':
        return (
          <ProtectedRoute requiredPermissions={['read:balls']}>
            <BowlingBallManagement searchTerm={searchTerm} />
          </ProtectedRoute>
        )
      case 'workorders':
        return (
          <ProtectedRoute requiredPermissions={['read:workorders']}>
            <WorkOrderManagement searchTerm={searchTerm} />
          </ProtectedRoute>
        )
      case 'analytics':
        return (
          <ProtectedRoute requiredPermissions={['read:analytics']}>
            <div className="text-center py-12">Analytics Dashboard - Coming soon...</div>
          </ProtectedRoute>
        )
      case 'settings':
        return (
          <ProtectedRoute requiredPermissions={['manage:settings']}>
            <SettingsPage searchTerm={searchTerm} />
          </ProtectedRoute>
        )
      default:
        return <div className="text-center py-12">Coming soon...</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        user={user}
        onSignOut={signOut}
        onSettingsClick={handleSettingsClick}
      />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveTab()}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  )
}
*/

export default App