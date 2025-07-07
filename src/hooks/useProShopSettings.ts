import { useState, useEffect } from 'react';
import { ProShopSettings, ProShopSettingsSection } from '../types/proshopSettings';
import { mockProShopSettings } from '../data/mockProShopSettings';

export const useProShopSettings = () => {
    const [settings, setSettings] = useState<ProShopSettings>(mockProShopSettings);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Load settings from API
    const loadSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Replace with actual API call
            // const response = await API.graphql({
            //   query: getProShop,
            //   variables: { id: currentProShopId }
            // });
            // setSettings(JSON.parse(response.data.getProShop.settings) || mockProShopSettings);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setSettings(mockProShopSettings);
        } catch (err) {
            setError('Failed to load settings');
            console.error('Error loading settings:', err);
        } finally {
            setLoading(false);
        }
    };

    // Update a specific section of settings
    const updateSection = (section: ProShopSettingsSection, data: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...data
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Save all settings
    const saveSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Replace with actual API call
            // await API.graphql({
            //   query: updateProShop,
            //   variables: {
            //     input: {
            //       id: currentProShopId,
            //       settings: JSON.stringify(settings)
            //     }
            //   }
            // });

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setHasUnsavedChanges(false);
            return true;
        } catch (err) {
            setError('Failed to save settings');
            console.error('Error saving settings:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Reset settings to last saved state
    const resetSettings = () => {
        setSettings(mockProShopSettings);
        setHasUnsavedChanges(false);
    };

    // Validate settings before saving
    const validateSettings = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // General validation
        if (!settings.general.businessName.trim()) {
            errors.push('Business name is required');
        }
        if (!settings.general.ownerName.trim()) {
            errors.push('Owner name is required');
        }
        if (!settings.general.billingEmail.trim()) {
            errors.push('Billing email is required');
        }

        // Workflow validation
        if (settings.workflow.defaultLaborRate <= 0) {
            errors.push('Default labor rate must be greater than 0');
        }

        // Security validation
        if (settings.security.passwordMinLength < 6) {
            errors.push('Password minimum length must be at least 6 characters');
        }
        if (settings.security.sessionTimeoutMinutes < 10) {
            errors.push('Session timeout must be at least 10 minutes');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    return {
        settings,
        loading,
        error,
        hasUnsavedChanges,
        updateSection,
        saveSettings,
        resetSettings,
        validateSettings,
        loadSettings
    };
};