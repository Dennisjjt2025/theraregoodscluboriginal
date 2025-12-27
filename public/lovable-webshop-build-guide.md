# 🏗️ Complete Lovable Webshop Build Guide

## Members-Only Exclusive Drops Webshop - 35 Stappen

> **Auteur:** Lovable AI Webshop Specialist  
> **Versie:** 1.0  
> **Laatste update:** December 2024

---

## 📋 Overzicht Bouwvolgorde

| Fase | Focus | Prompts |
|------|-------|---------|
| 1 | Basis Setup & Branding | 1-3 |
| 2 | Database & Auth Systeem | 4-7 |
| 3 | Publieke Pagina's | 8-11 |
| 4 | Member Dashboard | 12-15 |
| 5 | Admin Panel | 16-20 |
| 6 | Drop Systeem | 21-24 |
| 7 | Cart & Checkout | 25-27 |
| 8 | Integraties (Shopify/Resend) | 28-32 |
| 9 | Finetuning & Polish | 33-35 |

---

## 🎯 FASE 1: BASIS SETUP & BRANDING

### Prompt 1: Project Initialisatie & Branding

```
Bouw een exclusieve members-only webshop genaamd "The Rare Goods Club" voor zeldzame, gelimiteerde producten (wijn, kunst, delicatessen, etc.).

Design systeem:
- Serif font voor headings: Cormorant Garamond
- Sans-serif voor body: Plus Jakarta Sans  
- Light mode: Warm off-white paper texture (#F7F5F0), charcoal black ink (#1F1F1F)
- Dark mode: Ink black (#141414), cream white (#EDE8E0)
- Accent kleuren: Burgundy (#8B3A3A), Forest Green (#2D4A3E), Gold (#D4A84B)
- Brutalist minimalistisch luxury design

Maak een CSS design system met:
- Custom CSS variabelen in HSL format
- .btn-luxury en .btn-outline-luxury button classes
- .input-luxury voor inputs
- .paper-texture overlay effect
- Animaties: fadeIn, slideUp, pulse-slow

Voeg de Google Fonts import toe in index.css.
Maak een basis App.tsx met routing setup.
```

---

### Prompt 2: Tweetalige Ondersteuning (EN/NL)

```
Implementeer een volledig tweetalig systeem (Engels en Nederlands):

1. Maak src/contexts/LanguageContext.tsx:
   - Context met language state ('en' | 'nl')
   - Persist taal in localStorage
   - useLanguage hook

2. Maak src/lib/translations.ts met vertalingen voor:
   - Navigation (home, dashboard, login, logout)
   - Landing page teksten
   - Auth flow teksten
   - Dashboard labels
   - Drop page content
   - Admin panel labels
   - Common (loading, error, save, cancel, etc.)

3. Maak een LanguageToggle component (EN | NL toggle button)

4. Wrap de app in LanguageProvider
```

---

### Prompt 3: Header & Navigation

```
Maak een responsive Header component:

Desktop:
- Logo links (klikbaar naar home)
- Navigation rechts: Home, Drops, Membership, Dashboard (als ingelogd), Admin (als admin)
- Language toggle
- Theme toggle (dark/light mode)
- Cart icon met badge (aantal items)
- Login/Logout button

Mobile:
- Logo links
- Hamburger menu rechts
- Sheet/drawer met alle navigatie
- Cart icon altijd zichtbaar

Features:
- Transparante header die solid wordt bij scrollen
- Actieve nav link highlighting
- Conditionale items gebaseerd op auth state

Gebruik de shadcn Sheet component voor mobile menu.
```

---

## 🎯 FASE 2: DATABASE & AUTH SYSTEEM

### Prompt 4: Database Schema - Profielen & Members

```
Enable Lovable Cloud en maak de volgende database tabellen:

1. profiles (extends auth.users):
   - id (uuid, references auth.users)
   - email, first_name, last_name
   - phone, street_address, house_number, postal_code, city, country
   - preferences (text array)
   - email_verified (boolean, default false)
   - has_seen_tour (boolean, default false)
   - verification_token, verification_token_expires_at
   - created_at, updated_at

2. members:
   - id, user_id (references auth.users)
   - status (enum: active, suspended, pending)
   - strike_count (integer, default 0)
   - invites_remaining (integer, default 3)
   - invited_by (uuid, nullable, references members)
   - notes (text)
   - created_at, updated_at

3. user_roles:
   - id, user_id, role (enum: admin, member)
   
   BELANGRIJK: Maak een has_role() security definer functie om RLS recursie te voorkomen.

4. waitlist:
   - id, email (unique), name, status (pending/approved/rejected)
   - created_at, updated_at

5. invite_codes:
   - id, code (unique), member_id
   - used_by, used_at, expires_at (default 30 days)
   - created_at

RLS Policies:
- Users can read/update own profile
- Members can read own member data
- Admins can read/update all (gebruik has_role functie)
- Anyone can insert to waitlist
```

---

### Prompt 5: Database Schema - Drops

```
Maak de drops-gerelateerde database tabellen:

1. drops:
   - id (uuid)
   - title_en, title_nl (text, required)
   - description_en, description_nl (text)
   - story_en, story_nl (text - het verhaal achter het product)
   - tasting_notes_en, tasting_notes_nl (text - details/specificaties)
   - origin, vintage (text)
   - price (numeric), quantity_available (integer), quantity_sold (integer, default 0)
   - image_url, video_url (text)
   - shopify_product_id (text)
   - starts_at (timestamp), ends_at (timestamp, nullable)
   - is_active (boolean), is_public (boolean), is_draft (boolean)
   - created_at, updated_at

2. drop_images (gallery):
   - id, drop_id (foreign key)
   - image_url, alt_text, sort_order
   - created_at

3. drop_participation:
   - id, drop_id, member_id
   - purchased (boolean), quantity (integer)
   - shopify_order_id (text)
   - created_at

4. drop_interests (voor upcoming drops):
   - id, drop_id, user_id, member_id
   - email, notified_at
   - created_at

5. preference_categories:
   - id, key, label_en, label_nl
   - is_active, sort_order
   - created_at

RLS: Admins manage all, members see active drops, public sees public drops.

Voeg toe aan migration:
ALTER PUBLICATION supabase_realtime ADD TABLE public.drops;
```

---

### Prompt 6: Auth Context & Protected Routes

```
Maak het authenticatie systeem:

1. src/contexts/AuthContext.tsx:
   - AuthProvider met user, session, loading state
   - Supabase auth state listener (onAuthStateChange)
   - signOut functie
   - useAuth hook

2. Maak database functie is_member(user_id) die checkt of user actief lid is

3. Update App.tsx:
   - Wrap app in AuthProvider
   - Lazy load alle pagina's behalve Index
   - Suspense met loading spinner

4. Maak PageLoader component voor loading states met animatie
```

---

### Prompt 7: Complete Auth Flow met Email Verificatie

```
Bouw de volledige authenticatie pagina (src/pages/Auth.tsx):

Stappen/views:
1. Choose: "Ik ben lid" of "Ik heb nog geen toegang"
2. Login: Email + password
3. Request Access: 
   - "Ik heb een invite code" -> validate & signup
   - "Join waitlist" -> waitlist form
4. Signup: Na invite validatie - email, password, voornaam, achternaam
5. Verify Pending: Wacht op email verificatie
6. Verified: Succes, login button

Logica:
- Invite code validatie tegen invite_codes tabel (check unused & not expired)
- Bij signup: maak profile via database trigger
- Check email_verified bij login, redirect naar verify-pending als false
- Redirect naar dashboard na succesvolle login

Database trigger voor nieuwe users:
- Automatisch profile record aanmaken
- first_name en last_name uit user metadata halen

BELANGRIJK: Gebruik GEEN anonymous signups, altijd echte email verificatie.
Enable auto-confirm email in Supabase auth settings voor development.
```

---

## 🎯 FASE 3: PUBLIEKE PAGINA'S

### Prompt 8: Landing Page (Index)

```
Bouw de landing page (src/pages/Index.tsx):

Hero Section:
- Logo gecentreerd (animatie fade-in)
- Titel: "The Rare Goods Club" 
- Subtitel: "An invitation-only collective for the discerning few"
- Countdown timer naar volgende drop (component maken)
- CTAs: "Member Login" en "Join Waitlist" (of "Go to Dashboard" als ingelogd)
- Als drop live: toon "View Current Drop" button
- Als upcoming drop: toon "Sneak Peek" button met countdown
- ScrollIndicator component onderaan (animated arrow)

Features Section:
- 3 kolommen met icons: Exclusive Access, Curated Drops, Limited Editions
- Icons uit lucide-react (Lock, Gem, Package)

Waitlist Section:
- Anchor link #waitlist
- WaitlistForm component (naam + email)
- Succes toast bij submit
- Opslaan in waitlist tabel

Footer:
- Copyright text
- Links naar Manifesto, Membership

Fetch active/upcoming drops uit database voor countdown logic.
```

---

### Prompt 9: Countdown Timer Component

```
Maak een CountdownTimer component (src/components/CountdownTimer.tsx):

Props:
- targetDate: Date
- isLive?: boolean (voor styling verschil)
- onComplete?: () => void

Functionaliteit:
- Bereken days, hours, minutes, seconds tot targetDate
- Update elke seconde met useEffect + setInterval
- Toon "Live Now!" als countdown voorbij is
- Call onComplete callback wanneer timer eindigt

Design:
- Grote nummers in serif font
- Labels (DAYS, HRS, MIN, SEC) in uppercase sans-serif klein
- Grid layout met 4 blokken gescheiden door colons
- Subtiele animatie bij nummer verandering (scale pulse)
- Andere styling voor isLive (glow effect)

Cleanup interval bij unmount.
```

---

### Prompt 10: Membership Info Page

```
Maak src/pages/Membership.tsx - een informatieve pagina over het lidmaatschap:

Secties:

1. Hero: 
   - Titel "Membership Benefits"
   - Subtitel over exclusiviteit
   - Korte intro paragraph

2. Why Join (6 benefits in 2x3 grid):
   - Exclusive Access - icon: Lock
   - Curated Selection - icon: Gem
   - Global Sourcing - icon: Globe
   - Limited Editions - icon: Package
   - Community - icon: Users
   - Invite Friends - icon: UserPlus
   Elk met icon, titel, beschrijving (2-3 zinnen)

3. How It Works (4 stappen horizontaal):
   01. Get Invited - beschrijving
   02. Join the Club - beschrijving
   03. Discover Drops - beschrijving
   04. Secure Your Allocation - beschrijving
   Genummerd met grote nummers, subtiele lijn ertussen

4. What Members Get (checklist met checkmarks):
   - Priority access to all drops
   - Member-only pricing
   - Detailed product stories
   - Personal invite codes (3 per member)
   - Purchase history dashboard
   - Early notifications for upcoming drops

5. FAQ sectie met 4 vragen/antwoorden (Accordion component)

6. CTA sectie: 
   - "Ready to Join?" 
   - "Join our waitlist or ask a member for an invite"
   - Waitlist button

Alle content in EN en NL via translations.
```

---

### Prompt 11: Manifesto Page

```
Maak src/pages/Manifesto.tsx - het verhaal van The Rare Goods Club:

Layout:
- Full-width design met veel whitespace
- Alternerende secties

Content secties:

1. Hero statement (full width, grote tekst):
   "We believe extraordinary things deserve extraordinary care."

2. Why We Exist:
   - Tekst over de missie
   - In een wereld van massaproductie zoeken we het zeldzame

3. Our Philosophy:
   - Kwaliteit boven kwantiteit
   - Het verhaal achter elk product
   - Pull quote in grote serif: "Every item has a story worth telling."

4. How We Select:
   - Ons curatie proces
   - Directe relaties met makers
   - Beperkte oplages

5. The Community:
   - Invite-only model uitleg
   - Waarom we exclusief blijven
   - De waarde van gedeelde appreciatie

Design elementen:
- Pull quotes in grote serif font met subtiele border
- Afwisselend tekst links/rechts met veel padding
- Subtiele fade-in animaties bij scrollen
- Minimalistisch, focus op typografie

Voeg "Manifesto" link toe in footer en navigation.
```

---

## 🎯 FASE 4: MEMBER DASHBOARD

### Prompt 12: Dashboard Basis Structure

```
Maak src/pages/Dashboard.tsx met tabs:

Toegangscontrole:
- Check of user ingelogd is (redirect naar /auth als niet)
- Check of user member is (toon "pending membership" message als niet)
- Check email_verified (toon verificatie reminder als false)

Tabs (gebruik shadcn Tabs component):
1. Drops - huidige en upcoming drops
2. Orders - aankoopgeschiedenis
3. Profile - persoonlijke gegevens
4. Invites - invite codes beheren

Layout:
- Welkom message met voornaam
- Tab navigation
- Responsive: tabs horizontaal op desktop, stacked op mobile

Tab content als aparte components:
- DropsTab
- OrdersList
- ProfileForm (later)
- InvitesManager (later)
```

---

### Prompt 13: Dashboard Drops & Orders Components

```
Maak de dashboard sub-components:

1. DropsTab (src/components/dashboard/DropsTab.tsx):
   - Fetch active drops (is_active = true, is_draft = false)
   - Fetch upcoming drops (starts_at > now, is_draft = false)
   - Per drop card tonen:
     - Afbeelding thumbnail
     - Titel
     - Prijs
     - Stock indicator (progress bar)
     - Countdown als upcoming
     - "View Drop" button
   - Empty state als geen drops

2. OrdersList (src/components/dashboard/OrdersList.tsx):
   - Fetch drop_participation waar purchased = true
   - Join met drops tabel voor details
   - Toon per order:
     - Drop afbeelding
     - Titel
     - Prijs en quantity
     - Datum
     - Shopify order ID (als beschikbaar)
   - Empty state: "No orders yet"

3. StockIndicator component (src/components/drop/StockIndicator.tsx):
   - Props: available, sold
   - Progress bar met percentage
   - Kleur: groen -> oranje -> rood gebaseerd op %
   - "Almost sold out!" badge bij >80% verkocht
   - "X remaining" tekst
```

---

### Prompt 14: Onboarding Tour

```
Maak een onboarding tour voor nieuwe leden:

Installeer react-joyride package.

1. OnboardingTour component (src/components/dashboard/OnboardingTour.tsx):
   Props:
   - run: boolean
   - onComplete: () => void

   Stappen:
   1. Welcome: "Welcome to The Rare Goods Club! Let's show you around."
   2. Drops tab: "Here you'll find current and upcoming drops."
   3. Orders tab: "Track all your purchases here."
   4. Profile tab: "Complete your profile with shipping address for faster checkout."
   5. Invites tab: "Share the love! You have 3 invite codes."
   6. (Als admin role) Admin button: "As an admin, you can manage the shop here."

   Styling:
   - Custom tooltip matching design system
   - Spotlight effect op target elements
   - Skip en Next buttons

2. In Dashboard:
   - Check has_seen_tour in profile
   - Start tour als false
   - Update has_seen_tour naar true bij complete

3. TourButton component:
   - Kleine "?" of "Take Tour" button
   - Herstart de tour
```

---

### Prompt 15: Profile Form & Invites Manager

```
Bouw de Profile en Invites tabs:

1. ProfileForm in Dashboard:
   - Form fields:
     - Voornaam, Achternaam
     - Email (readonly)
     - Telefoon
     - Straatnaam, Huisnummer
     - Postcode, Stad
     - Land (dropdown met NL, BE, DE, etc.)
   - Preferences sectie:
     - Fetch preference_categories (is_active = true, order by sort_order)
     - Checkbox grid
     - Opslaan als array in profile.preferences
   - Save button met loading state
   - Success toast bij opslaan

2. InvitesManager:
   - Toon invites_remaining count
   - "Generate Invite Code" button (disabled als 0 remaining)
   - Bij generate:
     - Maak random 8-char code
     - Insert in invite_codes met member_id
     - Decrement invites_remaining
   - Lijst van eigen invite codes:
     - Code
     - Status badge: Active (groen), Used (grijs), Expired (rood)
     - Used by email (als used)
     - Created date
     - Copy link button (kopieert full URL met code)
     - Share button (native share API)
     - Delete button (alleen voor unused codes)
```

---

## 🎯 FASE 5: ADMIN PANEL

### Prompt 16: Admin Page Basis

```
Maak src/pages/Admin.tsx met tabs:

Toegangscontrole:
- Check of user ingelogd is
- Check of user admin role heeft via has_role functie
- Redirect naar home als niet admin

Layout:
- "Admin Panel" titel
- Tabs navigatie

Tabs:
1. Drops - beheer drops
2. Members - beheer leden  
3. Waitlist - beheer wachtlijst
4. Settings - site instellingen

Maak placeholder content voor elke tab, we vullen ze in volgende prompts.

Mobile:
- Tabs als scrollable horizontal list
- Of dropdown selector
```

---

### Prompt 17: Drop Editor Component

```
Maak het drop beheer systeem:

1. Admin Drops Tab:
   - "Create New Drop" button
   - Lijst van alle drops (actief, draft, afgelopen)
   - Per drop: titel, status badges, edit/duplicate/delete actions

2. DropEditor component (src/components/admin/DropEditor.tsx):
   - Modal/dialog form
   - Props: mode ('create' | 'edit' | 'duplicate'), drop data, onClose, onSave

3. DropEditorForm (src/components/admin/DropEditorForm.tsx):
   Tabs binnen het formulier:
   
   Content tab:
   - Title EN (required) + Title NL (required)
   - Description EN + Description NL (textarea)
   - Story EN + Story NL (larger textarea)
   - Details/Tasting Notes EN + Details NL (textarea)
   - Origin (text input)
   - Vintage (text input)
   
   Media tab:
   - Main image URL (text input, later file upload)
   - Video URL (optional)
   - Gallery images (later)
   
   Settings tab:
   - Price (number input)
   - Quantity Available (number input)
   - Start Date/Time (datetime picker)
   - End Date/Time (optional datetime picker)
   - Toggles: Is Active, Is Public, Is Draft
   - Shopify Product ID (text, voor later)

4. DropEditorPreview (src/components/admin/DropEditorPreview.tsx):
   - Live preview naast form op desktop
   - Toggle preview op mobile
   - Toont hoe de drop eruit zal zien
```

---

### Prompt 18: Member Management

```
Bouw het leden beheer systeem in Admin:

1. Members Tab content:
   - Zoekbalk (email/naam)
   - Filter dropdown: All, Active, Suspended, Pending
   - Tabel met kolommen:
     - Email
     - Naam
     - Status (badge)
     - Strikes
     - Invites Remaining
     - Member Since
     - Actions (eye icon voor details)

2. MemberDetailModal (src/components/admin/MemberDetailModal.tsx):
   - Alle member info
   - Profile details (naam, email, adres, telefoon)
   - Preferences lijst
   
   Actions sectie:
   - Strike management:
     - Current strike count
     - Add Strike button
     - Remove Strike button
     - Reset Strikes button
   - Status wijzigen:
     - Activate button (als suspended)
     - Suspend button (als active)
   - Invites:
     - Current count
     - Add Invites input + button
   - Notes:
     - Textarea voor admin notes
     - Save notes button
   
   Participation History:
   - Lijst van drop_participation voor deze member
   - Drop titel, purchased status, datum
```

---

### Prompt 19: Waitlist Management

```
Bouw de waitlist beheer in Admin:

1. Waitlist Tab content:
   - Stats bovenaan: Total, Pending, Approved, Rejected
   - Filter buttons: All, Pending, Approved, Rejected
   - Zoekbalk
   - Tabel:
     - Name
     - Email
     - Status (badge)
     - Submitted (datum)
     - Actions

2. Per waitlist entry actions:
   - Approve button:
     - Genereer invite code
     - Update status naar 'approved'
     - Later: stuur email met invite
   - Reject button:
     - Update status naar 'rejected'
   - Delete button (met confirm)

3. Bulk actions:
   - Select all checkbox
   - Bulk approve selected
   - Export to CSV button

4. Success/error toasts bij alle acties
```

---

### Prompt 20: Site Settings & Reports

```
1. Settings Tab in Admin:
   
   SiteSettingsEditor component (src/components/admin/SiteSettingsEditor.tsx):
   - Fetch site_settings tabel
   - Key-value editor
   - Per setting:
     - Key (readonly)
     - Value EN (textarea)
     - Value NL (textarea)
     - Save button per row
   
   Voorgedefinieerde settings (insert als niet bestaat):
   - announcement_banner (text voor bovenaan site)
   - maintenance_mode (true/false)
   - welcome_email_subject
   - welcome_email_message

   Add new setting form onderaan

2. PreferenceCategoriesManager (src/components/admin/PreferenceCategoriesManager.tsx):
   - CRUD voor preference_categories
   - Drag & drop reorderen
   - Toggle active/inactive
   - Edit labels EN/NL

3. Reports sectie (kan in eigen tab of onder Settings):
   - Dropdown: selecteer een drop
   - Toon rapport voor geselecteerde drop:
     - Fetch via get_drop_participation_report functie
     - Tabel: member email, status, purchased, interested, strikes
     - Export to CSV button
```

---

## 🎯 FASE 6: DROP SYSTEEM

### Prompt 21: Drop Detail Page

```
Maak src/pages/Drop.tsx:

Route: /drop/:id

Fetch drop data op basis van ID parameter.

Layout (twee kolommen op desktop):

Linker kolom - Media:
- Hero image (main image_url)
- Gallery thumbnails eronder (uit drop_images)
- Click om te vergroten (lightbox)
- Video player als video_url bestaat

Rechter kolom - Product Info:
- Badges: "Limited Edition", "Members Only", etc.
- Titel (taal-specifiek)
- Prijs (geformatteerd als €XX,XX)
- Origin & Vintage (als badges of tags)
- Stock indicator component
- Description

Onder de fold:
- "The Story" sectie (collapsible als lang)
- "Details" / "Tasting Notes" sectie

CTA Sectie (sticky op mobile):
- Als niet ingelogd: 
  - "Become a Member to Purchase" 
  - Login link
- Als ingelogd maar niet lid:
  - "Members Only" disabled button
  - Link naar membership info
- Als lid en uitverkocht:
  - "Sold Out" disabled button
- Als lid en beschikbaar:
  - Quantity selector (1-max remaining)
  - "Add to Cart" button
- Als drop upcoming (starts_at > now):
  - Countdown timer
  - "Notify Me" toggle button (voegt toe aan drop_interests)

Realtime subscription voor quantity_sold updates.
```

---

### Prompt 22: Drop Media Components

```
Maak de drop media components:

1. MediaLightbox (src/components/drop/MediaLightbox.tsx):
   Props:
   - images: Array<{url, alt}>
   - initialIndex: number
   - isOpen: boolean
   - onClose: () => void
   
   Features:
   - Fullscreen overlay
   - Grote afbeelding
   - Navigatie pijlen links/rechts
   - Thumbnail strip onderaan
   - Close button (X)
   - Keyboard navigation (arrows, escape)
   - Swipe support op mobile
   - Zoom op double-tap/click

2. CollapsibleStory (src/components/drop/CollapsibleStory.tsx):
   Props:
   - content: string
   - maxHeight?: number (default 200)
   
   Features:
   - Toon eerste X pixels
   - Gradient fade aan onderkant als afgekapt
   - "Read more" button
   - Smooth expand animatie
   - "Show less" button na expand

3. VideoPlayer component (optioneel):
   - YouTube/Vimeo embed support
   - Custom play button overlay
   - Lazy load
```

---

### Prompt 23: Drops Overview Page

```
Maak src/pages/DropsOverview.tsx:

Route: /drops

Header:
- Titel "All Drops"
- Filter tabs: "Active", "Upcoming", "Archive"

Grid van drop cards:
- 2 kolommen op mobile, 3 op tablet, 4 op desktop
- Per card:
  - Afbeelding (aspect ratio 4:3)
  - Status badge (Live, Upcoming, Ended)
  - Titel
  - Prijs
  - Stock indicator (alleen voor active)
  - Countdown (alleen voor upcoming)

Filtering logica:
- Active: is_active = true, starts_at <= now, (ends_at > now OR ends_at is null)
- Upcoming: is_active = true, starts_at > now
- Archive: is_active = true, ends_at < now

Sorteer op starts_at (nieuwste eerst).

Click op card navigeert naar /drop/:id.

Empty states per filter.
```

---

### Prompt 24: Archive Pages

```
Maak archive pagina's voor afgelopen drops:

1. Archive Page (src/pages/Archive.tsx):
   Route: /archive
   
   - Grid van afgelopen drops
   - "Ended" of "Sold Out" badges
   - Geen stock indicator (alleen eindstatus)
   - Click navigeert naar ArchiveDropDetail

2. ArchiveDropDetail (src/pages/ArchiveDropDetail.tsx):
   Route: /archive/:id
   
   - Zelfde layout als Drop.tsx
   - Maar read-only:
     - Geen Add to Cart
     - Geen Notify Me
     - Banner bovenaan: "This drop has ended on [date]"
     - Optioneel: "Sold X of Y" stats
   
   - Optionele CTA: "Interested in similar drops?"
     - Link naar relevante preference category
     - Of "Join waitlist for similar items"

Voeg "Archive" link toe in navigation menu.
```

---

## 🎯 FASE 7: CART & CHECKOUT

### Prompt 25: Cart Store met Zustand

```
Installeer zustand package.

Maak src/stores/cartStore.ts:

Types:
interface CartItem {
  dropId: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  maxQuantity: number; // voor stock check
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (dropId: string, quantity: number) => void;
  removeItem: (dropId: string) => void;
  clearCart: () => void;
  
  // Getters
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItem: (dropId: string) => CartItem | undefined;
}

Implementatie:
- addItem: voeg toe of update quantity als al bestaat
- updateQuantity: clamp tussen 1 en maxQuantity
- Persist in localStorage met zustand persist middleware

Export useCartStore hook.
```

---

### Prompt 26: Cart Drawer Component

```
Maak src/components/cart/CartDrawer.tsx:

Trigger (in Header):
- Shopping bag icon
- Badge met aantal items (alleen tonen als > 0)
- Click opent Sheet van rechts

Sheet content:
- Header: "Shopping Cart" + aantal items + close button
- 
- Items lijst (ScrollArea):
  Per item:
  - Thumbnail afbeelding
  - Titel
  - Prijs per stuk
  - Quantity controls:
    - Minus button
    - Aantal
    - Plus button
    - Disabled als max reached
  - Remove button (trash icon)
  - Subtotaal
  
- Empty state als geen items:
  - Illustratie of icon
  - "Your cart is empty"
  - "Browse Drops" link

Footer (sticky):
- Subtotal label + bedrag
- Checkout button (full width, prominent)
- Loading state op button tijdens checkout

Mobile optimalisaties:
- Sheet full height
- Sticky footer altijd zichtbaar
- Touch-friendly quantity controls
```

---

### Prompt 27: Add to Cart Flow

```
Verbind de Add to Cart functionaliteit:

1. Update Drop.tsx:
   - Import useCartStore
   - Quantity state voor selector
   
   Add to Cart button onClick:
   - Check of item al in cart
   - Als ja: update quantity
   - Als nee: addItem met drop data
   - Toast success: "Added to cart"
   
   BELANGRIJK: Toast position moet TOP zijn, niet bottom-right
   (bottom-right blokkeert checkout button op mobile)
   
   Button states:
   - Default: "Add to Cart"
   - Als al in cart: "Update Cart" of "Added ✓"
   - Loading: spinner
   - Disabled: als geen stock of geen shopify_product_id
   - Disabled: als quantity > remaining stock

2. Realtime stock check:
   - Bij toevoegen, check actuele stock
   - Als niet genoeg: toon error toast
   - Update maxQuantity in cart item

3. Visuele feedback:
   - Button animatie bij success
   - Cart icon pulse in header
   - Cart drawer auto-open optioneel
```

---

## 🎯 FASE 8: INTEGRATIES

### Prompt 28: Shopify Integratie Setup

```
Enable de Shopify integratie via de Lovable interface.

Maak src/lib/shopify.ts:

Constants (haal waardes op via Lovable tools):
- SHOPIFY_API_VERSION = '2025-07'
- SHOPIFY_STORE_PERMANENT_DOMAIN (via get_shopify_shop_permanent_domain)
- SHOPIFY_STOREFRONT_URL (construct from domain)
- SHOPIFY_STOREFRONT_TOKEN (via get_shopify_storefront_token)

Helper functie:
async function storefrontApiRequest<T>(
  query: string, 
  variables: Record<string, unknown> = {}
): Promise<T>

- POST naar SHOPIFY_STOREFRONT_URL
- Headers: Content-Type, X-Shopify-Storefront-Access-Token
- JSON body met query en variables
- Error handling voor 402 (payment required), network errors
- Return parsed data

Interfaces:
- BuyerIdentity (email, phone, deliveryAddressPreferences)

Country code mapping:
- Map 'Nederland' -> 'NL', 'Belgium' -> 'BE', etc.
- getCountryCode(countryName) helper
```

---

### Prompt 29: Cart Checkout Implementatie

```
Implementeer de Shopify checkout flow:

1. GraphQL Mutation in shopify.ts:
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

2. createStorefrontCheckout functie:
async function createStorefrontCheckout(
  items: Array<{ variantId: string; quantity: number }>,
  buyerIdentity?: BuyerIdentity
): Promise<string>

- Map items naar lines format
- Include buyerIdentity als provided
- Call storefrontApiRequest
- KRITIEK: Append ?channel=online_store aan checkoutUrl
- Return checkout URL

3. Update cartStore met createCheckout action:
- Haal user profile op voor buyerIdentity
- Map cart items naar Shopify format (gebruik shopify_product_id als variantId)
- Call createStorefrontCheckout
- Return URL

4. Update CartDrawer handleCheckout:
KRITIEK - Popup blocker prevention:
```javascript
const handleCheckout = async () => {
  setIsLoading(true);
  
  // Open window BEFORE await to prevent popup blocker
  const checkoutWindow = window.open('about:blank', '_blank');
  
  try {
    const url = await createCheckout();
    
    if (checkoutWindow) {
      checkoutWindow.location.href = url;
    } else {
      // Fallback if popup was blocked
      window.location.href = url;
    }
    
    clearCart();
    onClose();
  } catch (error) {
    checkoutWindow?.close();
    toast.error('Checkout failed');
  }
  
  setIsLoading(false);
};
```
```

---

### Prompt 30: Shopify Order Webhook

```
Maak de Shopify order webhook edge function:

supabase/functions/shopify-order-webhook/index.ts:

1. CORS headers setup

2. verifyShopifyWebhook functie:
   - Lees SHOPIFY_WEBHOOK_SECRET uit env
   - Bereken HMAC-SHA256 van raw body
   - Vergelijk met X-Shopify-Hmac-SHA256 header
   - Return boolean

3. Main handler:
   - Handle OPTIONS voor CORS
   - Lees raw body en headers
   - Verify webhook signature
   - Parse order JSON
   - Filter op topic: orders/create of orders/paid
   
4. Order processing:
   - Loop door line_items
   - Per item:
     - Find drop by shopify_product_id
     - Update quantity_sold
     - Find member by order email
     - Create drop_participation record als member gevonden
   
5. Admin notification:
   - Stuur email naar admin met order details
   - Gebruik Resend (komt in volgende prompt)

6. Config.toml update:
[functions.shopify-order-webhook]
verify_jwt = false

7. Voeg SHOPIFY_WEBHOOK_SECRET toe als secret
```

---

### Prompt 31: Resend Email Setup

```
Vraag de gebruiker om hun RESEND_API_KEY.

Maak basis email templates en edge functions:

1. supabase/functions/send-verification-email/index.ts:
   - Input: email, firstName, token, language
   - Genereer verification URL
   - Stuur email met link
   - Template: welkom, klik om te verifiëren

2. supabase/functions/verify-email/index.ts:
   - Input: token
   - Zoek profile met verification_token
   - Check expiry
   - Update email_verified = true
   - Clear token
   - Create member record als nog niet bestaat
   - Trigger send-welcome-email

3. supabase/functions/send-welcome-email/index.ts:
   - Input: email, firstName, userId, language
   - Fetch template uit site_settings
   - Stuur welkom email met dashboard link

4. supabase/functions/send-waitlist-confirmation/index.ts:
   - Input: email, name
   - Bevestiging dat ze op waitlist staan

5. Email template helper:
   - Basis HTML template met logo
   - Consistent branding
   - Footer met unsubscribe link
   - Tweetalige content support
```

---

### Prompt 32: Remaining Email Functions & Order Details

```
Maak de overige email en order functies:

1. supabase/functions/send-drop-live-notification/index.ts:
   - Input: dropId
   - Fetch drop details
   - Fetch alle drop_interests voor deze drop waar notified_at IS NULL
   - Stuur email naar elk interest
   - Update notified_at timestamp

2. supabase/functions/send-member-email/index.ts:
   - Input: recipients array of type ('bulk' | 'waitlist')
   - Subject en message
   - Admin auth check
   - Stuur email naar alle ontvangers
   - Return success/failed counts

3. supabase/functions/send-unsubscribe-confirmation/index.ts:
   - Input: email
   - Bevestiging van uitschrijving
   - Update preferences indien nodig

4. supabase/functions/get-order-details/index.ts:
   - Input: array van shopify_order_ids
   - Auth check
   - Query Shopify Admin API per order
   - Return order details (fulfillment status, tracking)

5. Maak src/pages/Unsubscribe.tsx:
   - Route: /unsubscribe
   - Query param: email of token
   - Bevestig uitschrijving
   - Update database
```

---

## 🎯 FASE 9: FINETUNING & POLISH

### Prompt 33: AI Content Generatie

```
Maak AI-assisted content generatie voor drops:

1. supabase/functions/generate-drop-content/index.ts:
   
   Gebruik Lovable AI (google/gemini-2.5-flash):
   
   Input:
   - description: korte beschrijving van product
   - origin: herkomst (optioneel)
   - vintage: jaartal (optioneel)
   - productType: type product
   
   Output (JSON):
   - title_en, title_nl
   - description_en, description_nl
   - story_en, story_nl
   - tasting_notes_en, tasting_notes_nl
   
   System prompt:
   "You are a luxury goods copywriter for an exclusive members-only club.
   Write compelling, sophisticated content that emphasizes rarity, quality,
   and the story behind each item. Tone: refined, knowledgeable, slightly
   mysterious. Avoid clichés. Output valid JSON only."

2. supabase/functions/translate-drop-content/index.ts:
   - Input: text, sourceLanguage, targetLanguage
   - Vertaal met behoud van tone-of-voice
   - Return vertaalde tekst

3. DropQuickCreate component (src/components/admin/DropQuickCreate.tsx):
   - Mobiel-vriendelijk formulier
   - Eén groot tekstveld: "Describe the product..."
   - Optional: origin, vintage inputs
   - "Generate with AI" button
   - Loading state met progress animatie
   - Review scherm met gegenereerde content
   - Edit buttons per veld
   - "Open in Full Editor" button
   - "Save as Draft" button

4. AI translate buttons in DropEditorForm:
   - Sparkle icon naast elk tekstveld
   - Tooltip: "Generate [language] from [other language]"
   - Click: call translate-drop-content
   - Fill in result
```

---

### Prompt 34: Media Upload & Gallery Manager

```
Maak media upload componenten:

1. Maak Supabase storage bucket "drop-media":
   - Public bucket
   - Allowed mime types: image/jpeg, image/png, image/webp, video/mp4
   - Max file size: 10MB images, 100MB videos

2. MediaUpload component (src/components/admin/MediaUpload.tsx):
   Props:
   - onUpload: (url: string) => void
   - accept?: string
   - maxSize?: number
   
   Features:
   - Drag & drop zone
   - Click to browse
   - File type validation
   - Size validation
   - Upload progress indicator
   - Preview before upload
   - Upload to Supabase storage
   - Return public URL
   - Error handling met toast

3. DropGalleryManager (src/components/admin/DropGalleryManager.tsx):
   Props:
   - dropId: string
   - images: DropImage[]
   - onChange: (images: DropImage[]) => void
   
   Features:
   - Grid van thumbnails
   - Add image button (triggers MediaUpload)
   - Drag to reorder (update sort_order)
   - Delete button per image (met confirm)
   - Alt text editing
   - Save changes to drop_images table

4. Integreer in DropEditor:
   - Main image via MediaUpload
   - Gallery via DropGalleryManager
```

---

### Prompt 35: Final Polish & Edge Cases

```
Laatste verbeteringen en edge cases:

1. NotFound Page (src/pages/NotFound.tsx):
   - Stijlvolle 404 pagina
   - "Page not found" message
   - Suggesties: Home, Drops, Contact
   - Animated illustration of iets creatiefs

2. ThankYou Page (src/pages/ThankYou.tsx):
   Route: /thank-you
   - Checkout success bevestiging
   - "Thank you for your purchase!"
   - Order wordt verwerkt message
   - Link naar orders in dashboard
   - Link naar meer drops

3. Error Boundaries:
   - Wrap main routes in ErrorBoundary
   - Graceful error display
   - "Something went wrong" message
   - Retry button
   - Report issue link

4. Loading States:
   - Skeleton loaders voor alle data-fetching
   - Consistent loading spinner component
   - Minimum loading time (300ms) om flashing te voorkomen

5. Mobile Optimalisaties:
   - Touch targets minimaal 44x44px
   - Sticky CTAs op product pagina's
   - Pull-to-refresh waar logisch
   - Swipe gestures op galleries

6. SEO Basics:
   - Page titles via document.title
   - Meta descriptions
   - Open Graph tags voor social sharing
   - Structured data voor producten

7. Accessibility:
   - Proper heading hierarchy
   - Alt texts op alle afbeeldingen
   - Focus states op interactieve elementen
   - ARIA labels waar nodig

8. Performance:
   - Lazy load images
   - Code splitting via React.lazy
   - Debounce search inputs
```

---

## ⚠️ BELANGRIJKE TIPS & VERMIJDEN

### ✅ Doe Dit Altijd:

1. **Shopify Checkout**
   - Altijd `?channel=online_store` toevoegen aan checkout URL
   - `window.open('about:blank', '_blank')` VOOR de await
   - Fallback naar `window.location.href` als popup blocked

2. **Toast Notifications**
   - Gebruik TOP positie (top-center of top-right)
   - NOOIT bottom-right (blokkeert checkout button op mobile)

3. **Kleuren**
   - HSL format voor alle kleuren in design system
   - Gebruik CSS variabelen, geen hardcoded kleuren

4. **Database**
   - Roles in aparte tabel, NOOIT op profile
   - has_role() security definer functie gebruiken
   - Validation triggers ipv CHECK constraints met now()

5. **Auth**
   - Email verificatie verplicht
   - Geen anonymous signups
   - Enable auto-confirm voor development

6. **Realtime**
   - Subscribe op stock updates
   - Cleanup subscriptions bij unmount

---

### ❌ Vermijd Dit Altijd:

1. **Shopify**
   - Geen handmatige checkout URLs construeren
   - Geen directe product page redirects
   - Geen hardcoded store URLs

2. **Security**
   - Geen API keys in frontend code
   - Geen admin check via localStorage
   - Geen roles op profile/users tabel

3. **Database**
   - Geen CHECK constraints met `now()`
   - Geen foreign keys naar auth.users (gebruik uuid)
   - Geen modificaties aan Supabase reserved schemas

4. **UX**
   - Geen blocking modals voor belangrijke CTAs
   - Geen infinite spinners zonder timeout
   - Geen auto-playing video met geluid

---

## 📁 Resulterende Bestandsstructuur

```
src/
├── components/
│   ├── admin/
│   │   ├── DropEditor.tsx
│   │   ├── DropEditorForm.tsx
│   │   ├── DropEditorPreview.tsx
│   │   ├── DropGalleryManager.tsx
│   │   ├── DropQuickCreate.tsx
│   │   ├── EmailComposer.tsx
│   │   ├── MediaUpload.tsx
│   │   ├── MemberDetailModal.tsx
│   │   ├── PreferenceCategoriesManager.tsx
│   │   ├── PreferencesOverview.tsx
│   │   └── SiteSettingsEditor.tsx
│   ├── cart/
│   │   └── CartDrawer.tsx
│   ├── dashboard/
│   │   ├── DropsTab.tsx
│   │   ├── OnboardingTour.tsx
│   │   └── OrdersList.tsx
│   ├── drop/
│   │   ├── CollapsibleStory.tsx
│   │   ├── MediaLightbox.tsx
│   │   └── StockIndicator.tsx
│   ├── ui/
│   │   └── (shadcn components)
│   ├── CountdownTimer.tsx
│   ├── Header.tsx
│   ├── LanguageToggle.tsx
│   ├── NavLink.tsx
│   ├── PageLoader.tsx
│   ├── ScrollIndicator.tsx
│   ├── ThemeToggle.tsx
│   └── WaitlistForm.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── integrations/
│   └── supabase/
│       ├── client.ts (auto-generated)
│       └── types.ts (auto-generated)
├── lib/
│   ├── imageUtils.ts
│   ├── shopify.ts
│   ├── translations.ts
│   └── utils.ts
├── pages/
│   ├── Admin.tsx
│   ├── Archive.tsx
│   ├── ArchiveDropDetail.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Drop.tsx
│   ├── DropPreview.tsx
│   ├── DropsOverview.tsx
│   ├── Index.tsx
│   ├── Manifesto.tsx
│   ├── Membership.tsx
│   ├── NotFound.tsx
│   ├── ThankYou.tsx
│   └── Unsubscribe.tsx
├── stores/
│   └── cartStore.ts
├── App.tsx
├── App.css
├── index.css
├── main.tsx
└── vite-env.d.ts

supabase/
├── config.toml
├── functions/
│   ├── delete-auth-user/
│   │   └── index.ts
│   ├── generate-drop-content/
│   │   └── index.ts
│   ├── get-order-details/
│   │   └── index.ts
│   ├── send-drop-live-notification/
│   │   └── index.ts
│   ├── send-member-email/
│   │   └── index.ts
│   ├── send-unsubscribe-confirmation/
│   │   └── index.ts
│   ├── send-verification-email/
│   │   └── index.ts
│   ├── send-waitlist-confirmation/
│   │   └── index.ts
│   ├── send-welcome-email/
│   │   └── index.ts
│   ├── shopify-order-webhook/
│   │   └── index.ts
│   ├── translate-drop-content/
│   │   └── index.ts
│   └── verify-email/
│       └── index.ts
└── migrations/
    └── (auto-managed)

public/
├── favicon.ico
├── logo.png
├── email-logo.png
├── robots.txt
└── lovable-webshop-build-guide.md
```

---

## 🔧 Database Functies

Belangrijke database functies die aangemaakt moeten worden:

```sql
-- Check of user een specifieke role heeft
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check of user een actief lid is
CREATE OR REPLACE FUNCTION public.is_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = _user_id
      AND status = 'active'
  )
$$;

-- Trigger voor automatisch profile aanmaken
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, email_verified)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    false
  );
  RETURN NEW;
END;
$$;

-- Trigger voor updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

## 🚀 Go Live Checklist

Voordat je live gaat:

- [ ] Alle environment variables ingesteld
- [ ] Resend domein geverifieerd
- [ ] Shopify webhook geconfigureerd
- [ ] Admin user aangemaakt met role
- [ ] Test drop aangemaakt
- [ ] Checkout flow getest
- [ ] Email flows getest
- [ ] Mobile responsive getest
- [ ] Waitlist flow getest
- [ ] Invite code flow getest
- [ ] 404 pagina werkt
- [ ] Error boundaries werken
- [ ] Analytics geconfigureerd (optioneel)

---

**Veel succes met bouwen! 🎉**
