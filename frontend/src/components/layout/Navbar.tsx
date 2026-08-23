import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export default function Navbar({ title, subtitle, onMenuToggle }: NavbarProps) {
  const { user } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDarkMode(false);
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      setIsDarkMode(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <header
      className="h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-6 shrink-0"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2
            className="text-base md:text-lg font-semibold leading-tight"
            style={{ color: 'var(--foreground)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search hint — desktop only */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
          className="hidden md:flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-slate-800/50 cursor-pointer"
          style={{
            background: 'var(--background)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <Search size={14} />
          <span>Pencarian</span>
        </button>

        {/* Notification Dropdown */}
        <NotificationDropdown />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>


      </div>
    </header>
  );
}
