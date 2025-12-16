import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

type AuthMode = 'choose' | 'login' | 'login-password' | 'request-access' | 'invite' | 'waitlist' | 'signup' | 'verify-pending' | 'verified';

export default function Auth() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCodeParam = searchParams.get('invite');
  const verifyToken = searchParams.get('verify');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState(inviteCodeParam || '');
  const [authMode, setAuthMode] = useState<AuthMode>(inviteCodeParam ? 'invite' : 'choose');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [validatedInviteCode, setValidatedInviteCode] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Handle verification token on page load
  useEffect(() => {
    if (verifyToken) {
      verifyEmailToken(verifyToken);
    }
  }, [verifyToken]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const verifyEmailToken = async (token: string) => {
    setLoading(true);
    try {
      // Find profile with this token
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, verification_token_expires_at')
        .eq('verification_token', token)
        .maybeSingle();

      if (error || !profile) {
        toast.error(t.auth.invalidVerificationToken);
        setAuthMode('choose');
        return;
      }

      // Check if token expired
      if (new Date(profile.verification_token_expires_at!) < new Date()) {
        toast.error(t.auth.invalidVerificationToken);
        setAuthMode('choose');
        return;
      }

      // Mark email as verified
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_verified: true,
          verification_token: null,
          verification_token_expires_at: null,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setAuthMode('verified');
      toast.success(t.auth.emailVerified);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      // First try to login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if email is verified
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_verified')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile && !profile.email_verified) {
          // Sign out and show error
          await supabase.auth.signOut();
          toast.error(t.auth.emailNotVerified);
          setPendingUserId(data.user.id);
          return;
        }
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || t.common.error);
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

      // Store validated invite code and move to signup
      setValidatedInviteCode(inviteCode);
      setAuthMode('signup');
      toast.success('Valid invite code! Now create your account.');
    } catch (error) {
      console.error('Invite validation error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async (userId: string, userEmail: string, userFirstName: string) => {
    try {
      const response = await supabase.functions.invoke('send-verification-email', {
        body: {
          userId,
          email: userEmail,
          firstName: userFirstName,
        },
      });

      if (response.error) throw response.error;
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) return;

    if (password.length < 6) {
      toast.error(t.auth.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t.auth.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // If we have a validated invite code, mark it as used and auto-verify
        if (validatedInviteCode) {
          await supabase
            .from('invite_codes')
            .update({
              used_by: signUpData.user.id,
              used_at: new Date().toISOString(),
            })
            .eq('code', validatedInviteCode);

          // Auto-verify email for users with valid invite code (they're already validated)
          await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', signUpData.user.id);

          toast.success(t.auth.accountCreated);
          setAuthMode('login-password');
          setPassword('');
          setConfirmPassword('');
        } else {
          // No invite code - require email verification
          const sent = await sendVerificationEmail(signUpData.user.id, email, firstName);
          
          if (sent) {
            setPendingUserId(signUpData.user.id);
            setAuthMode('verify-pending');
            toast.success(t.auth.verifyEmailSent);
          } else {
            toast.error('Failed to send verification email. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingUserId || !email || !firstName) return;
    
    setLoading(true);
    const sent = await sendVerificationEmail(pendingUserId, email, firstName);
    setLoading(false);
    
    if (sent) {
      toast.success(t.auth.verifyEmailSent);
    } else {
      toast.error(t.common.error);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email, name });

      if (error) {
        if (error.code === '23505') {
          toast.error(t.auth.alreadyOnWaitlist);
        } else {
          throw error;
        }
      } else {
        setWaitlistSubmitted(true);
        toast.success(t.landing.waitlistSuccess);
      }
    } catch (error) {
      console.error('Waitlist error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state for verification
  if (loading && verifyToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  // Email verified success view
  if (authMode === 'verified') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center py-24">
            <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border-2 border-secondary rounded-full">
              <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl mb-4">{t.auth.emailVerified}</h1>
            <p className="text-muted-foreground mb-8">{t.auth.emailVerifiedDesc}</p>
            <button
              onClick={() => setAuthMode('login-password')}
              className="btn-luxury"
            >
              {t.auth.loginWithPassword}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Verification pending view
  if (authMode === 'verify-pending') {
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
            <h1 className="font-serif text-3xl mb-4">{t.auth.verifyEmail}</h1>
            <p className="text-muted-foreground mb-4">{t.auth.verifyEmailDesc}</p>
            <p className="text-sm text-muted-foreground mb-8">{t.auth.verifyEmailCheck}</p>
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="btn-outline-luxury disabled:opacity-50"
            >
              {loading ? t.common.loading : t.auth.resendVerification}
            </button>
          </div>
        </main>
      </div>
    );
  }

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
                onClick={() => setAuthMode('waitlist')}
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

  // Waitlist view
  if (authMode === 'waitlist') {
    if (waitlistSubmitted) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-24 px-4">
            <div className="max-w-md mx-auto text-center py-24">
              <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border-2 border-secondary rounded-full">
                <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-serif text-3xl mb-4">{t.landing.waitlistSuccess}</h1>
              <p className="text-muted-foreground mb-8">
                {t.auth.waitlistBenefit}
              </p>
              <button
                onClick={() => setAuthMode('choose')}
                className="btn-outline-luxury"
              >
                {t.common.back}
              </button>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto py-16">
            <div className="text-center mb-12">
              <img src={logo} alt="The Rare Goods Club" className="w-24 h-24 mx-auto mb-6 opacity-90" />
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.landing.waitlistTitle}</h1>
              <p className="text-muted-foreground mb-4">{t.landing.waitlistSubtitle}</p>
              <p className="text-secondary text-sm font-medium">{t.auth.waitlistBenefit}</p>
            </div>

            <form onSubmit={handleWaitlistSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.landing.namePlaceholder}
                  required
                  className="input-luxury w-full text-center"
                />
              </div>
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
                {loading ? t.common.loading : t.landing.submit}
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

  // Signup view (after invite validation)
  if (authMode === 'signup') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto py-16">
            <div className="text-center mb-12">
              <img src={logo} alt="The Rare Goods Club" className="w-24 h-24 mx-auto mb-6 opacity-90" />
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.auth.createAccount}</h1>
              <p className="text-muted-foreground">{t.auth.createAccountDesc}</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t.auth.firstName}
                  required
                  className="input-luxury w-full"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t.auth.lastName}
                  required
                  className="input-luxury w-full"
                />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.landing.emailPlaceholder}
                required
                className="input-luxury w-full"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.password}
                required
                minLength={6}
                className="input-luxury w-full"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.auth.confirmPassword}
                required
                minLength={6}
                className="input-luxury w-full"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-luxury w-full disabled:opacity-50"
              >
                {loading ? t.common.loading : t.auth.signUp}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('invite')}
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

  // Login with password view
  if (authMode === 'login-password') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto py-16">
            <div className="text-center mb-12">
              <img src={logo} alt="The Rare Goods Club" className="w-24 h-24 mx-auto mb-6 opacity-90" />
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.auth.loginTitle}</h1>
              <p className="text-muted-foreground">{t.auth.loginWithPassword}</p>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.landing.emailPlaceholder}
                required
                className="input-luxury w-full"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.password}
                required
                className="input-luxury w-full"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-luxury w-full disabled:opacity-50"
              >
                {loading ? t.common.loading : t.nav.login}
              </button>
              
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {t.auth.forgotPassword}
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

  // Login view (magic link + password option)
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
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t.auth.orUsePassword}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setAuthMode('login-password')}
              className="btn-outline-luxury w-full"
            >
              {t.auth.loginWithPassword}
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