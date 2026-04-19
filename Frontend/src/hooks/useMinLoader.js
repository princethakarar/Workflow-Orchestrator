import { useState, useEffect, useRef } from 'react';

/**
 * useMinLoader — Enforces a minimum display time for the loader.
 *
 * Even if data loads in 100ms, the loader stays visible for at least
 * `minDuration` ms so it doesn't feel like a flash.
 *
 * @param {boolean} isDataLoading - The real loading state from data fetch
 * @param {number}  minDuration   - Minimum display time in ms (default: 1500)
 * @returns {boolean} showLoader  - Whether to show the loader overlay
 */
const useMinLoader = (isDataLoading, minDuration = 1500) => {
    const [showLoader, setShowLoader] = useState(true);
    const startTime = useRef(Date.now());

    useEffect(() => {
        // Still loading data — keep showing loader
        if (isDataLoading) return;

        // Data loaded — check how long the loader has been showing
        const elapsed = Date.now() - startTime.current;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining === 0) {
            setShowLoader(false);
        } else {
            const timer = setTimeout(() => setShowLoader(false), remaining);
            return () => clearTimeout(timer);
        }
    }, [isDataLoading, minDuration]);

    return showLoader;
};

export default useMinLoader;
