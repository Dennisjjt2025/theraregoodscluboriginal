import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Wine, Copy, Check, AlertTriangle, User, Shield, ShoppingBag, MessageSquare, Share2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropsTab } from '@/components/dashboard/DropsTab';

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
  starts_at: string;
  ends_at: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number | null;
  is_active: boolean;
}

interface SiteSetting {
  key: string;
  value_en: string | null;
  value_nl: string | null;
}

interface OrderHistory {
  id: string;
  drop_id: string;
  purchased: boolean;
  quantity: number;
  created_at: string;
  drop?: {
    title_en: string;
    title_nl: string;
    price: number;
    image_url: string | null;
  };
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
  preferences: string[];
}

interface PreferenceCategory {
  id: string;
  key: string;
  label_en: string;
  label_nl: string;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [activeDrop, setActiveDrop] = useState<Drop | null>(null);
  const [upcomingDrop, setUpcomingDrop] = useState<Drop | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    phone: '',
    street_address: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'Nederland',
    preferences: [],
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [preferenceCategories, setPreferenceCategories] = useState<PreferenceCategory[]>([]);

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
      // Fetch preference categories
      const { data: categoriesData } = await supabase
        .from('preference_categories')
        .select('id, key, label_en, label_nl')
        .eq('is_active', true)
        .order('sort_order');
      
      setPreferenceCategories(categoriesData || []);

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
          preferences: profileData.preferences || [],
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

        // Fetch current active drop (live now - started and not ended or no end date)
        const now = new Date().toISOString();
        const { data: activeDropData } = await supabase
          .from('drops')
          .select('*')
          .eq('is_active', true)
          .eq('is_draft', false)
          .lt('starts_at', now)
          .order('starts_at', { ascending: false })
          .limit(1);

        // Filter to find truly active drop (either no end date or end date in future)
        const activeDrop = activeDropData?.find(d => !d.ends_at || new Date(d.ends_at) > new Date());
        setActiveDrop(activeDrop || null);

        // Fetch upcoming drop (starts in future)
        const { data: upcomingDropData } = await supabase
          .from('drops')
          .select('*')
          .eq('is_active', true)
          .eq('is_draft', false)
          .gt('starts_at', now)
          .order('starts_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        setUpcomingDrop(upcomingDropData);

        // Fetch site settings
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('key, value_en, value_nl');

        setSiteSettings(settingsData || []);

        // Fetch order history (purchased items)
        const { data: orderData } = await supabase
          .from('drop_participation')
          .select(`
            id,
            drop_id,
            purchased,
            quantity,
            created_at,
            drops (
              title_en,
              title_nl,
              price,
              image_url
            )
          `)
          .eq('member_id', memberData.id)
          .eq('purchased', true)
          .order('created_at', { ascending: false });

        setOrders((orderData || []).map((o: any) => ({
          ...o,
          drop: o.drops
        })));
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

  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const shareOrCopyMessage = async (code: string) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${code}`;
    const fullMessage = `${t.dashboard.inviteShareText}\n\n${inviteUrl}`;
    
    // Use native share API if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Rare Goods Club',
          text: fullMessage,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        if ((err as Error).name === 'AbortError') return;
      }
    }
    
    // Fall back to clipboard copy
    await navigator.clipboard.writeText(fullMessage);
    setCopiedMessage(code);
    toast.success(t.dashboard.messageCopied);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.dashboard.title}</h1>
              <p className="text-muted-foreground">
                {t.dashboard.welcome}, {profile.first_name || user?.email?.split('@')[0]}
              </p>
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="btn-outline-luxury flex items-center gap-2 text-sm w-fit"
              >
                <Shield className="w-4 h-4" />
                {t.nav.admin}
              </Link>
            )}
          </div>

          <Tabs defaultValue="drops" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-xl h-auto">
              <TabsTrigger value="drops" className="flex items-center gap-2 py-3">
                <Wine className="w-4 h-4" />
                <span className="hidden sm:inline">Drops</span>
                <span className="sm:hidden">Drops</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="py-3">Overview</TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2 py-3">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'nl' ? 'Bestellingen' : 'Orders'}</span>
                <span className="sm:hidden">{language === 'nl' ? 'Orders' : 'Orders'}</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t.dashboard.myProfile}</span>
                <span className="sm:hidden">Profiel</span>
                {isProfileIncomplete && (
                  <span className="w-2 h-2 bg-secondary rounded-full" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* Drops Tab - Default landing */}
            <TabsContent value="drops">
              <DropsTab
                activeDrop={activeDrop}
                upcomingDrop={upcomingDrop}
                settings={siteSettings}
              />
            </TabsContent>

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
                        <code className="font-mono text-xs sm:text-sm">{code.code}</code>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title={t.dashboard.copyLink}
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-4 h-4 text-secondary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => shareOrCopyMessage(code.code)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title={canNativeShare ? t.dashboard.copyMessage : t.dashboard.copyMessage}
                          >
                            {copiedMessage === code.code ? (
                              <Check className="w-4 h-4 text-secondary" />
                            ) : canNativeShare ? (
                              <Share2 className="w-4 h-4" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </button>
                        </div>
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

                  {/* Preferences Section */}
                  <div className="border-t border-border pt-6 mt-6">
                    <h3 className="font-serif text-lg mb-2">{t.dashboard.myInterests}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t.dashboard.interestsSubtitle}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {preferenceCategories.map((category) => (
                        <label
                          key={category.key}
                          className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={profile.preferences.includes(category.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfile({ ...profile, preferences: [...profile.preferences, category.key] });
                              } else {
                                setProfile({ ...profile, preferences: profile.preferences.filter(p => p !== category.key) });
                              }
                            }}
                            className="w-4 h-4 accent-secondary"
                          />
                          <span className="text-sm">
                            {language === 'nl' ? category.label_nl : category.label_en}
                          </span>
                        </label>
                      ))}
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

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div className="bg-card border border-border p-6">
                <h2 className="font-serif text-xl mb-6">{t.dashboard.purchaseHistory}</h2>
                
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-4 p-4 bg-muted/30 border border-border"
                      >
                        {order.drop?.image_url && (
                          <img
                            src={order.drop.image_url}
                            alt={language === 'nl' ? order.drop.title_nl : order.drop.title_en}
                            className="w-20 h-20 object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-serif text-lg">
                            {language === 'nl' ? order.drop?.title_nl : order.drop?.title_en}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {order.quantity > 1 ? `${order.quantity}x ` : ''}€{order.drop?.price}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground">
                            {t.admin.purchased}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t.dashboard.noPurchases}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}