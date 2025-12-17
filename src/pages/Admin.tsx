import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { MemberDetailModal } from '@/components/admin/MemberDetailModal';
import { EmailComposer } from '@/components/admin/EmailComposer';
import { DropEditor } from '@/components/admin/DropEditor';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Wine, Clock, Check, X, RotateCcw, Minus, FileText, Save, Eye, Mail, MailCheck, Gift, Send, Globe, Lock, Trash2, Pencil, Copy, MessageSquare, Heart } from 'lucide-react';
import { SiteSettingsEditor } from '@/components/admin/SiteSettingsEditor';
import { PreferencesOverview } from '@/components/admin/PreferencesOverview';
import { PreferenceCategoriesManager } from '@/components/admin/PreferenceCategoriesManager';

interface Drop {
  id: string;
  title_en: string;
  title_nl: string;
  description_en?: string;
  description_nl?: string;
  story_en?: string;
  story_nl?: string;
  tasting_notes_en?: string;
  tasting_notes_nl?: string;
  origin?: string;
  vintage?: string;
  price: number;
  quantity_available: number;
  quantity_sold?: number;
  image_url?: string;
  video_url?: string;
  shopify_product_id?: string;
  starts_at: string;
  ends_at?: string;
  is_active: boolean;
  is_public: boolean;
  is_draft?: boolean;
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
  email_verified: boolean;
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
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [memberEmails, setMemberEmails] = useState<Record<string, { email: string; verified: boolean }>>({});
  
  // Drop participation report state
  const [selectedDropForReport, setSelectedDropForReport] = useState<string>('');
  const [participationReport, setParticipationReport] = useState<DropParticipationReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'purchased' | 'not_purchased'>('all');
  const [loadingReport, setLoadingReport] = useState(false);

  // Notes editing state
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  // Member detail modal state
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<{ id: string; email: string } | null>(null);

  // Email composer state
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailComposerPreselect, setEmailComposerPreselect] = useState<{ email?: string; type?: 'strike_warning' | 'thank_you' | 'drop_update' | 'newsletter' | 'custom' } | null>(null);

  // Drop edit modal state
  const [showDropModal, setShowDropModal] = useState(false);
  const [selectedDropForEdit, setSelectedDropForEdit] = useState<Drop | null>(null);
  const [dropModalMode, setDropModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');

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
      
      // Build email lookup map with verification status
      const emailMap: Record<string, { email: string; verified: boolean }> = {};
      if (emailsRes.data) {
        (emailsRes.data as MemberEmail[]).forEach((item) => {
          emailMap[item.member_id] = { email: item.email, verified: item.email_verified };
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

  const openDropModal = (mode: 'create' | 'edit' | 'duplicate', drop?: Drop) => {
    setDropModalMode(mode);
    setSelectedDropForEdit(drop || null);
    setShowDropModal(true);
  };

  const deleteDrop = async (dropId: string) => {
    if (!confirm('Are you sure you want to delete this drop?')) return;
    
    try {
      const { error } = await supabase
        .from('drops')
        .delete()
        .eq('id', dropId);

      if (error) throw error;
      toast.success('Drop deleted');
      fetchData();
    } catch (error) {
      console.error('Delete drop error:', error);
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

  const verifyMemberEmail = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId);

      if (error) throw error;
      toast.success(t.admin.emailVerifiedSuccess);
      fetchData();
    } catch (error) {
      console.error('Verify email error:', error);
      toast.error(t.common.error);
    }
  };

  const updateMemberInvites = async (memberId: string, currentInvites: number, delta: number) => {
    const newInvites = Math.max(0, currentInvites + delta);
    try {
      const { error } = await supabase
        .from('members')
        .update({ invites_remaining: newInvites })
        .eq('id', memberId);

      if (error) throw error;
      toast.success(`${t.admin.invitesUpdated}: ${newInvites}`);
      fetchData();
    } catch (error) {
      console.error('Update invites error:', error);
      toast.error(t.common.error);
    }
  };

  const bulkAddInvites = async (amount: number) => {
    try {
      // Get all active members
      const { data: activeMembers, error: fetchError } = await supabase
        .from('members')
        .select('id, invites_remaining')
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      // Update each member's invites
      for (const member of activeMembers || []) {
        await supabase
          .from('members')
          .update({ invites_remaining: member.invites_remaining + amount })
          .eq('id', member.id);
      }

      toast.success(`${t.admin.bulkInvitesAdded}: +${amount} ${t.admin.toAllMembers}`);
      fetchData();
    } catch (error) {
      console.error('Bulk add invites error:', error);
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

  const handleWaitlistAction = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (error) {
      console.error('Waitlist action error:', error);
      toast.error(t.common.error);
    }
  };

  const deleteWaitlistEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Waitlist entry deleted');
      fetchData();
    } catch (error) {
      console.error('Delete waitlist error:', error);
      toast.error(t.common.error);
    }
  };

  const toggleDropPublic = async (dropId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drops')
        .update({ is_public: !currentStatus })
        .eq('id', dropId);

      if (error) throw error;
      toast.success(`Drop ${!currentStatus ? 'made public for waitlist' : 'set to members only'}`);
      fetchData();
    } catch (error) {
      console.error('Toggle public error:', error);
      toast.error(t.common.error);
    }
  };

  const emailWaitlistAboutDrop = async (dropId: string, dropTitle: string) => {
    const publicDrops = drops.filter(d => d.is_public);
    if (publicDrops.length === 0) {
      toast.error('Please make the drop public first');
      return;
    }

    // Check if there are eligible waitlist entries
    const eligibleWaitlist = waitlist.filter(w => w.status === 'pending' || w.status === 'approved');
    if (eligibleWaitlist.length === 0) {
      toast.error('No eligible waitlist entries (only pending/approved status)');
      return;
    }
    
    try {
      const dropUrl = `${window.location.origin}/drop?public=${dropId}`;
      const response = await supabase.functions.invoke('send-member-email', {
        body: {
          type: 'waitlist',
          subject: `Exclusive Access: ${dropTitle}`,
          message: `You've been given exclusive early access to our latest drop!\n\nThis is a limited offer available only to our waitlist members. Don't miss your chance to get your hands on this rare item.\n\nVisit the drop page: ${dropUrl}`,
          emailType: 'drop_update',
        },
      });

      if (response.error) throw response.error;
      toast.success(`Email sent to ${response.data?.sent || 0} waitlist members`);
    } catch (error: any) {
      console.error('Email waitlist error:', error);
      toast.error(error?.message || t.common.error);
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
      
      {/* Member Detail Modal */}
      {selectedMemberForDetail && (
        <MemberDetailModal
          memberId={selectedMemberForDetail.id}
          memberEmail={selectedMemberForDetail.email}
          onClose={() => setSelectedMemberForDetail(null)}
          onUpdate={fetchData}
        />
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposer
          onClose={() => {
            setShowEmailComposer(false);
            setEmailComposerPreselect(null);
          }}
          preselectedEmail={emailComposerPreselect?.email}
          preselectedType={emailComposerPreselect?.type}
        />
      )}

      {/* Drop Editor */}
      {showDropModal && (
        <DropEditor
          drop={selectedDropForEdit}
          onClose={() => {
            setShowDropModal(false);
            setSelectedDropForEdit(null);
          }}
          onSave={fetchData}
          mode={dropModalMode}
        />
      )}
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="font-serif text-3xl md:text-4xl mb-8">{t.admin.title}</h1>

          <Tabs defaultValue="drops" className="space-y-6">
            <TabsList className="bg-card border border-border flex-wrap">
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
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                {language === 'nl' ? 'Voorkeuren' : 'Preferences'}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {language === 'nl' ? 'Berichten' : 'Messages'}
              </TabsTrigger>
            </TabsList>

            {/* Drops Tab */}
            <TabsContent value="drops" className="space-y-6">
              {/* Header with Create Button */}
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">{t.admin.manageDrop}</h2>
                <button
                  onClick={() => openDropModal('create')}
                  className="btn-luxury flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t.admin.createDrop}
                </button>
              </div>

              {/* Drops List */}
              <div className="bg-card border border-border">
                <div className="divide-y divide-border">
                  {drops.map((drop) => (
                    <div
                      key={drop.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                        {drop.image_url ? (
                          <img
                            src={drop.image_url}
                            alt={drop.title_en}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Wine className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{drop.title_en}</h3>
                          {drop.is_draft && (
                            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-700 rounded">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>€{drop.price}</span>
                          <span>·</span>
                          <span>{(drop.quantity_sold || 0)}/{drop.quantity_available} sold</span>
                          {drop.ends_at ? (
                            <>
                              <span>·</span>
                              <span>Ends {new Date(drop.ends_at).toLocaleDateString()}</span>
                            </>
                          ) : (
                            <>
                              <span>·</span>
                              <span className="text-secondary">While supplies last</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs ${drop.is_active ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {drop.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => toggleDropPublic(drop.id, drop.is_public)}
                          className={`p-2 ${drop.is_public ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}
                          title={drop.is_public ? 'Public for waitlist' : 'Members only'}
                        >
                          {drop.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDropModal('edit', drop)}
                          className="p-2 hover:bg-muted rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDropModal('duplicate', drop)}
                          className="p-2 hover:bg-muted rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/drop/preview?id=${drop.id}`, '_blank')}
                          className="p-2 hover:bg-muted rounded"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleDropActive(drop.id, drop.is_active)}
                          className={`p-2 rounded ${drop.is_active ? 'hover:bg-destructive/10 text-destructive' : 'hover:bg-secondary/10 text-secondary'}`}
                          title={drop.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {drop.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteDrop(drop.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {drops.length === 0 && (
                    <div className="p-12 text-center">
                      <Wine className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No drops yet</p>
                      <button
                        onClick={() => openDropModal('create')}
                        className="btn-outline-luxury"
                      >
                        Create your first drop
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <div className="bg-card border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl">{t.admin.manageMembers}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t.admin.bulkActions}:</span>
                    <button
                      onClick={() => bulkAddInvites(1)}
                      className="btn-outline-luxury text-xs px-3 py-1 flex items-center gap-1"
                    >
                      <Gift className="w-3 h-3" />
                      +1 {t.admin.toAllMembers}
                    </button>
                    <button
                      onClick={() => bulkAddInvites(3)}
                      className="btn-outline-luxury text-xs px-3 py-1 flex items-center gap-1"
                    >
                      <Gift className="w-3 h-3" />
                      +3 {t.admin.toAllMembers}
                    </button>
                    <button
                      onClick={() => {
                        setEmailComposerPreselect(null);
                        setShowEmailComposer(true);
                      }}
                      className="btn-luxury text-xs px-3 py-1 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {t.admin.sendEmail || 'Email'}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberEmail}</th>
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberStatus}</th>
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberStrikes}</th>
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberInvites}</th>
                        <th className="text-left py-3 px-4 font-sans text-sm font-medium">{t.admin.memberNotes}</th>
                        <th className="text-right py-3 px-4 font-sans text-sm font-medium">{t.admin.memberActions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b border-border/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-sm">{memberEmails[member.id]?.email ?? 'Loading...'}</p>
                                <p className="text-xs text-muted-foreground font-mono">{member.user_id.slice(0, 8)}...</p>
                              </div>
                              {memberEmails[member.id] && memberEmails[member.id].verified ? (
                                <span title={t.admin.emailVerifiedLabel}>
                                  <MailCheck className="w-4 h-4 text-secondary" />
                                </span>
                              ) : memberEmails[member.id] ? (
                                <button
                                  onClick={() => verifyMemberEmail(member.user_id)}
                                  className="p-1 text-muted-foreground hover:text-secondary"
                                  title={t.admin.verifyEmailBtn}
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs ${member.status === 'active' ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">{getStrikeIndicator(member.strike_count)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateMemberInvites(member.id, member.invites_remaining, -1)}
                                disabled={member.invites_remaining <= 0}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                title={t.admin.removeInvite}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{member.invites_remaining}</span>
                              <button
                                onClick={() => updateMemberInvites(member.id, member.invites_remaining, 1)}
                                className="p-1 text-secondary hover:text-secondary/80"
                                title={t.admin.addInvite}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
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
                                onClick={() => setSelectedMemberForDetail({ id: member.id, email: memberEmails[member.id]?.email || '' })}
                                className="p-1 text-primary hover:text-primary/80"
                                title={t.admin.viewDetails}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEmailComposerPreselect({ email: memberEmails[member.id]?.email });
                                  setShowEmailComposer(true);
                                }}
                                className="p-1 text-accent hover:text-accent/80"
                                title={t.admin.emailMember}
                              >
                                <Send className="w-4 h-4" />
                              </button>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl">{t.admin.waitlist}</h2>
                  {drops.filter(d => d.is_public).length > 0 && waitlist.filter(w => w.status === 'pending' || w.status === 'approved').length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        className="input-luxury text-sm"
                        id="waitlist-drop-select"
                      >
                        {drops.filter(d => d.is_public).map(drop => (
                          <option key={drop.id} value={drop.id}>{drop.title_en}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById('waitlist-drop-select') as HTMLSelectElement;
                          const selectedDrop = drops.find(d => d.id === select.value);
                          if (selectedDrop) {
                            emailWaitlistAboutDrop(selectedDrop.id, selectedDrop.title_en);
                          }
                        }}
                        className="btn-luxury text-xs px-3 py-2 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Email Waitlist
                      </button>
                    </div>
                  )}
                </div>
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
                        <span className={`px-2 py-1 text-xs ${
                          entry.status === 'approved' ? 'bg-secondary text-secondary-foreground' : 
                          entry.status === 'pending' ? 'bg-amber-500/20 text-amber-700' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {entry.status}
                        </span>
                        {entry.status !== 'approved' && (
                          <button
                            onClick={() => handleWaitlistAction(entry.id, 'approved')}
                            className="p-2 bg-secondary/20 text-secondary hover:bg-secondary/30"
                            title={t.admin.approveWaitlist}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {entry.status !== 'pending' && (
                          <button
                            onClick={() => handleWaitlistAction(entry.id, 'pending')}
                            className="p-2 bg-amber-500/20 text-amber-700 hover:bg-amber-500/30"
                            title="Set to pending"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {entry.status !== 'rejected' && (
                          <button
                            onClick={() => handleWaitlistAction(entry.id, 'rejected')}
                            className="p-2 bg-destructive/20 text-destructive hover:bg-destructive/30"
                            title={t.admin.rejectWaitlist}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteWaitlistEntry(entry.id)}
                          className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {waitlist.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No waitlist entries</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <PreferencesOverview />
              <PreferenceCategoriesManager />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <SiteSettingsEditor />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}