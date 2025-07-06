import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { DrillSheetApp } from './components/DrillSheetApp';

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

export default App;
