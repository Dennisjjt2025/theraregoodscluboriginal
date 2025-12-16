import { useEffect, useState } from 'react';
import { X, Save, Wine, Calendar, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface MemberDetail {
  id: string;
  user_id: string;
  email: string;
  status: string;
  strike_count: number;
  invites_remaining: number;
  created_at: string;
  notes: string | null;
}

interface DropParticipation {
  id: string;
  drop_id: string;
  purchased: boolean;
  quantity: number;
  created_at: string;
  drop_title: string;
  drop_date: string;
}

interface MemberDetailModalProps {
  memberId: string;
  memberEmail: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function MemberDetailModal({ memberId, memberEmail, onClose, onUpdate }: MemberDetailModalProps) {
  const { t, language } = useLanguage();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [participations, setParticipations] = useState<DropParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  const fetchMemberDetails = async () => {
    try {
      // Fetch member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      setMember({ ...memberData, email: memberEmail });
      setNotesValue(memberData.notes || '');

      // Fetch participation history with drop details
      const { data: participationData, error: participationError } = await supabase
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
            starts_at
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (participationError) throw participationError;

      const formattedParticipations: DropParticipation[] = (participationData || []).map((p: any) => ({
        id: p.id,
        drop_id: p.drop_id,
        purchased: p.purchased,
        quantity: p.quantity || 0,
        created_at: p.created_at,
        drop_title: language === 'nl' ? p.drops?.title_nl : p.drops?.title_en,
        drop_date: p.drops?.starts_at,
      }));

      setParticipations(formattedParticipations);
    } catch (error) {
      console.error('Fetch member details error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ notes: notesValue || null })
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success(t.admin.notesSaved);
      setEditingNotes(false);
      if (member) {
        setMember({ ...member, notes: notesValue || null });
      }
      onUpdate();
    } catch (error) {
      console.error('Save notes error:', error);
      toast.error(t.common.error);
    }
  };

  const getStrikeIndicator = (strikes: number) => {
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full ${
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
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-serif text-xl">{t.admin.memberDetails}</h2>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Member Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.admin.memberStatus}</p>
              <span className={`px-2 py-1 text-xs ${member.status === 'active' ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                {member.status}
              </span>
            </div>
            <div className="bg-muted/30 border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.admin.memberStrikes}</p>
              <div className="flex items-center gap-2">
                {getStrikeIndicator(member.strike_count)}
                <span className="text-sm">{member.strike_count}/3</span>
              </div>
            </div>
            <div className="bg-muted/30 border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.admin.invitesRemaining}</p>
              <p className="text-lg font-serif">{member.invites_remaining}</p>
            </div>
            <div className="bg-muted/30 border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.admin.memberSince}</p>
              <p className="text-sm">{new Date(member.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-muted/30 border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.admin.communicationNotes}</p>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  {t.common.edit}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  className="input-luxury w-full"
                  rows={4}
                  placeholder={t.admin.notesPlaceholder}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveNotes}
                    className="btn-luxury text-sm px-3 py-1 flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    {t.common.save}
                  </button>
                  <button
                    onClick={() => {
                      setEditingNotes(false);
                      setNotesValue(member.notes || '');
                    }}
                    className="btn-outline-luxury text-sm px-3 py-1"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {member.notes || <span className="text-muted-foreground italic">{t.admin.noNotes}</span>}
              </p>
            )}
          </div>

          {/* Participation History */}
          <div>
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
              <Wine className="w-5 h-5" />
              {t.admin.participationHistory}
            </h3>
            
            {participations.length > 0 ? (
              <div className="space-y-3">
                {participations.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 border ${
                      p.purchased
                        ? 'bg-secondary/10 border-secondary/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${p.purchased ? 'bg-secondary/20' : 'bg-amber-500/20'}`}>
                        {p.purchased ? (
                          <Check className="w-4 h-4 text-secondary" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{p.drop_title || 'Unknown Drop'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {p.drop_date ? new Date(p.drop_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs ${
                        p.purchased
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-amber-500/20 text-amber-700'
                      }`}>
                        {p.purchased ? t.admin.purchased : t.admin.notPurchased}
                      </span>
                      {p.purchased && p.quantity > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.admin.quantity}: {p.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 border border-border">
                <Wine className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.admin.noParticipationHistory}</p>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {participations.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-serif">{participations.length}</p>
                <p className="text-xs text-muted-foreground">{t.admin.totalDrops}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-serif text-secondary">
                  {participations.filter(p => p.purchased).length}
                </p>
                <p className="text-xs text-muted-foreground">{t.admin.purchased}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-serif text-amber-600">
                  {participations.filter(p => !p.purchased).length}
                </p>
                <p className="text-xs text-muted-foreground">{t.admin.missed}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="btn-outline-luxury w-full"
          >
            {t.common.back}
          </button>
        </div>
      </div>
    </div>
  );
}