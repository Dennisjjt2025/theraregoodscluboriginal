import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Wine, Copy, Check, AlertTriangle, User, Shield, ShoppingBag, MessageSquare, Share2, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropsTab } from '@/components/dashboard/DropsTab';
import { OnboardingTour, TourButton } from '@/components/dashboard/OnboardingTour';
import { OrdersList } from '@/components/dashboard/OrdersList';

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
  shopify_order_id: string | null;
  drop?: {
    title_en: string;
    title_nl: string;
    price: number;
    image_url: string | null;
  };
  shopifyDetails?: {
    orderNumber: string;
    fulfillmentStatus: string;
    financialStatus: string;
    trackingInfo?: Array<{ number: string; url: string }>;
    deliveredAt?: string | null;
    estimatedDeliveryAt?: string | null;
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
  email_verified: boolean | null;
  has_seen_tour: boolean | null;
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
    email_verified: null,
    has_seen_tour: null,
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [preferenceCategories, setPreferenceCategories] = useState<PreferenceCategory[]>([]);
  const [runTour, setRunTour] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

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
      // Phase 1: Fetch independent data in parallel
      const [
        categoriesResult,
        adminRoleResult,
        memberResult,
        profileResult,
        settingsResult,
      ] = await Promise.all([
        supabase
          .from('preference_categories')
          .select('id, key, label_en, label_nl')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user?.id)
          .eq('role', 'admin')
          .maybeSingle(),
        supabase
          .from('members')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .maybeSingle(),
        supabase
          .from('site_settings')
          .select('key, value_en, value_nl'),
      ]);

      // Set immediate state updates
      setPreferenceCategories(categoriesResult.data || []);
      setIsAdmin(!!adminRoleResult.data);
      setSiteSettings(settingsResult.data || []);
      
      const memberData = memberResult.data;
      if (memberResult.error) throw memberResult.error;
      setMember(memberData);

      if (profileResult.data) {
        setProfile({
          first_name: profileResult.data.first_name || '',
          last_name: profileResult.data.last_name || '',
          phone: profileResult.data.phone || '',
          street_address: profileResult.data.street_address || '',
          house_number: profileResult.data.house_number || '',
          postal_code: profileResult.data.postal_code || '',
          city: profileResult.data.city || '',
          country: profileResult.data.country || 'Nederland',
          preferences: profileResult.data.preferences || [],
          email_verified: profileResult.data.email_verified ?? null,
          has_seen_tour: (profileResult.data as any).has_seen_tour ?? false,
        });
      }

      // Phase 2: Fetch member-dependent data in parallel (if member exists)
      if (memberData) {
        const now = new Date().toISOString();
        
        const [
          codesResult,
          activeDropResult,
          upcomingDropResult,
          ordersResult,
        ] = await Promise.all([
          supabase
            .from('invite_codes')
            .select('*')
            .eq('member_id', memberData.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('drops')
            .select('*')
            .eq('is_active', true)
            .eq('is_draft', false)
            .lt('starts_at', now)
            .order('starts_at', { ascending: false })
            .limit(1),
          supabase
            .from('drops')
            .select('*')
            .eq('is_active', true)
            .eq('is_draft', false)
            .gt('starts_at', now)
            .order('starts_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('drop_participation')
            .select(`
              id,
              drop_id,
              purchased,
              quantity,
              created_at,
              shopify_order_id,
              drops (
                title_en,
                title_nl,
                price,
                image_url
              )
            `)
            .eq('member_id', memberData.id)
            .eq('purchased', true)
            .order('created_at', { ascending: false }),
        ]);

        setInviteCodes(codesResult.data || []);
        
        // Filter to find truly active drop (either no end date or end date in future)
        const activeDrop = activeDropResult.data?.find(d => !d.ends_at || new Date(d.ends_at) > new Date());
        setActiveDrop(activeDrop || null);
        
        setUpcomingDrop(upcomingDropResult.data);
        
        const ordersData = (ordersResult.data || []).map((o: any) => ({
          ...o,
          drop: o.drops,
          shopify_order_id: o.shopify_order_id,
        }));
        setOrders(ordersData);

        // Fetch Shopify order details if we have order IDs
        const shopifyOrderIds = ordersData
          .filter((o: any) => o.shopify_order_id)
          .map((o: any) => o.shopify_order_id);

        if (shopifyOrderIds.length > 0) {
          fetchShopifyOrderDetails(shopifyOrderIds, ordersData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopifyOrderDetails = async (orderIds: string[], ordersData: OrderHistory[]) => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-order-details', {
        body: { shopify_order_ids: orderIds },
      });

      if (error) {
        console.error('Error fetching Shopify order details:', error);
        return;
      }

      if (data?.orders) {
        // Merge Shopify details into orders
        const enrichedOrders = ordersData.map((order) => ({
          ...order,
          shopifyDetails: order.shopify_order_id ? data.orders[order.shopify_order_id] : undefined,
        }));
        setOrders(enrichedOrders);
      }
    } catch (error) {
      console.error('Error fetching Shopify order details:', error);
    } finally {
      setOrdersLoading(false);
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

  const expiredCodes = inviteCodes.filter(c => !c.used_by && new Date(c.expires_at) < new Date());
  
  const deleteExpiredCodes = async () => {
    if (expiredCodes.length === 0) return;
    
    try {
      const expiredIds = expiredCodes.map(c => c.id);
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .in('id', expiredIds);
      
      if (error) throw error;
      
      toast.success(t.dashboard.expiredDeleted);
      fetchData();
    } catch (error) {
      console.error('Error deleting expired codes:', error);
      toast.error(t.common.error);
    }
  };

  // Start tour for new members
  useEffect(() => {
    if (member && profile.has_seen_tour === false && !loading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setRunTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [member, profile.has_seen_tour, loading]);

  const handleTourComplete = async () => {
    setRunTour(false);
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ has_seen_tour: true } as any)
        .eq('id', user.id);
      
      setProfile(prev => ({ ...prev, has_seen_tour: true }));
    } catch (error) {
      console.error('Error updating tour status:', error);
    }
  };

  const restartTour = () => {
    setRunTour(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  if (!member) {
    const emailNotVerified = profile && !profile.email_verified;
    
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center py-24">
            {emailNotVerified ? (
              <>
                <h1 className="font-serif text-3xl mb-4">{t.auth.verifyEmail}</h1>
                <p className="text-muted-foreground mb-8">
                  {t.auth.verifyEmailDesc}
                </p>
                <Link to="/auth" className="btn-outline-luxury">
                  {t.auth.resendVerification}
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-serif text-3xl mb-4">{t.dashboard.notMemberTitle}</h1>
                <p className="text-muted-foreground mb-8">
                  {t.dashboard.notMemberDesc}
                </p>
                <Link to="/" className="btn-outline-luxury">
                  {t.common.back}
                </Link>
              </>
            )}
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
      <OnboardingTour run={runTour} onComplete={handleTourComplete} isAdmin={isAdmin} />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Welcome Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl mb-2">{t.dashboard.title}</h1>
                <p className="text-muted-foreground">
                  {t.dashboard.welcome}, {profile.first_name || user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <TourButton onClick={restartTour} />
              {isAdmin && (
                <Link
                  to="/admin"
                  data-tour="admin-button"
                  className="btn-outline-luxury flex items-center gap-2 text-sm w-fit"
                >
                  <Shield className="w-4 h-4" />
                  {t.nav.admin}
                </Link>
              )}
            </div>
          </div>

          <Tabs defaultValue="drops" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-xl h-auto">
              <TabsTrigger value="drops" data-tour="drops-tab" className="flex items-center gap-2 py-3">
                <Wine className="w-4 h-4" />
                <span className="hidden sm:inline">Drops</span>
                <span className="sm:hidden">Drops</span>
              </TabsTrigger>
              <TabsTrigger value="overview" data-tour="overview-tab" className="py-3">Overview</TabsTrigger>
              <TabsTrigger value="orders" data-tour="orders-tab" className="flex items-center gap-2 py-3">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'nl' ? 'Bestellingen' : 'Orders'}</span>
                <span className="sm:hidden">{language === 'nl' ? 'Orders' : 'Orders'}</span>
              </TabsTrigger>
              <TabsTrigger value="profile" data-tour="profile-tab" className="flex items-center gap-2 py-3">
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

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inviteCodes
                      .sort((a, b) => {
                        // Sort: active first, then used, then expired
                        const getOrder = (code: InviteCode) => {
                          if (code.used_by) return 1;
                          if (new Date(code.expires_at) < new Date()) return 2;
                          return 0;
                        };
                        return getOrder(a) - getOrder(b);
                      })
                      .map((code) => {
                        const isUsed = !!code.used_by;
                        const isExpired = !isUsed && new Date(code.expires_at) < new Date();
                        const isActive = !isUsed && !isExpired;
                        
                        return (
                          <div
                            key={code.id}
                            className={`flex items-center justify-between px-3 py-2 text-sm ${
                              isActive ? 'bg-muted/50' : 'bg-muted/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <code className={`font-mono text-xs sm:text-sm ${
                                !isActive ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {code.code}
                              </code>
                              {isUsed && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">
                                  {t.dashboard.inviteUsed}
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-destructive/20 text-destructive rounded">
                                  {t.dashboard.inviteExpired}
                                </span>
                              )}
                            </div>
                            {isActive && (
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
                                  title={t.dashboard.copyMessage}
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
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {expiredCodes.length > 0 && (
                    <button
                      onClick={deleteExpiredCodes}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors mt-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.dashboard.deleteExpired} ({expiredCodes.length})
                    </button>
                  )}

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
              <OrdersList orders={orders} loading={ordersLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}