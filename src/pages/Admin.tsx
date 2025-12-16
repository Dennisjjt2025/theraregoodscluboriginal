import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Wine, Clock, Check, X, RotateCcw, Minus, FileText, Save } from 'lucide-react';

interface Drop {
  id: string;
  title_en: string;
  title_nl: string;
  price: number;
  quantity_available: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface Member {
  id: string;
  user_id: string;
  status: string;
  strike_count: number;
  invites_remaining: number;
  created_at: string;
  notes: string | null;
  email?: string;
}

interface WaitlistEntry {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
}

interface MemberEmail {
  member_id: string;
  user_id: string;
  email: string;
}

interface DropParticipationReport {
  member_id: string;
  user_id: string;
  email: string;
  status: string;
  strike_count: number;
  purchased: boolean;
  notes: string | null;
}

export default function Admin() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({});
  
  // Drop participation report state
  const [selectedDropForReport, setSelectedDropForReport] = useState<string>('');
  const [participationReport, setParticipationReport] = useState<DropParticipationReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'purchased' | 'not_purchased'>('all');
  const [loadingReport, setLoadingReport] = useState(false);

  // Notes editing state
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  // Drop form state
  const [dropForm, setDropForm] = useState({
    title_en: '',
    title_nl: '',
    description_en: '',
    description_nl: '',
    story_en: '',
    story_nl: '',
    tasting_notes_en: '',
    tasting_notes_nl: '',
    origin: '',
    vintage: '',
    price: '',
    quantity_available: '',
    image_url: '',
    shopify_product_id: '',
    starts_at: '',
    ends_at: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkAdmin();
    }
  }, [user, authLoading, navigate]);

  const checkAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      fetchData();
    } catch (error) {
      console.error('Admin check error:', error);
      navigate('/dashboard');
    }
  };

  const fetchData = async () => {
    try {
      const [dropsRes, membersRes, waitlistRes, emailsRes] = await Promise.all([
        supabase.from('drops').select('*').order('created_at', { ascending: false }),
        supabase.from('members').select('*').order('created_at', { ascending: false }),
        supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
        supabase.rpc('get_member_emails'),
      ]);

      setDrops(dropsRes.data || []);
      setMembers(membersRes.data || []);
      setWaitlist(waitlistRes.data || []);
      
      // Build email lookup map
      const emailMap: Record<string, string> = {};
      if (emailsRes.data) {
        (emailsRes.data as MemberEmail[]).forEach((item) => {
          emailMap[item.member_id] = item.email;
        });
      }
      setMemberEmails(emailMap);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropParticipationReport = async (dropId: string) => {
    if (!dropId) {
      setParticipationReport([]);
      return;
    }
    
    setLoadingReport(true);
    try {
      const { data, error } = await supabase.rpc('get_drop_participation_report', {
        drop_id_param: dropId
      });
      
      if (error) throw error;
      setParticipationReport((data as DropParticipationReport[]) || []);
    } catch (error) {
      console.error('Fetch report error:', error);
      toast.error(t.common.error);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedDropForReport) {
      fetchDropParticipationReport(selectedDropForReport);
    }
  }, [selectedDropForReport]);

  const handleCreateDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('drops').insert({
        ...dropForm,
        price: parseFloat(dropForm.price),
        quantity_available: parseInt(dropForm.quantity_available),
      });

      if (error) throw error;

      toast.success('Drop created successfully');
      setDropForm({
        title_en: '', title_nl: '', description_en: '', description_nl: '',
        story_en: '', story_nl: '', tasting_notes_en: '', tasting_notes_nl: '',
        origin: '', vintage: '', price: '', quantity_available: '',
        image_url: '', shopify_product_id: '', starts_at: '', ends_at: '',
      });
      fetchData();
    } catch (error) {
      console.error('Create drop error:', error);
      toast.error(t.common.error);
    }
  };

  const toggleDropActive = async (dropId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drops')
        .update({ is_active: !currentStatus })
        .eq('id', dropId);

      if (error) throw error;
      toast.success(`Drop ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Toggle drop error:', error);
      toast.error(t.common.error);
    }
  };

  const updateMemberStatus = async (memberId: string, status: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ status })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Member updated');
      fetchData();
    } catch (error) {
      console.error('Update member error:', error);
      toast.error(t.common.error);
    }
  };

  const addStrike = async (memberId: string, currentStrikes: number) => {
    if (currentStrikes >= 3) {
      toast.error('Member already has maximum strikes');
      return;
    }
    try {
      const newStrikes = currentStrikes + 1;
      const updates: { strike_count: number; status?: 'suspended' } = { strike_count: newStrikes };
      
      // Auto-suspend at 3 strikes
      if (newStrikes >= 3) {
        updates.status = 'suspended';
      }
      
      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;
      toast.success(`Strike added (${newStrikes}/3)${newStrikes >= 3 ? ' - Member suspended' : ''}`);
      fetchData();
    } catch (error) {
      console.error('Add strike error:', error);
      toast.error(t.common.error);
    }
  };

  const removeStrike = async (memberId: string, currentStrikes: number) => {
    if (currentStrikes <= 0) {
      toast.error('Member has no strikes to remove');
      return;
    }
    try {
      const { error } = await supabase
        .from('members')
        .update({ strike_count: currentStrikes - 1 })
        .eq('id', memberId);

      if (error) throw error;
      toast.success(`Strike removed (${currentStrikes - 1}/3)`);
      fetchData();
    } catch (error) {
      console.error('Remove strike error:', error);
      toast.error(t.common.error);
    }
  };

  const resetStrikes = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ strike_count: 0 })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Strikes reset');
      fetchData();
    } catch (error) {
      console.error('Reset strikes error:', error);
      toast.error(t.common.error);
    }
  };

  const saveNotes = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ notes: notesValue || null })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Notes saved');
      setEditingNotes(null);
      fetchData();
    } catch (error) {
      console.error('Save notes error:', error);
      toast.error(t.common.error);
    }
  };

  const handleWaitlistAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Request ${status}`);
      fetchData();
    } catch (error) {
      console.error('Waitlist action error:', error);
      toast.error(t.common.error);
    }
  };

  const getStrikeIndicator = (strikes: number) => {
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < strikes
                ? strikes >= 3
                  ? 'bg-destructive'
                  : strikes >= 2
                  ? 'bg-amber-500'
                  : 'bg-amber-400'
                : 'bg-muted border border-border'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{strikes}/3</span>
      </div>
    );
  };

  const filteredReport = participationReport.filter((item) => {
    if (reportFilter === 'purchased') return item.purchased;
    if (reportFilter === 'not_purchased') return !item.purchased;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="font-serif text-3xl md:text-4xl mb-8">{t.admin.title}</h1>

          <Tabs defaultValue="drops" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="drops" className="flex items-center gap-2">
                <Wine className="w-4 h-4" />
                {t.admin.manageDrop}
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t.admin.manageMembers}
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t.admin.dropReport}
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t.admin.waitlist}
              </TabsTrigger>
            </TabsList>

            {/* Drops Tab */}
            <TabsContent value="drops" className="space-y-6">
              {/* Create Drop Form */}
              <div className="bg-card border border-border p-6">
                <h2 className="font-serif text-xl mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {t.admin.createDrop}
                </h2>
                <form onSubmit={handleCreateDrop} className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={dropForm.title_en}
                    onChange={(e) => setDropForm({ ...dropForm, title_en: e.target.value })}
                    placeholder={t.admin.dropTitleEn}
                    required
                    className="input-luxury"
                  />
                  <input
                    type="text"
                    value={dropForm.title_nl}
                    onChange={(e) => setDropForm({ ...dropForm, title_nl: e.target.value })}
                    placeholder={t.admin.dropTitleNl}
                    required
                    className="input-luxury"
                  />
                  <textarea
                    value={dropForm.description_en}
                    onChange={(e) => setDropForm({ ...dropForm, description_en: e.target.value })}
                    placeholder={t.admin.descriptionEn}
                    rows={2}
                    className="input-luxury"
                  />
                  <textarea
                    value={dropForm.description_nl}
                    onChange={(e) => setDropForm({ ...dropForm, description_nl: e.target.value })}
                    placeholder={t.admin.descriptionNl}
                    rows={2}
                    className="input-luxury"
                  />
                  <textarea
                    value={dropForm.story_en}
                    onChange={(e) => setDropForm({ ...dropForm, story_en: e.target.value })}
                    placeholder={t.admin.storyEn}
                    rows={3}
                    className="input-luxury"
                  />
                  <textarea
                    value={dropForm.story_nl}
                    onChange={(e) => setDropForm({ ...dropForm, story_nl: e.target.value })}
                    placeholder={t.admin.storyNl}
                    rows={3}
                    className="input-luxury"
                  />
                  <textarea
                    value={dropForm.tasting_notes_en}
                    onChange={(e) => setDropForm({ ...dropForm, tasting_notes_en: e.target.value })}
                    placeholder={t.admin.tastingNotesEn}
                    rows={2}
                    className="input-luxury"
                  />
                  <textarea
                    value={dropForm.tasting_notes_nl}
                    onChange={(e) => setDropForm({ ...dropForm, tasting_notes_nl: e.target.value })}
                    placeholder={t.admin.tastingNotesNl}
                    rows={2}
                    className="input-luxury"
                  />
                  <input
                    type="text"
                    value={dropForm.origin}
                    onChange={(e) => setDropForm({ ...dropForm, origin: e.target.value })}
                    placeholder="Origin (e.g., Bordeaux, France)"
                    className="input-luxury"
                  />
                  <input
                    type="text"
                    value={dropForm.vintage}
                    onChange={(e) => setDropForm({ ...dropForm, vintage: e.target.value })}
                    placeholder="Vintage (e.g., 2015)"
                    className="input-luxury"
                  />
                  <input
                    type="number"
                    value={dropForm.price}
                    onChange={(e) => setDropForm({ ...dropForm, price: e.target.value })}
                    placeholder={t.admin.price}
                    step="0.01"
                    required
                    className="input-luxury"
                  />
                  <input
                    type="number"
                    value={dropForm.quantity_available}
                    onChange={(e) => setDropForm({ ...dropForm, quantity_available: e.target.value })}
                    placeholder={t.admin.quantity}
                    required
                    className="input-luxury"
                  />
                  <input
                    type="url"
                    value={dropForm.image_url}
                    onChange={(e) => setDropForm({ ...dropForm, image_url: e.target.value })}
                    placeholder={t.admin.imageUrl}
                    className="input-luxury"
                  />
                  <input
                    type="text"
                    value={dropForm.shopify_product_id}
                    onChange={(e) => setDropForm({ ...dropForm, shopify_product_id: e.target.value })}
                    placeholder={t.admin.shopifyProductId}
                    className="input-luxury"
                  />
                  <div>
                    <label className="text-sm text-muted-foreground">{t.admin.startDate}</label>
                    <input
                      type="datetime-local"
                      value={dropForm.starts_at}
                      onChange={(e) => setDropForm({ ...dropForm, starts_at: e.target.value })}
                      required
                      className="input-luxury w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{t.admin.endDate}</label>
                    <input
                      type="datetime-local"
                      value={dropForm.ends_at}
                      onChange={(e) => setDropForm({ ...dropForm, ends_at: e.target.value })}
                      required
                      className="input-luxury w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" className="btn-luxury">
                      {t.admin.createDropBtn}
                    </button>
                  </div>
                </form>
              </div>

              {/* Drops List */}
              <div className="bg-card border border-border p-6">
                <h2 className="font-serif text-xl mb-6">{t.admin.manageDrop}</h2>
                <div className="space-y-4">
                  {drops.map((drop) => (
                    <div
                      key={drop.id}
                      className="flex items-center justify-between p-4 bg-muted/30 border border-border"
                    >
                      <div>
                        <h3 className="font-medium">{drop.title_en}</h3>
                        <p className="text-sm text-muted-foreground">
                          €{drop.price} · {drop.quantity_available} units
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs ${drop.is_active ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {drop.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => toggleDropActive(drop.id, drop.is_active)}
                          className="btn-outline-luxury text-xs px-3 py-1"
                        >
                          {drop.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {drops.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No drops yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <div className="bg-card border border-border p-6">
                <h2 className="font-serif text-xl mb-6">{t.admin.manageMembers}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberEmail}</th>
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberStatus}</th>
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberStrikes}</th>
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberNotes}</th>
                        <th className="text-right py-3 px-4 font-sans text-sm font-medium">{t.admin.memberActions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b border-border/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm">{memberEmails[member.id] || 'Loading...'}</p>
                              <p className="text-xs text-muted-foreground font-mono">{member.user_id.slice(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs ${member.status === 'active' ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">{getStrikeIndicator(member.strike_count)}</td>
                          <td className="py-3 px-4 max-w-xs">
                            {editingNotes === member.id ? (
                              <div className="flex items-center gap-2">
                                <textarea
                                  value={notesValue}
                                  onChange={(e) => setNotesValue(e.target.value)}
                                  className="input-luxury text-sm flex-1"
                                  rows={2}
                                  placeholder={t.admin.addNote}
                                />
                                <button
                                  onClick={() => saveNotes(member.id)}
                                  className="p-1 text-secondary hover:text-secondary/80"
                                  title={t.common.save}
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingNotes(null)}
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                  title={t.common.cancel}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingNotes(member.id);
                                  setNotesValue(member.notes || '');
                                }}
                                className="text-left text-sm text-muted-foreground hover:text-foreground truncate block w-full"
                              >
                                {member.notes || t.admin.addNote}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => addStrike(member.id, member.strike_count)}
                                className="p-1 text-amber-500 hover:text-amber-600"
                                title={t.admin.addStrike}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeStrike(member.id, member.strike_count)}
                                className="p-1 text-secondary hover:text-secondary/80"
                                title={t.admin.removeStrike}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => resetStrikes(member.id)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                                title={t.admin.resetStrikes}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              {member.status === 'active' ? (
                                <button
                                  onClick={() => updateMemberStatus(member.id, 'suspended')}
                                  className="p-1 text-destructive hover:text-destructive/80"
                                  title={t.admin.suspendMember}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateMemberStatus(member.id, 'active')}
                                  className="p-1 text-secondary hover:text-secondary/80"
                                  title={t.admin.activateMember}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {members.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No members yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Drop Participation Report Tab */}
            <TabsContent value="report">
              <div className="bg-card border border-border p-6">
                <h2 className="font-serif text-xl mb-6">{t.admin.dropReport}</h2>
                
                {/* Drop Selection & Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <select
                    value={selectedDropForReport}
                    onChange={(e) => setSelectedDropForReport(e.target.value)}
                    className="input-luxury flex-1"
                  >
                    <option value="">{t.admin.selectDrop}</option>
                    {drops.map((drop) => (
                      <option key={drop.id} value={drop.id}>
                        {drop.title_en} ({new Date(drop.starts_at).toLocaleDateString()} - {new Date(drop.ends_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReportFilter('all')}
                      className={`px-3 py-2 text-sm ${reportFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      {t.admin.filterAll}
                    </button>
                    <button
                      onClick={() => setReportFilter('purchased')}
                      className={`px-3 py-2 text-sm ${reportFilter === 'purchased' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      {t.admin.filterPurchased}
                    </button>
                    <button
                      onClick={() => setReportFilter('not_purchased')}
                      className={`px-3 py-2 text-sm ${reportFilter === 'not_purchased' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      {t.admin.filterNotPurchased}
                    </button>
                  </div>
                </div>

                {/* Report Stats */}
                {selectedDropForReport && participationReport.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted/30 border border-border p-4 text-center">
                      <p className="text-2xl font-serif">{participationReport.length}</p>
                      <p className="text-sm text-muted-foreground">{t.admin.totalMembers}</p>
                    </div>
                    <div className="bg-secondary/10 border border-secondary/30 p-4 text-center">
                      <p className="text-2xl font-serif text-secondary">{participationReport.filter(r => r.purchased).length}</p>
                      <p className="text-sm text-muted-foreground">{t.admin.purchased}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                      <p className="text-2xl font-serif text-amber-600">{participationReport.filter(r => !r.purchased).length}</p>
                      <p className="text-sm text-muted-foreground">{t.admin.notPurchased}</p>
                    </div>
                  </div>
                )}

                {/* Report Table */}
                {loadingReport ? (
                  <p className="text-center py-8 text-muted-foreground">{t.common.loading}</p>
                ) : selectedDropForReport ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberEmail}</th>
                          <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.purchaseStatus}</th>
                          <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberStrikes}</th>
                          <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberNotes}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReport.map((item) => (
                          <tr key={item.member_id} className="border-b border-border/50">
                            <td className="py-3 px-4 text-sm">{item.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs ${item.purchased ? 'bg-secondary text-secondary-foreground' : 'bg-amber-500/20 text-amber-700'}`}>
                                {item.purchased ? t.admin.purchased : t.admin.notPurchased}
                              </span>
                            </td>
                            <td className="py-3 px-4">{getStrikeIndicator(item.strike_count)}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredReport.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">{t.admin.noResults}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t.admin.selectDropPrompt}</p>
                )}
              </div>
            </TabsContent>

            {/* Waitlist Tab */}
            <TabsContent value="waitlist">
              <div className="bg-card border border-border p-6">
                <h2 className="font-serif text-xl mb-6">{t.admin.waitlist}</h2>
                <div className="space-y-4">
                  {waitlist.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-muted/30 border border-border"
                    >
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleWaitlistAction(entry.id, 'approved')}
                              className="p-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                              title={t.admin.approveWaitlist}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleWaitlistAction(entry.id, 'rejected')}
                              className="p-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              title={t.admin.rejectWaitlist}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className={`px-2 py-1 text-xs ${entry.status === 'approved' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {entry.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {waitlist.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No waitlist entries</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}