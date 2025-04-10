// Theme service to handle theme settings across the application
const THEME_KEY = 'app_theme';

// Get the current theme preference
export const getTheme = (): 'dark' | 'light' => {
  const savedTheme = localStorage.getItem(THEME_KEY);
  
  // Default to dark mode if no preference is found
  return (savedTheme === 'light') ? 'light' : 'dark';
};

// Set the theme preference
export const setTheme = (theme: 'dark' | 'light'): void => {
  localStorage.setItem(THEME_KEY, theme);
  
  // Apply theme to body element for global CSS
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  }
  
  // Dispatch an event so other components can react to the theme change
  window.dispatchEvent(new Event('themeChange'));
};

// Toggle between light and dark mode
export const toggleTheme = (): 'dark' | 'light' => {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
};

// Initialize theme on app startup
export const initializeTheme = (): void => {
  const currentTheme = getTheme();
  setTheme(currentTheme);
}; 