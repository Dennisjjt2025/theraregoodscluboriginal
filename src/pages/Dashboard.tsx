import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Wine, Copy, Check, AlertTriangle, ArrowRight, User, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  street_address: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [currentDrop, setCurrentDrop] = useState<Drop | null>(null);
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    phone: '',
    street_address: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'Nederland',
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
      // Check if user is admin
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!adminRole);

      // Fetch member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (memberError) throw memberError;
      setMember(memberData);

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || '',
          street_address: profileData.street_address || '',
          house_number: profileData.house_number || '',
          postal_code: profileData.postal_code || '',
          city: profileData.city || '',
          country: profileData.country || 'Nederland',
        });
      }

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

  const handleProfileSave = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success(t.dashboard.profileSaved);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t.common.error);
    } finally {
      setSavingProfile(false);
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
  const isProfileIncomplete = !profile.street_address || !profile.postal_code || !profile.city;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Welcome Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.dashboard.title}</h1>
              <p className="text-muted-foreground">
                {t.dashboard.welcome}, {profile.first_name || user?.email?.split('@')[0]}
              </p>
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="btn-outline-luxury flex items-center gap-2 text-sm"
              >
                <Shield className="w-4 h-4" />
                {t.nav.admin}
              </Link>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t.dashboard.myProfile}
                {isProfileIncomplete && (
                  <span className="w-2 h-2 bg-secondary rounded-full" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {isProfileIncomplete && (
                <div className="bg-secondary/10 border border-secondary/30 p-4 rounded-lg">
                  <p className="text-sm text-secondary font-medium">{t.dashboard.completeProfile}</p>
                </div>
              )}

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
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="bg-card border border-border p-6">
                <h2 className="font-serif text-xl mb-6">{t.dashboard.profileSettings}</h2>
                
                <div className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.auth.firstName}</label>
                      <input
                        type="text"
                        value={profile.first_name || ''}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="input-luxury w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.auth.lastName}</label>
                      <input
                        type="text"
                        value={profile.last_name || ''}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="input-luxury w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t.dashboard.phone}</label>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+31 6 12345678"
                      className="input-luxury w-full"
                    />
                  </div>

                  <div className="border-t border-border pt-4 mt-6">
                    <h3 className="font-serif text-lg mb-4">Adres</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">{t.dashboard.streetAddress}</label>
                        <input
                          type="text"
                          value={profile.street_address || ''}
                          onChange={(e) => setProfile({ ...profile, street_address: e.target.value })}
                          className="input-luxury w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t.dashboard.houseNumber}</label>
                        <input
                          type="text"
                          value={profile.house_number || ''}
                          onChange={(e) => setProfile({ ...profile, house_number: e.target.value })}
                          className="input-luxury w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t.dashboard.postalCode}</label>
                        <input
                          type="text"
                          value={profile.postal_code || ''}
                          onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                          placeholder="1234 AB"
                          className="input-luxury w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t.dashboard.city}</label>
                        <input
                          type="text"
                          value={profile.city || ''}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          className="input-luxury w-full"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">{t.dashboard.country}</label>
                      <input
                        type="text"
                        value={profile.country || ''}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        className="input-luxury w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="btn-luxury mt-6 disabled:opacity-50"
                  >
                    {savingProfile ? t.common.loading : t.common.save}
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}