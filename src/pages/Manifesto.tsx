import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

// Ornamental divider component
const OrnamentalDivider = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-4 ${className}`}>
    <div className="w-12 h-px bg-accent/40" />
    <svg width="24" height="24" viewBox="0 0 24 24" className="text-accent/60">
      <path 
        fill="currentColor" 
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
      />
    </svg>
    <div className="w-12 h-px bg-accent/40" />
  </div>
);

// Wax seal component
const WaxSeal = ({ className = '' }: { className?: string }) => (
  <div className={`relative group cursor-pointer ${className}`}>
    <svg 
      width="100" 
      height="100" 
      viewBox="0 0 100 100" 
      className="drop-shadow-lg transition-transform duration-500 ease-out group-hover:scale-105 group-hover:rotate-[8deg]"
    >
      {/* Wax seal base with irregular edges */}
      <defs>
        <radialGradient id="sealGradient" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="hsl(var(--burgundy))" stopOpacity="1" />
          <stop offset="50%" stopColor="hsl(var(--burgundy))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--burgundy))" stopOpacity="0.7" />
        </radialGradient>
        <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Irregular wax seal shape */}
      <path 
        d="M50 5 
           Q65 8, 72 15 
           Q82 18, 88 28 
           Q95 40, 93 50 
           Q95 62, 88 72 
           Q82 82, 72 85 
           Q62 92, 50 95 
           Q38 92, 28 85 
           Q18 82, 12 72 
           Q5 62, 7 50 
           Q5 40, 12 28 
           Q18 18, 28 15 
           Q35 8, 50 5Z"
        fill="url(#sealGradient)"
        filter="url(#sealShadow)"
      />
      
      {/* Inner circle border */}
      <circle 
        cx="50" 
        cy="50" 
        r="30" 
        fill="none" 
        stroke="hsl(var(--gold))" 
        strokeWidth="1.5"
        opacity="0.6"
      />
      
      {/* Decorative inner ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="25" 
        fill="none" 
        stroke="hsl(var(--gold))" 
        strokeWidth="0.5"
        opacity="0.4"
        strokeDasharray="2 2"
      />
      
      {/* Central monogram - TRG stylized */}
      <text 
        x="50" 
        y="48" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fill="hsl(var(--gold))"
        fontSize="14"
        fontFamily="Cormorant Garamond, serif"
        fontWeight="600"
        letterSpacing="1"
      >
        TRG
      </text>
      
      {/* Small decorative star below */}
      <path 
        d="M50 60 L51.5 63.5 L55 64 L52.5 66.5 L53 70 L50 68 L47 70 L47.5 66.5 L45 64 L48.5 63.5 Z"
        fill="hsl(var(--gold))"
        opacity="0.7"
      />
      
      {/* Circular text - RARE GOODS CLUB */}
      <path 
        id="topArc"
        d="M 20 50 A 30 30 0 0 1 80 50"
        fill="none"
      />
      <text fontSize="5.5" fill="hsl(var(--gold))" opacity="0.5" letterSpacing="3">
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">
          RARE GOODS
        </textPath>
      </text>
      
      <path 
        id="bottomArc"
        d="M 80 50 A 30 30 0 0 1 20 50"
        fill="none"
      />
      <text fontSize="5.5" fill="hsl(var(--gold))" opacity="0.5" letterSpacing="3">
        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
          • CLUB •
        </textPath>
      </text>
    </svg>
  </div>
);

export default function Manifesto() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Our Story',
      intro: '"Not everything needs to be always available. And that\'s okay."',
      paragraph1: 'Some things only exist in small batches. Because that\'s how they\'re made. Or because we only just managed to get our hands on them.',
      paragraph2: 'We don\'t collect products. We collect moments when something feels worth sharing.',
      paragraph3: 'What you\'ll find here wasn\'t designed for everyone. It\'s what showed up — and what we\'re passing along.',
      emphasis1: 'Not to make it exclusive. But to keep it personal.',
      purpose: 'To open. To enjoy. To share.',
      emphasis2: 'When it\'s gone, it\'s not lost. It just was.',
      closing: '"This isn\'t a shop that\'s always open. It\'s a group of friends who occasionally put something special on the table."',
      cta: 'Begin Your Journey',
    },
    nl: {
      title: 'Ons Verhaal',
      intro: '"Niet alles hoeft altijd beschikbaar te zijn. En dat is prima."',
      paragraph1: 'Sommige dingen bestaan alleen in kleine oplages. Omdat ze zo gemaakt worden. Of omdat we er nog net de hand op konden leggen.',
      paragraph2: 'Wij verzamelen geen producten. Wij verzamelen momenten waarop iets het waard voelt om te delen.',
      paragraph3: 'Wat je hier vindt, is niet ontworpen voor iedereen. Het is wat zich aandiende — en wat wij doorgeven.',
      emphasis1: 'Niet om het exclusief te maken. Maar om het persoonlijk te houden.',
      purpose: 'Om te openen. Om van te genieten. Om te delen.',
      emphasis2: 'Als iets op is, is het niet weg. Het is gewoon geweest.',
      closing: '"Dit is geen winkel die altijd open is. Dit is een groep vrienden die af en toe iets bijzonders op tafel legt."',
      cta: 'Begin Je Reis',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background paper-texture">
      <Header />
      
      <main className="pt-24 pb-24 px-4">
        <article className="container mx-auto max-w-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-16 animate-fade-in">
            <img 
              src={logo} 
              alt="The Rare Goods Club" 
              className="w-20 h-20 opacity-70"
            />
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl text-center mb-16 text-foreground animate-slide-up">
            {t.title}
          </h1>

          {/* Intro Quote */}
          <blockquote 
            className="font-serif text-xl md:text-2xl text-center italic text-accent mb-20 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t.intro}
          </blockquote>

          {/* Ornamental divider */}
          <OrnamentalDivider className="mb-16 animate-fade-in" />

          {/* Main paragraphs */}
          <div 
            className="space-y-8 text-lg md:text-xl leading-relaxed text-foreground/85 mb-16 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <p>{t.paragraph1}</p>
            <p>{t.paragraph2}</p>
            <p>{t.paragraph3}</p>
          </div>

          {/* Ornamental divider */}
          <OrnamentalDivider className="mb-16 animate-fade-in" />

          {/* Emphasis section */}
          <div 
            className="text-center space-y-8 mb-16 animate-slide-up"
            style={{ animationDelay: '0.5s' }}
          >
            <p className="font-serif text-xl md:text-2xl italic text-gold">
              {t.emphasis1}
            </p>
            
            <p className="font-sans text-base tracking-[0.2em] uppercase text-muted-foreground">
              {t.purpose}
            </p>
            
            <p className="font-serif text-xl md:text-2xl italic text-burgundy">
              {t.emphasis2}
            </p>
          </div>

          {/* Ornamental divider */}
          <OrnamentalDivider className="mb-16 animate-fade-in" />

          {/* Closing Quote */}
          <blockquote 
            className="font-serif text-lg md:text-xl text-center italic text-muted-foreground mb-16 animate-slide-up"
            style={{ animationDelay: '0.7s' }}
          >
            {t.closing}
          </blockquote>

          {/* Wax Seal */}
          <div 
            className="flex justify-center mb-12 animate-fade-in"
            style={{ animationDelay: '0.85s' }}
          >
            <WaxSeal className="opacity-90 hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* CTA */}
          <div 
            className="flex justify-center mt-8 animate-fade-in"
            style={{ animationDelay: '0.95s' }}
          >
            <Link 
              to="/"
              className="group inline-flex items-center gap-3 font-serif text-lg text-accent hover:text-gold transition-colors duration-300"
            >
              <span className="w-8 h-px bg-accent/40 group-hover:w-12 group-hover:bg-gold/60 transition-all duration-300" />
              <span>{t.cta}</span>
              <span className="w-8 h-px bg-accent/40 group-hover:w-12 group-hover:bg-gold/60 transition-all duration-300" />
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto text-center">
          <p className="font-sans text-sm text-muted-foreground/70">
            © {new Date().getFullYear()} The Rare Goods Club
          </p>
        </div>
      </footer>
    </div>
  );
}