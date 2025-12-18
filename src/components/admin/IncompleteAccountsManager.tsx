import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { UserPlus, Trash2, Mail, AlertCircle, RefreshCw } from 'lucide-react';

interface IncompleteAccount {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  created_at: string;
  invite_code_used: string | null;
  inviter_email: string | null;
}

export function IncompleteAccountsManager() {
  const { language } = useLanguage();
  const [accounts, setAccounts] = useState<IncompleteAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchIncompleteAccounts = async () => {
    setLoading(true);
    try {
      // Get all auth users who don't have a members record
      // We need to use a function since we can't directly query auth.users
      // Using any to bypass TypeScript since the function was just created
      const { data, error } = await (supabase.rpc as any)('get_incomplete_accounts');
      
      if (error) {
        console.error('Error fetching incomplete accounts:', error);
        // If the function doesn't exist yet, show empty state
        setAccounts([]);
      } else {
        setAccounts((data as IncompleteAccount[]) || []);
      }
    } catch (error) {
      console.error('Fetch incomplete accounts error:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncompleteAccounts();
  }, []);

  const createMemberRecord = async (account: IncompleteAccount) => {
    setActionLoading(account.id);
    try {
      // Find the invite code to get the inviter's member_id
      let invitedBy = null;
      if (account.invite_code_used) {
        const { data: inviteData } = await supabase
          .from('invite_codes')
          .select('member_id')
          .eq('code', account.invite_code_used)
          .maybeSingle();
        invitedBy = inviteData?.member_id || null;
      }

      const { error } = await supabase
        .from('members')
        .insert({
          user_id: account.id,
          status: 'active',
          invited_by: invitedBy,
          invites_remaining: 3,
        });

      if (error) throw error;
      
      toast.success(language === 'nl' 
        ? 'Member record aangemaakt' 
        : 'Member record created');
      fetchIncompleteAccounts();
    } catch (error) {
      console.error('Create member error:', error);
      toast.error(language === 'nl' ? 'Fout bij aanmaken' : 'Error creating member');
    } finally {
      setActionLoading(null);
    }
  };

  const verifyEmail = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(language === 'nl' ? 'Email geverifieerd' : 'Email verified');
      fetchIncompleteAccounts();
    } catch (error) {
      console.error('Verify email error:', error);
      toast.error(language === 'nl' ? 'Fout bij verifiëren' : 'Error verifying email');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{language === 'nl' ? 'Geen incomplete accounts gevonden' : 'No incomplete accounts found'}</p>
        <p className="text-sm mt-2">
          {language === 'nl' 
            ? 'Alle gebruikers hebben een actief member record' 
            : 'All users have an active member record'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">
          {language === 'nl' ? 'Incomplete Accounts' : 'Incomplete Accounts'} ({accounts.length})
        </h3>
        <button
          onClick={fetchIncompleteAccounts}
          className="p-2 hover:bg-muted rounded transition-colors"
          title={language === 'nl' ? 'Vernieuwen' : 'Refresh'}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {language === 'nl' 
          ? 'Deze accounts hebben geen member record. Dit kan gebeuren als de signup niet volledig is afgerond.'
          : 'These accounts have no member record. This can happen if signup was not completed properly.'}
      </p>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">{language === 'nl' ? 'Naam' : 'Name'}</th>
              <th className="text-left px-4 py-3 font-medium">{language === 'nl' ? 'Email Status' : 'Email Status'}</th>
              <th className="text-left px-4 py-3 font-medium">{language === 'nl' ? 'Invite' : 'Invite'}</th>
              <th className="text-left px-4 py-3 font-medium">{language === 'nl' ? 'Aangemaakt' : 'Created'}</th>
              <th className="text-right px-4 py-3 font-medium">{language === 'nl' ? 'Acties' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs">{account.email}</span>
                </td>
                <td className="px-4 py-3">
                  {account.first_name || account.last_name 
                    ? `${account.first_name || ''} ${account.last_name || ''}`.trim()
                    : <span className="text-muted-foreground">-</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {account.email_verified ? (
                    <span className="text-green-600 text-xs">✓ Verified</span>
                  ) : (
                    <span className="text-amber-600 text-xs">⏳ Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {account.invite_code_used ? (
                    <div>
                      <span className="font-mono">{account.invite_code_used}</span>
                      {account.inviter_email && (
                        <span className="text-muted-foreground block">
                          via {account.inviter_email}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(account.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {!account.email_verified && (
                      <button
                        onClick={() => verifyEmail(account.id)}
                        disabled={actionLoading === account.id}
                        className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                        title={language === 'nl' ? 'Email verifiëren' : 'Verify email'}
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => createMemberRecord(account)}
                      disabled={actionLoading === account.id}
                      className="p-1.5 hover:bg-secondary hover:text-secondary-foreground rounded transition-colors disabled:opacity-50"
                      title={language === 'nl' ? 'Member maken' : 'Create member'}
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
