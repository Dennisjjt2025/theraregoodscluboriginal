import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WaitlistForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email, name });

      if (error) {
        if (error.code === '23505') {
          toast.error('This email is already on the waitlist');
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success(t.landing.waitlistSuccess);
      }
    } catch (error) {
      console.error('Waitlist error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 border-2 border-secondary rounded-full">
          <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-xl">{t.landing.waitlistSuccess}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-6">
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
    </form>
  );
}
