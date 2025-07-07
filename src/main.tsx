import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import App from './App.tsx'
import './index.css'

// Function to configure Amplify
async function configureAmplify() {
    // try {
    //     // Try to dynamically import the outputs file
    //     const outputs = await import('../amplify_outputs.json')
    //     Amplify.configure(outputs.default)
    //     console.log('✅ Amplify configured successfully')
    // } catch (error) {
    //     console.warn('⚠️ amplify_outputs.json not found. App will run without backend connection.')
    //     console.warn('To fix this: 1) Run "npx ampx sandbox" or "npx ampx deploy"')
    //     console.warn('              2) Or manually configure Amplify for development')

        // Optional: Configure for development/testing without backend
        // Uncomment and modify the following if you want to test without a backend:
        /*
        Amplify.configure({
          Auth: {
            Cognito: {
              region: 'us-east-1',
              userPoolId: 'us-east-1_XXXXXXXXX',
              userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
            }
          }
        })
        */
    }
}

// Configure Amplify before rendering
configureAmplify().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
}).catch((error) => {
    console.error('Failed to configure Amplify:', error)
    // Render app anyway, but it won't have backend functionality
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
})