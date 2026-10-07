import { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { CustomerManagement } from './components/customers/CustomerManagement'
import { BowlingBallManagement } from './components/balls/BowlingBallManagement'
import { WorkOrderManagement } from './components/workorders/WorkOrderManagement'
import { SettingsPage } from './components/settings/SettingsPage'
import { LeadsPage } from './components/leads/LeadsPage'
import { useLocations } from './hooks/useLocations'
import { useMe } from './hooks/useMe'
import { useSidebarCollapsed } from './hooks/useSidebarCollapsed'
import { toEmployeeManager } from './utils/EmployeeRoles'
import { AppSection, SignedInUser } from './types'

interface AppProps {
    // Absent when running without auth (no amplify_outputs.json): local mock-data development.
    user?: SignedInUser
}

const SECTION_TITLES: Record<AppSection, string> = {
    customers: 'Customers',
    workorders: 'Work Orders',
    balls: 'Bowling Balls',
    analytics: 'Analytics',
    settings: 'Settings',
    leads: 'Leads'
}

function App({ user }: AppProps) {
    const [activeSection, setActiveSection] = useState<AppSection>('customers')
    const [searchTerm, setSearchTerm] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [selectedLocationID, setSelectedLocationID] = useState('')
    const { locations } = useLocations()
    const { me, refresh: refreshMe } = useMe()
    const platformAdmin = me?.user.platformAdmin ?? null
    const { collapsed: sidebarCollapsed, toggleCollapsed: toggleSidebarCollapsed } = useSidebarCollapsed()

    // Until the user picks one, the first active location is current.
    // Not yet used to filter data: sections still show every location.
    const currentLocationID = selectedLocationID || locations.find(location => location.active)?.id || ''

    const handleNavigate = (section: AppSection) => {
        setActiveSection(section)
        setSidebarOpen(false)
    }

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'customers':
                return <CustomerManagement searchTerm={searchTerm} currentLocationID={currentLocationID} />
            case 'balls':
                return <BowlingBallManagement searchTerm={searchTerm} />
            case 'workorders':
                return <WorkOrderManagement searchTerm={searchTerm} />
            case 'analytics':
                return <div className="text-center py-12">Analytics Dashboard - Coming soon...</div>
            case 'settings':
                return <SettingsPage searchTerm={searchTerm} employeeManager={toEmployeeManager(me, !!user)} />
            case 'leads':
                return platformAdmin && user
                    ? <LeadsPage searchTerm={searchTerm} platformAdmin={platformAdmin} email={user.email} onTwoFactorReady={refreshMe} />
                    : null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 md:flex">
            <Sidebar
                activeSection={activeSection}
                onNavigate={handleNavigate}
                locations={locations}
                currentLocationID={currentLocationID}
                onLocationChange={setSelectedLocationID}
                user={user}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapsed={toggleSidebarCollapsed}
                showLeads={platformAdmin !== null}
            />
            <div className="min-w-0 flex-1">
                <TopBar
                    title={SECTION_TITLES[activeSection]}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onMenuClick={() => setSidebarOpen(true)}
                    menuOpen={sidebarOpen}
                />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {renderActiveSection()}
                </main>
            </div>
        </div>
    )
}

export default App
