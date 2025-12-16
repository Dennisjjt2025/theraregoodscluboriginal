import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from './LanguageToggle';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const publicLinks = [
    { href: '/manifesto', label: language === 'nl' ? 'Ons Verhaal' : 'Our Story' },
  ];

  const memberLinks = user ? [
    { href: '/drop', label: t.nav.currentDrop },
    { href: '/dashboard', label: t.nav.dashboard },
  ] : [];

  const navLinks = [...publicLinks, ...memberLinks];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="The Rare Goods Club" className="h-10 md:h-12 w-auto" />
            <span className="hidden sm:block font-serif text-lg tracking-wide">
              The Rare Goods Club
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'font-sans text-sm tracking-wide transition-colors',
                  isActive(link.href)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            
            <LanguageToggle />

            {user ? (
              <button
                onClick={signOut}
                className="font-sans text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.logout}
              </button>
            ) : (
              <Link
                to="/auth"
                className="btn-luxury"
              >
                {t.nav.login}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <LanguageToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'font-sans text-base py-2 transition-colors',
                    isActive(link.href)
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="font-sans text-base py-2 text-muted-foreground text-left"
                >
                  {t.nav.logout}
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-luxury text-center mt-2"
                >
                  {t.nav.login}
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
