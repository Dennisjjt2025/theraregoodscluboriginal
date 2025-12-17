import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { 
  Wine, 
  Globe, 
  Award, 
  Users, 
  Lock, 
  Gift, 
  Clock, 
  Shield,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import logo from '@/assets/logo.png';

const content = {
  en: {
    title: 'Membership Benefits',
    subtitle: 'Join an exclusive collective of discerning enthusiasts',
    heroText: 'The Rare Goods Club is more than a store. It\'s a curated community where exceptional finds meet passionate collectors.',
    whyJoin: 'Why Join?',
    benefits: [
      {
        icon: Lock,
        title: 'Exclusive Access',
        description: 'Be the first to discover rare products before they\'re available to anyone else. Our drops are reserved for members only.'
      },
      {
        icon: Wine,
        title: 'Curated Selection',
        description: 'Every item is hand-picked by our team. We don\'t just sell products — we share discoveries worth savoring.'
      },
      {
        icon: Globe,
        title: 'Global Sourcing',
        description: 'From hidden vineyards to artisan workshops worldwide, we bring you treasures from around the globe.'
      },
      {
        icon: Award,
        title: 'Limited Editions',
        description: 'Access products in quantities so limited, they\'re often impossible to find elsewhere.'
      },
      {
        icon: Users,
        title: 'Community',
        description: 'Connect with fellow enthusiasts who share your appreciation for the rare and exceptional.'
      },
      {
        icon: Gift,
        title: 'Invite Friends',
        description: 'Share the experience. Members receive invite codes to bring others into the club.'
      }
    ],
    howItWorks: 'How It Works',
    steps: [
      {
        number: '01',
        title: 'Get Invited',
        description: 'Membership is by invitation only. Request access via the waitlist or receive an invite code from a current member.'
      },
      {
        number: '02',
        title: 'Join the Club',
        description: 'Create your account and become part of an exclusive community of collectors and enthusiasts.'
      },
      {
        number: '03',
        title: 'Discover Drops',
        description: 'Receive notifications when new drops launch. Each drop features a carefully curated rare find.'
      },
      {
        number: '04',
        title: 'Secure Your Allocation',
        description: 'Act fast when drops go live. Quantities are limited and first-come, first-served.'
      }
    ],
    whatMembersGet: 'What Members Get',
    memberPerks: [
      'Priority access to all drops',
      'Member-only pricing',
      'Detailed product stories and origins',
      'Personal invite codes to share',
      'Purchase history dashboard',
      'Early notifications for upcoming drops'
    ],
    faq: 'Frequently Asked',
    faqs: [
      {
        q: 'Is membership free?',
        a: 'Yes! Membership is completely free. You only pay for the products you purchase.'
      },
      {
        q: 'How do I get an invite code?',
        a: 'Invite codes are distributed by current members or occasionally through our waitlist. Join the waitlist to be considered.'
      },
      {
        q: 'What happens if I miss a drop?',
        a: 'No worries! New drops happen regularly. Just make sure to check your notifications so you don\'t miss out.'
      },
      {
        q: 'Can I cancel my membership?',
        a: 'Absolutely. You can leave the club at any time, though we\'ll be sad to see you go.'
      }
    ],
    ctaTitle: 'Ready to Join?',
    ctaSubtitle: 'Request access today and discover what makes us different.',
    ctaButton: 'Join Waitlist',
    ctaButtonMember: 'Go to Dashboard',
    alreadyMember: 'Already a member?',
    login: 'Login here'
  },
  nl: {
    title: 'Lidmaatschap Voordelen',
    subtitle: 'Word lid van een exclusief collectief van veeleisende liefhebbers',
    heroText: 'The Rare Goods Club is meer dan een winkel. Het is een gecureerde gemeenschap waar uitzonderlijke vondsten samenkomen met gepassioneerde verzamelaars.',
    whyJoin: 'Waarom Lid Worden?',
    benefits: [
      {
        icon: Lock,
        title: 'Exclusieve Toegang',
        description: 'Wees de eerste die zeldzame producten ontdekt voordat ze voor anderen beschikbaar zijn. Onze drops zijn alleen voor leden.'
      },
      {
        icon: Wine,
        title: 'Gecureerde Selectie',
        description: 'Elk item is zorgvuldig geselecteerd door ons team. We verkopen niet zomaar producten — we delen ontdekkingen die het waard zijn.'
      },
      {
        icon: Globe,
        title: 'Wereldwijde Sourcing',
        description: 'Van verborgen wijngaarden tot ambachtelijke werkplaatsen wereldwijd, we brengen je schatten van over de hele wereld.'
      },
      {
        icon: Award,
        title: 'Limited Editions',
        description: 'Toegang tot producten in zulke beperkte hoeveelheden dat ze elders vaak niet te vinden zijn.'
      },
      {
        icon: Users,
        title: 'Community',
        description: 'Verbind met mede-liefhebbers die jouw waardering voor het zeldzame en uitzonderlijke delen.'
      },
      {
        icon: Gift,
        title: 'Vrienden Uitnodigen',
        description: 'Deel de ervaring. Leden ontvangen uitnodigingscodes om anderen in de club te brengen.'
      }
    ],
    howItWorks: 'Hoe Het Werkt',
    steps: [
      {
        number: '01',
        title: 'Word Uitgenodigd',
        description: 'Lidmaatschap is alleen op uitnodiging. Vraag toegang aan via de wachtlijst of ontvang een code van een huidig lid.'
      },
      {
        number: '02',
        title: 'Word Lid',
        description: 'Maak je account aan en word onderdeel van een exclusieve gemeenschap van verzamelaars en liefhebbers.'
      },
      {
        number: '03',
        title: 'Ontdek Drops',
        description: 'Ontvang notificaties wanneer nieuwe drops lanceren. Elke drop bevat een zorgvuldig gecureerde zeldzame vondst.'
      },
      {
        number: '04',
        title: 'Claim Je Allocatie',
        description: 'Wees er snel bij als drops live gaan. Hoeveelheden zijn beperkt en op=op.'
      }
    ],
    whatMembersGet: 'Wat Leden Krijgen',
    memberPerks: [
      'Prioriteit toegang tot alle drops',
      'Exclusieve ledenprijzen',
      'Gedetailleerde productverhalen en herkomst',
      'Persoonlijke uitnodigingscodes om te delen',
      'Aankoopgeschiedenis dashboard',
      'Vroege notificaties voor aankomende drops'
    ],
    faq: 'Veelgestelde Vragen',
    faqs: [
      {
        q: 'Is lidmaatschap gratis?',
        a: 'Ja! Lidmaatschap is volledig gratis. Je betaalt alleen voor de producten die je koopt.'
      },
      {
        q: 'Hoe krijg ik een uitnodigingscode?',
        a: 'Uitnodigingscodes worden verdeeld door huidige leden of af en toe via onze wachtlijst. Meld je aan voor de wachtlijst.'
      },
      {
        q: 'Wat als ik een drop mis?',
        a: 'Geen zorgen! Er zijn regelmatig nieuwe drops. Zorg dat je je notificaties checkt zodat je niets mist.'
      },
      {
        q: 'Kan ik mijn lidmaatschap opzeggen?',
        a: 'Absoluut. Je kunt de club op elk moment verlaten, al vinden we het jammer om je te zien gaan.'
      }
    ],
    ctaTitle: 'Klaar om Lid te Worden?',
    ctaSubtitle: 'Vraag vandaag nog toegang aan en ontdek wat ons anders maakt.',
    ctaButton: 'Wachtlijst',
    ctaButtonMember: 'Naar Dashboard',
    alreadyMember: 'Al lid?',
    login: 'Log hier in'
  }
};

export default function Membership() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 paper-texture pointer-events-none" />
          
          <div className="container mx-auto max-w-4xl relative">
            <div className="mb-8 animate-fade-in">
              <img 
                src={logo} 
                alt="The Rare Goods Club" 
                className="w-20 h-20 md:w-24 md:h-24 mx-auto opacity-80"
              />
            </div>
            
            <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight mb-4 animate-slide-up">
              {t.title}
            </h1>
            
            <p className="font-sans text-lg md:text-xl text-accent max-w-2xl mx-auto mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {t.subtitle}
            </p>
            
            <p className="font-sans text-muted-foreground max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {t.heroText}
            </p>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 md:py-24 px-4 bg-card">
          <div className="container mx-auto max-w-6xl">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-16">
              {t.whyJoin}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {t.benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index} 
                    className="text-center md:text-left group"
                  >
                    <div className="w-14 h-14 mx-auto md:mx-0 mb-4 flex items-center justify-center border border-border bg-background group-hover:border-accent transition-colors duration-300">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-serif text-xl mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-16">
              {t.howItWorks}
            </h2>
            
            <div className="space-y-12">
              {t.steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex gap-6 md:gap-8 items-start"
                >
                  <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center border-2 border-accent bg-accent/5">
                    <span className="font-serif text-xl text-accent">{step.number}</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="font-serif text-xl mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Member Perks Checklist */}
        <section className="py-16 md:py-24 px-4 bg-card">
          <div className="container mx-auto max-w-2xl">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              {t.whatMembersGet}
            </h2>
            
            <div className="space-y-4">
              {t.memberPerks.map((perk, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-background border border-border"
                >
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="font-sans">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              {t.faq}
            </h2>
            
            <div className="space-y-6">
              {t.faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="border-b border-border pb-6"
                >
                  <h3 className="font-serif text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 bg-foreground text-background">
          <div className="container mx-auto max-w-2xl text-center">
            <Shield className="w-12 h-12 mx-auto mb-6 opacity-60" />
            
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              {t.ctaTitle}
            </h2>
            
            <p className="text-background/70 mb-8">
              {t.ctaSubtitle}
            </p>
            
            {user ? (
              <Link 
                to="/dashboard" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground font-sans text-sm uppercase tracking-widest hover:bg-background/90 transition-colors"
              >
                {t.ctaButtonMember}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="space-y-4">
                <Link 
                  to="/#waitlist" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground font-sans text-sm uppercase tracking-widest hover:bg-background/90 transition-colors"
                >
                  {t.ctaButton}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-background/60 text-sm">
                  {t.alreadyMember}{' '}
                  <Link to="/auth" className="underline hover:text-background">
                    {t.login}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="container mx-auto text-center">
            <p className="font-sans text-sm text-muted-foreground">
              © {new Date().getFullYear()} The Rare Goods Club. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
