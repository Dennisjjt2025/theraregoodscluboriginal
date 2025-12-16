import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Wine, Copy, Check, AlertTriangle, ArrowRight } from 'lucide-react';

interface Member {
  id: string;
  status: string;
  strike_count: number;
  invites_remaining: number;
}

interface InviteCode {
  id: string;
  code: string;
  used_by: string | null;
  expires_at: string;
}

interface Drop {
  id: string;
  title_en: string;
  title_nl: string;
  image_url: string | null;
  ends_at: string;
  price: number;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [currentDrop, setCurrentDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (memberError) throw memberError;
      setMember(memberData);

      if (memberData) {
        // Fetch invite codes
        const { data: codes } = await supabase
          .from('invite_codes')
          .select('*')
          .eq('member_id', memberData.id)
          .order('created_at', { ascending: false });

        setInviteCodes(codes || []);

        // Fetch current active drop
        const { data: dropData } = await supabase
          .from('drops')
          .select('*')
          .eq('is_active', true)
          .gt('ends_at', new Date().toISOString())
          .lt('starts_at', new Date().toISOString())
          .maybeSingle();

        setCurrentDrop(dropData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    if (!member || member.invites_remaining <= 0) return;

    setGeneratingInvite(true);
    try {
      const code = `RARE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { error } = await supabase
        .from('invite_codes')
        .insert({
          code,
          member_id: member.id,
        });

      if (error) throw error;

      // Update member's remaining invites
      await supabase
        .from('members')
        .update({ invites_remaining: member.invites_remaining - 1 })
        .eq('id', member.id);

      toast.success('Invite code generated!');
      fetchData();
    } catch (error) {
      console.error('Error generating invite:', error);
      toast.error(t.common.error);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    toast.success(t.dashboard.copied);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center py-24">
            <h1 className="font-serif text-3xl mb-4">Not a Member Yet</h1>
            <p className="text-muted-foreground mb-8">
              Your account exists but you're not yet a member. You may need an invite code or admin approval.
            </p>
            <Link to="/" className="btn-outline-luxury">
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const strikesRemaining = 3 - member.strike_count;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Welcome Header */}
          <div className="mb-12">
            <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.dashboard.title}</h1>
            <p className="text-muted-foreground">
              {t.dashboard.welcome}, {user?.email?.split('@')[0]}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Member Status Card */}
            <div className="bg-card border border-border p-6">
              <h2 className="font-serif text-xl mb-4">{t.dashboard.memberStatus}</h2>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${member.status === 'active' ? 'bg-secondary' : 'bg-destructive'}`} />
                <span className="font-sans font-medium">
                  {member.status === 'active' ? t.dashboard.active : t.dashboard.suspended}
                </span>
              </div>
            </div>

            {/* Strike Tracker Card */}
            <div className="bg-card border border-border p-6">
              <h2 className="font-serif text-xl mb-4">{t.dashboard.strikeTracker}</h2>
              <div className="flex items-center gap-2 mb-3">
                {[0, 1, 2].map((i) => (
                  <Wine
                    key={i}
                    className={`w-8 h-8 ${i < member.strike_count ? 'text-destructive' : 'text-muted-foreground/30'}`}
                    fill={i < member.strike_count ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {strikesRemaining} {t.dashboard.strikesRemaining}
              </p>
              {member.strike_count === 2 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t.dashboard.strikeWarning}</span>
                </div>
              )}
            </div>

            {/* Current Drop Card */}
            <div className="bg-card border border-border p-6">
              <h2 className="font-serif text-xl mb-4">{t.dashboard.currentDrop}</h2>
              {currentDrop ? (
                <div className="space-y-4">
                  {currentDrop.image_url && (
                    <img
                      src={currentDrop.image_url}
                      alt={language === 'nl' ? currentDrop.title_nl : currentDrop.title_en}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <h3 className="font-serif text-lg">
                    {language === 'nl' ? currentDrop.title_nl : currentDrop.title_en}
                  </h3>
                  <Link to="/drop" className="btn-luxury inline-flex items-center gap-2">
                    {t.dashboard.viewDrop}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-muted-foreground">{t.dashboard.noDrop}</p>
              )}
            </div>

            {/* Invites Card */}
            <div className="bg-card border border-border p-6">
              <h2 className="font-serif text-xl mb-4">{t.dashboard.invites}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {member.invites_remaining} {t.dashboard.invitesRemaining}
              </p>

              {member.invites_remaining > 0 && (
                <button
                  onClick={generateInviteCode}
                  disabled={generatingInvite}
                  className="btn-outline-luxury text-sm mb-4 disabled:opacity-50"
                >
                  {generatingInvite ? t.common.loading : t.dashboard.generateInvite}
                </button>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {inviteCodes.filter(c => !c.used_by).map((code) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between bg-muted/50 px-3 py-2 text-sm"
                  >
                    <code className="font-mono">{code.code}</code>
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedCode === code.code ? (
                        <Check className="w-4 h-4 text-secondary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {member.invites_remaining === 0 && inviteCodes.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.dashboard.noInvites}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
