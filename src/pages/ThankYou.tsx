import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/stores/cartStore';
import { Header } from '@/components/Header';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function ThankYou() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  
  // Clear cart when this page loads
  useEffect(() => {
    clearCart();
    // Remove checkout started flag
    localStorage.removeItem('checkout_started');
  }, [clearCart]);

  const t = {
    title: language === 'nl' ? 'Bedankt voor je bestelling!' : 'Thank you for your order!',
    subtitle: language === 'nl' 
      ? 'Je ontvangt een bevestiging per email.' 
      : 'You will receive a confirmation email shortly.',
    orderInfo: language === 'nl'
      ? 'Je bestelling wordt verwerkt en je ontvangt trackinggegevens zodra deze beschikbaar zijn.'
      : 'Your order is being processed and you will receive tracking information once available.',
    viewOrders: language === 'nl' ? 'Bekijk je bestellingen' : 'View your orders',
    continueShopping: language === 'nl' ? 'Terug naar de drop' : 'Back to the drop',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 px-4 pb-16">
        <div className="max-w-md mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="font-serif text-3xl mb-4">{t.title}</h1>
          <p className="text-lg text-muted-foreground mb-4">{t.subtitle}</p>
          <p className="text-sm text-muted-foreground mb-8">{t.orderInfo}</p>
          
          <div className="flex flex-col gap-3">
            <Link 
              to="/dashboard" 
              className="btn-luxury inline-flex items-center justify-center gap-2"
            >
              {t.viewOrders}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/drop" 
              className="btn-outline-luxury inline-flex items-center justify-center"
            >
              {t.continueShopping}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
