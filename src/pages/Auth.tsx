import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

type AuthMode = 'choose' | 'login' | 'request-access' | 'invite';

export default function Auth() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCodeParam = searchParams.get('invite');

  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState(inviteCodeParam || '');
  const [authMode, setAuthMode] = useState<AuthMode>(inviteCodeParam ? 'invite' : 'choose');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      
      setEmailSent(true);
      toast.success(t.auth.emailSent);
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode)
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        toast.error(t.auth.invalidInvite);
        return;
      }

      // Store invite code for after signup
      localStorage.setItem('pending_invite_code', inviteCode);
      setAuthMode('login');
      toast.success('Valid invite code! Now enter your email to continue.');
    } catch (error) {
      console.error('Invite validation error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center py-24">
            <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border-2 border-secondary rounded-full">
              <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl mb-4">{t.auth.emailSent}</h1>
            <p className="text-muted-foreground mb-8">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <button
              onClick={() => setEmailSent(false)}
              className="btn-outline-luxury"
            >
              {t.auth.backToLogin}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Choose view - initial screen
  if (authMode === 'choose') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto py-16">
            <div className="text-center mb-12">
              <img src={logo} alt="The Rare Goods Club" className="w-24 h-24 mx-auto mb-6 opacity-90" />
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.auth.chooseTitle}</h1>
              <p className="text-muted-foreground">{t.auth.chooseSubtitle}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setAuthMode('login')}
                className="w-full p-6 border border-border rounded-lg hover:border-secondary transition-colors text-left group"
              >
                <h3 className="font-serif text-xl mb-1 group-hover:text-secondary transition-colors">
                  {t.auth.imAMember}
                </h3>
                <p className="text-muted-foreground text-sm">{t.auth.imAMemberDesc}</p>
              </button>

              <button
                onClick={() => setAuthMode('request-access')}
                className="w-full p-6 border border-border rounded-lg hover:border-secondary transition-colors text-left group"
              >
                <h3 className="font-serif text-xl mb-1 group-hover:text-secondary transition-colors">
                  {t.auth.noAccessYet}
                </h3>
                <p className="text-muted-foreground text-sm">{t.auth.noAccessDesc}</p>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Request access view - choose between invite code or waitlist
  if (authMode === 'request-access') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto py-16">
            <div className="text-center mb-12">
              <img src={logo} alt="The Rare Goods Club" className="w-24 h-24 mx-auto mb-6 opacity-90" />
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.auth.noAccessYet}</h1>
              <p className="text-muted-foreground">{t.auth.noAccessDesc}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setAuthMode('invite')}
                className="w-full p-6 border border-border rounded-lg hover:border-secondary transition-colors text-left group"
              >
                <h3 className="font-serif text-xl mb-1 group-hover:text-secondary transition-colors">
                  {t.auth.haveInviteCode}
                </h3>
                <p className="text-muted-foreground text-sm">{t.auth.validateInvite}</p>
              </button>

              <button
                onClick={() => navigate('/#waitlist')}
                className="w-full p-6 border border-border rounded-lg hover:border-secondary transition-colors text-left group"
              >
                <h3 className="font-serif text-xl mb-1 group-hover:text-secondary transition-colors">
                  {t.auth.joinWaitlist}
                </h3>
                <p className="text-muted-foreground text-sm">{t.landing.waitlistSubtitle}</p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAuthMode('choose')}
              className="w-full mt-6 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              {t.common.back}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Invite code view
  if (authMode === 'invite') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto py-16">
            <div className="text-center mb-12">
              <img src={logo} alt="The Rare Goods Club" className="w-24 h-24 mx-auto mb-6 opacity-90" />
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.auth.haveInviteCode}</h1>
              <p className="text-muted-foreground">{t.auth.enterInviteCode}</p>
            </div>

            <form onSubmit={handleInviteValidation} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={t.auth.enterInviteCode}
                  required
                  className="input-luxury w-full text-center font-mono tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-luxury w-full disabled:opacity-50"
              >
                {loading ? t.common.loading : t.auth.validateInvite}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('request-access')}
                className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {t.common.back}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Login view (magic link)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 px-4">
        <div className="max-w-md mx-auto py-16">
          <div className="text-center mb-12">
            <img src={logo} alt="The Rare Goods Club" className="w-24 h-24 mx-auto mb-6 opacity-90" />
            <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.auth.loginTitle}</h1>
            <p className="text-muted-foreground">{t.auth.loginSubtitle}</p>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.landing.emailPlaceholder}
                required
                className="input-luxury w-full text-center"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-luxury w-full disabled:opacity-50"
            >
              {loading ? t.common.loading : t.auth.sendMagicLink}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('choose')}
              className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              {t.common.back}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
