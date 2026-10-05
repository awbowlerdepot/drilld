import { useState } from 'react'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import { CustomerManagement } from './components/customers/CustomerManagement'
import { BowlingBallManagement } from './components/balls/BowlingBallManagement'
import { WorkOrderManagement } from './components/workorders/WorkOrderManagement'
import { SettingsPage } from './components/settings/SettingsPage'
import { SignedInUser } from './types'

interface AppProps {
    // Absent when running without auth (no amplify_outputs.json): local mock-data development.
    user?: SignedInUser
}

function App({ user }: AppProps) {
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
                user={user}
            />
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {renderActiveTab()}
            </main>
        </div>
    )
}

export default App
