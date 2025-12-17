import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

const Unsubscribe = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Find the waitlist entry
      const { data: waitlistEntry, error: findError } = await supabase
        .from('waitlist')
        .select('id, name, email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (findError) throw findError;

      if (!waitlistEntry) {
        toast({
          title: language === 'nl' ? 'Niet gevonden' : 'Not found',
          description: language === 'nl' 
            ? 'Dit e-mailadres staat niet op onze wachtlijst.' 
            : 'This email address is not on our waitlist.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Delete from waitlist
      const { error: deleteError } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', waitlistEntry.id);

      if (deleteError) throw deleteError;

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-unsubscribe-confirmation', {
          body: {
            email: waitlistEntry.email,
            name: waitlistEntry.name,
            language,
          },
        });
      } catch (emailError) {
        console.error('Failed to send unsubscribe confirmation email:', emailError);
      }

      setIsSuccess(true);
      toast({
        title: language === 'nl' ? 'Uitgeschreven' : 'Unsubscribed',
        description: language === 'nl' 
          ? 'Je bent succesvol uitgeschreven van onze wachtlijst.' 
          : 'You have been successfully unsubscribed from our waitlist.',
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: language === 'nl' ? 'Fout' : 'Error',
        description: language === 'nl' 
          ? 'Er ging iets mis. Probeer het later opnieuw.' 
          : 'Something went wrong. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {language === 'nl' ? 'Uitschrijven' : 'Unsubscribe'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'nl' 
              ? 'Vul je e-mailadres in om je uit te schrijven van de wachtlijst.' 
              : 'Enter your email address to unsubscribe from the waitlist.'}
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
            <p className="text-foreground">
              {language === 'nl' 
                ? 'Je bent succesvol uitgeschreven. Je ontvangt een bevestigingsmail.' 
                : 'You have been successfully unsubscribed. You will receive a confirmation email.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'nl' ? 'Je e-mailadres' : 'Your email address'}
              required
              className="bg-background border-border"
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading 
                ? (language === 'nl' ? 'Bezig...' : 'Processing...') 
                : (language === 'nl' ? 'Uitschrijven' : 'Unsubscribe')}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
};

export default Unsubscribe;
