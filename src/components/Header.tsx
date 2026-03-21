import { Menu, X, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { typography } from '@/lib/typography';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { title: 'Dashboard', url: '/' },
    { title: 'Map', url: '/map' },
    { title: 'Garbage', url: '/garbage' },
    { title: 'Commute', url: '/commute' },
    { title: 'Area Livability', url: '/mood-index' },
    { title: 'Alerts', url: '/landslide' },
    { title: 'Smart Predictions', url: '/ai-insights' },
  ];

  return (
    <header className="sticky top-0 z-[1100] border-b border-white/5 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1800px] px-4 py-4 md:px-8 xl:px-12">
        <div className="flex items-center justify-between gap-4">
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer select-none"
            role="link"
            aria-label="Go to dashboard"
          >
            <div className="flex flex-col">
              <span className="font-display font-black text-xl tracking-tight text-white">Bindaas BLR</span>
              <span className="font-display font-black text-[10px] tracking-[0.22em] text-white/40 uppercase">
                BENGALURU, LIVE.
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-4 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === '/' || item.url === '/commute'}
                className={({ isActive }) =>
                  `min-h-[44px] px-2 py-2 ${typography.navLink} transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {item.title}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/5 text-foreground transition-colors hover:border-primary/40"
                    aria-label="Open account menu"
                  >
                    <UserCircle2 className="h-5 w-5 not-italic" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-white/5 bg-card">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {(user.user_metadata as { full_name?: string } | null)?.full_name ?? user.email ?? 'User'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-sm font-bold" onClick={() => navigate('/my-reports')}>
                    My Reports
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm font-bold"
                    onClick={() => {
                      void signOut();
                    }}
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <button
              className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:hidden"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 not-italic" /> : <Menu className="h-5 w-5 not-italic" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/5 bg-background/95 md:hidden">
          <nav className="mx-auto flex max-w-[1800px] flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === '/' || item.url === '/commute'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `min-h-[44px] rounded-xl px-3 py-3 ${typography.navLink} transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {item.title}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
};
