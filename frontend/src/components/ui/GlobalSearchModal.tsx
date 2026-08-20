import { useState, useEffect, useRef } from 'react';
import { Search, X, Ticket as TicketIcon } from 'lucide-react';
import { ticketService } from '../../services';
import { Ticket } from '../../types';
import TicketDetailModal from '../ticket/TicketDetailModal';

export default function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener and custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-global-search', handleOpenEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-global-search', handleOpenEvent);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await ticketService.getAll({ search: query, limit: 5 });
        setResults(res.data.data || []);
      } catch (error) {
        console.error('Search error', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
    setIsOpen(false);
  };

  if (!isOpen && !isDetailOpen) return null;

  return (
    <>
      {/* Search Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-background p-4">
          <div 
            className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="relative flex items-center border-b border-border p-4">
              <Search className="absolute left-6 text-muted-foreground" size={20} />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-input rounded-md outline-none pl-10 pr-10 py-3 text-lg text-foreground placeholder-muted-foreground"
                placeholder="Cari ID tiket, keluhan, pemohon..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-6 text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto bg-card">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Mencari...</div>
              ) : query && results.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Tidak ada tiket yang cocok dengan "{query}"</div>
              ) : results.length > 0 ? (
                <div className="p-2 space-y-1">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Hasil Pencarian
                  </div>
                  {results.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => handleResultClick(ticket)}
                      className="w-full flex items-start gap-4 p-4 bg-card hover:bg-accent rounded-lg transition-colors text-left"
                    >
                      <div className="mt-1 w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <TicketIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-primary">{ticket.ticketId}</span>
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{ticket.status}</span>
                        </div>
                        <h4 className="text-sm font-medium text-foreground truncate">{ticket.issue}</h4>
                        <div className="text-xs text-muted-foreground mt-1">
                          {ticket.requesterName} • {ticket.department?.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Ketik sesuatu untuk mencari data tiket secara global.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span><kbd className="px-1.5 py-0.5 rounded bg-background text-foreground mr-1 border">ESC</kbd> untuk tutup</span>
              </div>
            </div>
          </div>
          
          {/* Invisible backdrop click catcher */}
          <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          ticket={selectedTicket}
        />
      )}
    </>
  );
}
