import { useState } from 'react';
import { X, Send, Users, User, AlertTriangle, Heart, Wine, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmailComposerProps {
  onClose: () => void;
  preselectedEmail?: string;
  preselectedType?: 'strike_warning' | 'thank_you' | 'drop_update' | 'newsletter' | 'custom';
}

const EMAIL_TYPES = [
  { id: 'strike_warning', icon: AlertTriangle, label: 'Strike Warning', labelNl: 'Strike Waarschuwing', color: 'text-destructive' },
  { id: 'thank_you', icon: Heart, label: 'Thank You', labelNl: 'Bedankje', color: 'text-secondary' },
  { id: 'drop_update', icon: Wine, label: 'Drop Update', labelNl: 'Drop Update', color: 'text-primary' },
  { id: 'newsletter', icon: Newspaper, label: 'Newsletter', labelNl: 'Nieuwsbrief', color: 'text-accent' },
  { id: 'custom', icon: Send, label: 'Custom', labelNl: 'Aangepast', color: 'text-muted-foreground' },
] as const;

export function EmailComposer({ onClose, preselectedEmail, preselectedType }: EmailComposerProps) {
  const { t, language } = useLanguage();
  const [sendType, setSendType] = useState<'individual' | 'bulk'>(preselectedEmail ? 'individual' : 'bulk');
  const [emailType, setEmailType] = useState<typeof EMAIL_TYPES[number]['id']>(preselectedType || 'custom');
  const [recipients, setRecipients] = useState(preselectedEmail || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error(language === 'nl' ? 'Vul onderwerp en bericht in' : 'Please fill in subject and message');
      return;
    }

    if (sendType === 'individual' && !recipients.trim()) {
      toast.error(language === 'nl' ? 'Voer ontvangers in' : 'Please enter recipients');
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        type: sendType,
        subject,
        message,
        emailType,
      };

      if (sendType === 'individual') {
        payload.recipients = recipients.split(',').map(e => e.trim()).filter(Boolean);
      }

      const { data, error } = await supabase.functions.invoke('send-member-email', {
        body: payload,
      });

      if (error) throw error;

      if (data.success) {
        const successMsg = language === 'nl' 
          ? `${data.sent} email(s) verzonden${data.failed > 0 ? `, ${data.failed} mislukt` : ''}`
          : `${data.sent} email(s) sent${data.failed > 0 ? `, ${data.failed} failed` : ''}`;
        toast.success(successMsg);
        onClose();
      } else {
        throw new Error(data.error || 'Failed to send emails');
      }
    } catch (error: any) {
      console.error('Email send error:', error);
      toast.error(error.message || t.common.error);
    } finally {
      setSending(false);
    }
  };

  const getPlaceholderMessage = () => {
    switch (emailType) {
      case 'strike_warning':
        return language === 'nl' 
          ? 'Beste lid,\n\nWe hebben gemerkt dat je de laatste drop hebt gemist. Dit is je tweede strike.\n\nWe hopen je bij de volgende drop weer te zien.\n\nMet vriendelijke groet,\nThe Rare Goods Club'
          : 'Dear member,\n\nWe noticed you missed the latest drop. This is your second strike.\n\nWe hope to see you at the next drop.\n\nBest regards,\nThe Rare Goods Club';
      case 'thank_you':
        return language === 'nl'
          ? 'Beste lid,\n\nBedankt voor je aankoop bij de laatste drop! We waarderen je steun enorm.\n\nJe bestelling wordt zo snel mogelijk verzonden.\n\nMet vriendelijke groet,\nThe Rare Goods Club'
          : 'Dear member,\n\nThank you for your purchase at the latest drop! We truly appreciate your support.\n\nYour order will be shipped as soon as possible.\n\nBest regards,\nThe Rare Goods Club';
      case 'drop_update':
        return language === 'nl'
          ? 'Beste lid,\n\nEr komt een nieuwe drop aan! Houd je inbox in de gaten voor meer details.\n\nMet vriendelijke groet,\nThe Rare Goods Club'
          : 'Dear member,\n\nA new drop is coming! Keep an eye on your inbox for more details.\n\nBest regards,\nThe Rare Goods Club';
      case 'newsletter':
        return language === 'nl'
          ? 'Beste lid,\n\n[Nieuwsbrief inhoud hier]\n\nMet vriendelijke groet,\nThe Rare Goods Club'
          : 'Dear member,\n\n[Newsletter content here]\n\nBest regards,\nThe Rare Goods Club';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-serif text-xl">
              {language === 'nl' ? 'Email Componeren' : 'Compose Email'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'nl' ? 'Stuur berichten naar leden' : 'Send messages to members'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Send Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSendType('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border ${
                sendType === 'individual'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <User className="w-4 h-4" />
              {language === 'nl' ? 'Individueel' : 'Individual'}
            </button>
            <button
              onClick={() => setSendType('bulk')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border ${
                sendType === 'bulk'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <Users className="w-4 h-4" />
              {language === 'nl' ? 'Alle Leden' : 'All Members'}
            </button>
          </div>

          {/* Recipients (for individual) */}
          {sendType === 'individual' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'nl' ? 'Ontvangers' : 'Recipients'}
                <span className="text-muted-foreground font-normal ml-1">
                  ({language === 'nl' ? 'komma-gescheiden' : 'comma-separated'})
                </span>
              </label>
              <input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email@example.com, another@example.com"
                className="input-luxury w-full"
              />
            </div>
          )}

          {/* Email Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === 'nl' ? 'Email Type' : 'Email Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {EMAIL_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setEmailType(type.id);
                      if (!message) {
                        // Only set placeholder if message is empty
                      }
                    }}
                    className={`flex flex-col items-center gap-1 p-3 min-h-[60px] border ${
                      emailType === type.id
                        ? 'bg-muted border-primary'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${type.color}`} />
                    <span className="text-xs text-center">
                      {language === 'nl' ? type.labelNl : type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === 'nl' ? 'Onderwerp' : 'Subject'}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                language === 'nl' 
                  ? 'Bijv: Belangrijke update van The Rare Goods Club'
                  : 'E.g: Important update from The Rare Goods Club'
              }
              className="input-luxury w-full"
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                {language === 'nl' ? 'Bericht' : 'Message'}
              </label>
              {emailType !== 'custom' && !message && (
                <button
                  onClick={() => setMessage(getPlaceholderMessage())}
                  className="text-xs text-secondary hover:text-secondary/80"
                >
                  {language === 'nl' ? 'Gebruik template' : 'Use template'}
                </button>
              )}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getPlaceholderMessage()}
              rows={8}
              className="input-luxury w-full resize-none"
            />
          </div>

          {/* Preview Note */}
          <div className="bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-1">
              {language === 'nl' ? '📨 Email Preview' : '📨 Email Preview'}
            </p>
            <p>
              {language === 'nl' 
                ? 'De email wordt verzonden in TRGC huisstijl met logo header en stempel footer.'
                : 'Email will be sent in TRGC branding with logo header and stamp footer.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {sendType === 'bulk' 
              ? (language === 'nl' ? '⚠️ Dit stuurt naar ALLE actieve leden' : '⚠️ This will send to ALL active members')
              : recipients.split(',').filter(e => e.trim()).length > 0
                ? `${recipients.split(',').filter(e => e.trim()).length} ${language === 'nl' ? 'ontvanger(s)' : 'recipient(s)'}`
                : ''
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={onClose} className="btn-outline-luxury min-h-[44px]">
              {t.common.cancel}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !message.trim()}
              className="btn-luxury flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {sending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {language === 'nl' ? 'Verzenden...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {language === 'nl' ? 'Verstuur' : 'Send'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
