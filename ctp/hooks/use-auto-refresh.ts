import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * A hook that runs a callback periodically when the screen is focused.
 * 
 * @param callback The function to execute periodically.
 * @param intervalMs The interval in milliseconds (default: 5000).
 */
export function useAutoRefresh(callback: () => Promise<void> | void, intervalMs = 5000) {
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const executeCallback = async () => {
                if (!isActive) return;
                try {
                    await callback();
                } catch (error) {
                    console.error('Auto-refresh error:', error);
                }
            };

            const intervalId = setInterval(executeCallback, intervalMs);

            return () => {
                isActive = false;
                clearInterval(intervalId);
            };
        }, [callback, intervalMs])
    );
}
