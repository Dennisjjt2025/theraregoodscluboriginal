import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import logo from '@/assets/logo.png';

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
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-24 px-4">
        <article className="container mx-auto max-w-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-16 animate-fade-in">
            <img 
              src={logo} 
              alt="The Rare Goods Club" 
              className="w-24 h-24 opacity-80"
            />
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl text-center mb-16 animate-slide-up">
            {t.title}
          </h1>

          {/* Intro Quote */}
          <blockquote 
            className="font-serif text-xl md:text-2xl text-center italic text-muted-foreground mb-20 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t.intro}
          </blockquote>

          {/* Decorative line */}
          <div className="flex justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-px bg-border" />
          </div>

          {/* Main paragraphs */}
          <div 
            className="space-y-8 text-lg md:text-xl leading-relaxed text-foreground/90 mb-16 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <p>{t.paragraph1}</p>
            <p>{t.paragraph2}</p>
            <p>{t.paragraph3}</p>
          </div>

          {/* Decorative line */}
          <div className="flex justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="w-16 h-px bg-border" />
          </div>

          {/* Emphasis section */}
          <div 
            className="text-center space-y-8 mb-16 animate-slide-up"
            style={{ animationDelay: '0.5s' }}
          >
            <p className="font-serif text-xl md:text-2xl italic text-accent">
              {t.emphasis1}
            </p>
            
            <p className="font-sans text-lg tracking-wide uppercase text-muted-foreground">
              {t.purpose}
            </p>
            
            <p className="font-serif text-xl md:text-2xl italic text-secondary">
              {t.emphasis2}
            </p>
          </div>

          {/* Decorative line */}
          <div className="flex justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="w-16 h-px bg-border" />
          </div>

          {/* Closing Quote */}
          <blockquote 
            className="font-serif text-lg md:text-xl text-center italic text-muted-foreground animate-slide-up"
            style={{ animationDelay: '0.7s' }}
          >
            {t.closing}
          </blockquote>

          {/* Final decorative element */}
          <div 
            className="flex justify-center mt-20 animate-fade-in"
            style={{ animationDelay: '0.8s' }}
          >
            <div className="w-2 h-2 bg-accent rotate-45" />
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <p className="font-sans text-sm text-muted-foreground">
            © {new Date().getFullYear()} The Rare Goods Club
          </p>
        </div>
      </footer>
    </div>
  );
}
