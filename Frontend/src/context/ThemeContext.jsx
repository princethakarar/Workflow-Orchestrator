import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'wf-theme';

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Read persisted preference; default to dark
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved !== 'light'; // dark by default unless explicitly set to light
    });

    // Apply/remove class on <body> whenever isDark changes
    useEffect(() => {
        const body = document.documentElement; // apply on <html> so CSS vars cascade everywhere
        if (isDark) {
            body.classList.add('dark');
        } else {
            body.classList.remove('dark');
        }
        localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggle = () => setIsDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
};
