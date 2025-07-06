import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { DrillSheetManagement } from './components/drillsheets/DrillSheetManagement';

function App() {
  return (
    <Authenticator
      signUpAttributes={['given_name', 'family_name', 'email']}
      loginMechanisms={['username', 'email']}
    >
      {({ signOut, user }) => (
        <DrillSheetApp user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}

function DrillSheetApp() {
  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'customers':
        return <CustomerManagement searchTerm={searchTerm} />;
      case 'drillsheets':
        return <DrillSheetManagement searchTerm={searchTerm} />;
        // case 'balls':
        //   return <BowlingBallManagement searchTerm={searchTerm} />;
        // case 'workorders':
        //   return <WorkOrderManagement searchTerm={searchTerm} />;
        // case 'analytics':
        //   return <AnalyticsDashboard />;
      default:
        return <div className="text-center py-12">Coming soon...</div>;
    }
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderActiveTab()}
        </main>
      </div>
  );
}

export default App;
