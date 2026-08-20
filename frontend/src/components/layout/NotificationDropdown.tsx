import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: number, link?: string) => {
    markAsRead(id);
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors hover:bg-slate-800/50"
        style={{ color: 'var(--muted-foreground)' }}
        title="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold text-white bg-red-500 rounded-full border border-dark-card">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border border-dark-border bg-card overflow-hidden z-50 animate-fade-in"
        >
          <div className="p-3 border-b border-dark-border flex items-center justify-between bg-muted">
            <h3 className="font-semibold text-sm text-foreground">Notifikasi</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary-400 flex items-center gap-1"
              >
                <Check size={12} />
                Tandai semua dibaca
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto bg-card">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Bell size={24} className="mb-2 opacity-20" />
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.link)}
                    className={`w-full text-left p-3 border-b border-dark-border hover:bg-accent transition-colors flex items-start gap-3
                      ${notif.isRead ? 'opacity-70 bg-card' : 'bg-muted'}`}
                  >
                    <div className="mt-0.5 w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Info size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${notif.isRead ? 'text-foreground' : 'text-foreground font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1.5 block">
                        {new Date(notif.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
