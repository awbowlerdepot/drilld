import React from 'react';
import { Authenticator, Theme, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Target } from 'lucide-react';
import { SignedInUser } from '../../types';

interface AuthWrapperProps {
    children: (user: SignedInUser) => React.ReactNode;
}

// The app's blue (Tailwind blue-50…800) instead of Amplify's default teal.
const theme: Theme = {
    name: 'drilld',
    tokens: {
        colors: {
            primary: {
                10: { value: '#eff6ff' },
                20: { value: '#dbeafe' },
                40: { value: '#93c5fd' },
                60: { value: '#3b82f6' },
                80: { value: '#2563eb' },
                90: { value: '#1d4ed8' },
                100: { value: '#1e40af' }
            }
        }
    }
};

function SignInHeader() {
    return (
        <div className="flex items-center justify-center py-6">
            <Target className="w-8 h-8 text-blue-600 mr-3" />
            <span className="text-xl font-bold text-gray-900">Drill Sheet Pro</span>
        </div>
    );
}

/**
 * Shows the Cognito sign-in screen until the user is signed in, then renders
 * the app. There is no sign-up: accounts are created by invitation.
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => (
    <ThemeProvider theme={theme}>
        <div className="min-h-screen bg-gray-50">
            <Authenticator hideSignUp components={{ Header: SignInHeader }}>
                {({ user, signOut }) => (
                    <>
                        {user && signOut && children({
                            userId: user.userId,
                            email: user.signInDetails?.loginId ?? user.username,
                            signOut
                        })}
                    </>
                )}
            </Authenticator>
        </div>
    </ThemeProvider>
);
