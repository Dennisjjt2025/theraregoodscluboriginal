export type Language = 'en' | 'nl';

type TranslationContent = {
  nav: {
    home: string;
    currentDrop: string;
    dashboard: string;
    admin: string;
    login: string;
    logout: string;
  };
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    memberLogin: string;
    joinWaitlist: string;
    nextDrop: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    waitlistTitle: string;
    waitlistSubtitle: string;
    emailPlaceholder: string;
    namePlaceholder: string;
    submit: string;
    waitlistSuccess: string;
    exclusiveAccess: string;
    curatedDrops: string;
    limitedEditions: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    emailSent: string;
    sendMagicLink: string;
    inviteCode: string;
    enterInviteCode: string;
    validateInvite: string;
    invalidInvite: string;
    backToLogin: string;
    chooseTitle: string;
    chooseSubtitle: string;
    imAMember: string;
    imAMemberDesc: string;
    noAccessYet: string;
    noAccessDesc: string;
    haveInviteCode: string;
    joinWaitlist: string;
    waitlistBenefit: string;
    alreadyOnWaitlist: string;
    createAccount: string;
    createAccountDesc: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    passwordMismatch: string;
    passwordTooShort: string;
    signUp: string;
    loginWithPassword: string;
    forgotPassword: string;
    orUsePassword: string;
    accountCreated: string;
    verifyEmail: string;
    verifyEmailDesc: string;
    verifyEmailSent: string;
    verifyEmailCheck: string;
    emailVerified: string;
    emailVerifiedDesc: string;
    emailNotVerified: string;
    invalidVerificationToken: string;
    resendVerification: string;
  };
  dashboard: {
    title: string;
    welcome: string;
    memberStatus: string;
    active: string;
    suspended: string;
    strikeTracker: string;
    strikesRemaining: string;
    strikeWarning: string;
    invites: string;
    invitesRemaining: string;
    generateInvite: string;
    copyLink: string;
    copied: string;
    noInvites: string;
    currentDrop: string;
    noDrop: string;
    viewDrop: string;
    purchaseHistory: string;
    noPurchases: string;
    myProfile: string;
    profileSettings: string;
    phone: string;
    streetAddress: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
    profileSaved: string;
    completeProfile: string;
  };
  drop: {
    currentDrop: string;
    endsIn: string;
    allocation: string;
    addToCart: string;
    soldOut: string;
    origin: string;
    vintage: string;
    tastingNotes: string;
    theStory: string;
    limited: string;
    membersOnly: string;
  };
  admin: {
    title: string;
    createDrop: string;
    manageDrop: string;
    manageMembers: string;
    waitlist: string;
    dropTitle: string;
    dropTitleEn: string;
    dropTitleNl: string;
    description: string;
    descriptionEn: string;
    descriptionNl: string;
    storyEn: string;
    storyNl: string;
    tastingNotesEn: string;
    tastingNotesNl: string;
    price: string;
    quantity: string;
    startDate: string;
    endDate: string;
    shopifyProductId: string;
    imageUrl: string;
    createDropBtn: string;
    updateDropBtn: string;
    deleteDropBtn: string;
    memberEmail: string;
    memberStatus: string;
    memberStrikes: string;
    memberActions: string;
    memberNotes: string;
    addNote: string;
    resetStrikes: string;
    addStrike: string;
    removeStrike: string;
    suspendMember: string;
    activateMember: string;
    approveWaitlist: string;
    rejectWaitlist: string;
    dropReport: string;
    selectDrop: string;
    selectDropPrompt: string;
    filterAll: string;
    filterPurchased: string;
    filterNotPurchased: string;
    totalMembers: string;
    purchased: string;
    notPurchased: string;
    purchaseStatus: string;
    noResults: string;
    memberDetails: string;
    notesSaved: string;
    invitesRemaining: string;
    memberSince: string;
    communicationNotes: string;
    notesPlaceholder: string;
    noNotes: string;
    participationHistory: string;
    noParticipationHistory: string;
    totalDrops: string;
    missed: string;
    viewDetails: string;
    emailVerifiedLabel: string;
    emailVerifiedSuccess: string;
    verifyEmailBtn: string;
  };
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    confirm: string;
  };
};

export const translations: Record<Language, TranslationContent> = {
  en: {
    nav: {
      home: 'Home',
      currentDrop: 'Current Drop',
      dashboard: 'Dashboard',
      admin: 'Admin',
      login: 'Member Login',
      logout: 'Logout',
    },
    landing: {
      heroTitle: 'The Rare Goods Club',
      heroSubtitle: 'An invitation-only collective for the discerning few',
      memberLogin: 'Member Login',
      joinWaitlist: 'Join Waitlist',
      nextDrop: 'Next Drop In',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Minutes',
      seconds: 'Seconds',
      waitlistTitle: 'Request Access',
      waitlistSubtitle: 'Leave your details to be considered for membership',
      emailPlaceholder: 'Your email address',
      namePlaceholder: 'Your full name',
      submit: 'Submit Request',
      waitlistSuccess: "Your request has been submitted. We'll be in touch.",
      exclusiveAccess: 'Exclusive access to rare goods',
      curatedDrops: 'Curated drops from around the world',
      limitedEditions: 'Limited editions & allocations',
    },
    auth: {
      loginTitle: 'Member Access',
      loginSubtitle: 'Enter your email to receive a magic link',
      emailSent: 'Check your email for the login link',
      sendMagicLink: 'Send Magic Link',
      inviteCode: 'Have an invite code?',
      enterInviteCode: 'Enter your invite code',
      validateInvite: 'Validate & Continue',
      invalidInvite: 'Invalid or expired invite code',
      backToLogin: 'Back to Login',
      chooseTitle: 'Welcome',
      chooseSubtitle: 'How would you like to continue?',
      imAMember: "I'm a member",
      imAMemberDesc: 'Login with your email',
      noAccessYet: "I don't have access yet",
      noAccessDesc: 'Request to join the club',
      haveInviteCode: 'I have an invite code',
      joinWaitlist: 'Join the waitlist',
      waitlistBenefit: "You'll also receive updates about available drops after launch!",
      alreadyOnWaitlist: 'This email is already on the waitlist',
      createAccount: 'Create your account',
      createAccountDesc: 'Fill in your details to complete registration',
      firstName: 'First name',
      lastName: 'Last name',
      password: 'Password',
      confirmPassword: 'Confirm password',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      signUp: 'Create Account',
      loginWithPassword: 'Login with email & password',
      forgotPassword: 'Forgot password?',
      orUsePassword: 'Or login with password',
      accountCreated: 'Account created! You can now login.',
      verifyEmail: 'Verify your email',
      verifyEmailDesc: 'We sent a verification link to your email',
      verifyEmailSent: 'Verification email sent!',
      verifyEmailCheck: 'Please check your inbox and click the verification link to activate your account.',
      emailVerified: 'Email verified!',
      emailVerifiedDesc: 'Your email has been verified. You can now login.',
      emailNotVerified: 'Please verify your email before logging in',
      invalidVerificationToken: 'Invalid or expired verification link',
      resendVerification: 'Resend verification email',
    },
    dashboard: {
      title: 'Member Dashboard',
      welcome: 'Welcome back',
      memberStatus: 'Member Status',
      active: 'Active',
      suspended: 'Suspended',
      strikeTracker: 'Strike Tracker',
      strikesRemaining: 'strikes remaining',
      strikeWarning: 'Warning: One more missed drop and your membership will be suspended',
      invites: 'Your Invites',
      invitesRemaining: 'invites remaining',
      generateInvite: 'Generate Invite Link',
      copyLink: 'Copy Link',
      copied: 'Copied!',
      noInvites: 'No invites remaining',
      currentDrop: 'Current Drop',
      noDrop: 'No active drop at the moment',
      viewDrop: 'View Drop',
      purchaseHistory: 'Purchase History',
      noPurchases: 'No purchases yet',
      myProfile: 'My Profile',
      profileSettings: 'Profile Settings',
      phone: 'Phone number',
      streetAddress: 'Street',
      houseNumber: 'House number',
      postalCode: 'Postal code',
      city: 'City',
      country: 'Country',
      profileSaved: 'Profile saved',
      completeProfile: 'Complete your profile to receive your orders',
    },
    drop: {
      currentDrop: 'Current Drop',
      endsIn: 'Ends in',
      allocation: 'Your Allocation',
      addToCart: 'Add to Cart',
      soldOut: 'Sold Out',
      origin: 'Origin',
      vintage: 'Vintage',
      tastingNotes: 'Tasting Notes',
      theStory: 'The Story',
      limited: 'Limited Edition',
      membersOnly: 'Members Only',
    },
    admin: {
      title: 'Admin Dashboard',
      createDrop: 'Create New Drop',
      manageDrop: 'Manage Drops',
      manageMembers: 'Manage Members',
      waitlist: 'Waitlist',
      dropTitle: 'Drop Title',
      dropTitleEn: 'Title (English)',
      dropTitleNl: 'Title (Dutch)',
      description: 'Description',
      descriptionEn: 'Description (English)',
      descriptionNl: 'Description (Dutch)',
      storyEn: 'Story (English)',
      storyNl: 'Story (Dutch)',
      tastingNotesEn: 'Tasting Notes (English)',
      tastingNotesNl: 'Tasting Notes (Dutch)',
      price: 'Price',
      quantity: 'Quantity Available',
      startDate: 'Drop Start',
      endDate: 'Drop End',
      shopifyProductId: 'Shopify Product ID',
      imageUrl: 'Image URL',
      createDropBtn: 'Create Drop',
      updateDropBtn: 'Update Drop',
      deleteDropBtn: 'Delete Drop',
      memberEmail: 'Email',
      memberStatus: 'Status',
      memberStrikes: 'Strikes',
      memberActions: 'Actions',
      memberNotes: 'Notes',
      addNote: 'Click to add note...',
      resetStrikes: 'Reset Strikes',
      addStrike: 'Add Strike',
      removeStrike: 'Remove Strike',
      suspendMember: 'Suspend',
      activateMember: 'Activate',
      approveWaitlist: 'Approve',
      rejectWaitlist: 'Reject',
      dropReport: 'Drop Report',
      selectDrop: 'Select a drop...',
      selectDropPrompt: 'Select a drop to view participation report',
      filterAll: 'All',
      filterPurchased: 'Purchased',
      filterNotPurchased: 'Not Purchased',
      totalMembers: 'Total Members',
      purchased: 'Purchased',
      notPurchased: 'Not Purchased',
      purchaseStatus: 'Purchase Status',
      noResults: 'No results found',
      memberDetails: 'Member Details',
      notesSaved: 'Notes saved',
      invitesRemaining: 'Invites Remaining',
      memberSince: 'Member Since',
      communicationNotes: 'Communication Notes',
      notesPlaceholder: 'Add notes about member communications, agreements, etc...',
      noNotes: 'No notes yet',
      participationHistory: 'Participation History',
      noParticipationHistory: 'No drop participation history yet',
      totalDrops: 'Total Drops',
      missed: 'Missed',
      viewDetails: 'View Details',
      emailVerifiedLabel: 'Email verified',
      emailVerifiedSuccess: 'Email verified successfully',
      verifyEmailBtn: 'Verify email manually',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      confirm: 'Confirm',
    },
  },
  nl: {
    nav: {
      home: 'Home',
      currentDrop: 'Huidige Drop',
      dashboard: 'Dashboard',
      admin: 'Admin',
      login: 'Leden Login',
      logout: 'Uitloggen',
    },
    landing: {
      heroTitle: 'The Rare Goods Club',
      heroSubtitle: 'Een exclusief collectief voor de kenner',
      memberLogin: 'Leden Login',
      joinWaitlist: 'Wachtlijst',
      nextDrop: 'Volgende Drop Over',
      days: 'Dagen',
      hours: 'Uren',
      minutes: 'Minuten',
      seconds: 'Seconden',
      waitlistTitle: 'Toegang Aanvragen',
      waitlistSubtitle: 'Laat je gegevens achter om in aanmerking te komen voor lidmaatschap',
      emailPlaceholder: 'Je e-mailadres',
      namePlaceholder: 'Je volledige naam',
      submit: 'Aanvraag Verzenden',
      waitlistSuccess: 'Je aanvraag is ingediend. We nemen contact met je op.',
      exclusiveAccess: 'Exclusieve toegang tot zeldzame producten',
      curatedDrops: 'Gecureerde drops van over de hele wereld',
      limitedEditions: 'Limited editions & allocaties',
    },
    auth: {
      loginTitle: 'Leden Toegang',
      loginSubtitle: 'Voer je e-mail in om een magic link te ontvangen',
      emailSent: 'Controleer je e-mail voor de login link',
      sendMagicLink: 'Verstuur Magic Link',
      inviteCode: 'Heb je een uitnodigingscode?',
      enterInviteCode: 'Voer je uitnodigingscode in',
      validateInvite: 'Valideren & Doorgaan',
      invalidInvite: 'Ongeldige of verlopen uitnodigingscode',
      backToLogin: 'Terug naar Login',
      chooseTitle: 'Welkom',
      chooseSubtitle: 'Hoe wil je verder?',
      imAMember: 'Ik ben lid',
      imAMemberDesc: 'Inloggen met je email',
      noAccessYet: 'Ik heb nog geen toegang',
      noAccessDesc: 'Vraag toegang aan tot de club',
      haveInviteCode: 'Ik heb een uitnodigingscode',
      joinWaitlist: 'Schrijf je in op de wachtlijst',
      waitlistBenefit: 'Je ontvangt ook updates over beschikbare drops na livegang!',
      alreadyOnWaitlist: 'Dit e-mailadres staat al op de wachtlijst',
      createAccount: 'Maak je account aan',
      createAccountDesc: 'Vul je gegevens in om je registratie te voltooien',
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      password: 'Wachtwoord',
      confirmPassword: 'Bevestig wachtwoord',
      passwordMismatch: 'Wachtwoorden komen niet overeen',
      passwordTooShort: 'Wachtwoord moet minimaal 6 tekens zijn',
      signUp: 'Account Aanmaken',
      loginWithPassword: 'Inloggen met email & wachtwoord',
      forgotPassword: 'Wachtwoord vergeten?',
      orUsePassword: 'Of inloggen met wachtwoord',
      accountCreated: 'Account aangemaakt! Je kunt nu inloggen.',
      verifyEmail: 'Verifieer je email',
      verifyEmailDesc: 'We hebben een verificatielink naar je email gestuurd',
      verifyEmailSent: 'Verificatie email verzonden!',
      verifyEmailCheck: 'Controleer je inbox en klik op de verificatielink om je account te activeren.',
      emailVerified: 'Email geverifieerd!',
      emailVerifiedDesc: 'Je email is geverifieerd. Je kunt nu inloggen.',
      emailNotVerified: 'Verifieer eerst je email voordat je inlogt',
      invalidVerificationToken: 'Ongeldige of verlopen verificatielink',
      resendVerification: 'Verificatie email opnieuw verzenden',
    },
    dashboard: {
      title: 'Leden Dashboard',
      welcome: 'Welkom terug',
      memberStatus: 'Lidstatus',
      active: 'Actief',
      suspended: 'Opgeschort',
      strikeTracker: 'Strike Tracker',
      strikesRemaining: 'strikes over',
      strikeWarning: 'Waarschuwing: Nog één gemiste drop en je lidmaatschap wordt opgeschort',
      invites: 'Je Uitnodigingen',
      invitesRemaining: 'uitnodigingen over',
      generateInvite: 'Genereer Uitnodigingslink',
      copyLink: 'Kopieer Link',
      copied: 'Gekopieerd!',
      noInvites: 'Geen uitnodigingen meer',
      currentDrop: 'Huidige Drop',
      noDrop: 'Momenteel geen actieve drop',
      viewDrop: 'Bekijk Drop',
      purchaseHistory: 'Aankoopgeschiedenis',
      noPurchases: 'Nog geen aankopen',
      myProfile: 'Mijn Profiel',
      profileSettings: 'Profiel Instellingen',
      phone: 'Telefoonnummer',
      streetAddress: 'Straat',
      houseNumber: 'Huisnummer',
      postalCode: 'Postcode',
      city: 'Stad',
      country: 'Land',
      profileSaved: 'Profiel opgeslagen',
      completeProfile: 'Vul je profiel aan om je bestellingen te ontvangen',
    },
    drop: {
      currentDrop: 'Huidige Drop',
      endsIn: 'Eindigt over',
      allocation: 'Jouw Allocatie',
      addToCart: 'Toevoegen aan Winkelwagen',
      soldOut: 'Uitverkocht',
      origin: 'Herkomst',
      vintage: 'Jaargang',
      tastingNotes: 'Proefnotities',
      theStory: 'Het Verhaal',
      limited: 'Limited Edition',
      membersOnly: 'Alleen voor Leden',
    },
    admin: {
      title: 'Admin Dashboard',
      createDrop: 'Nieuwe Drop Aanmaken',
      manageDrop: 'Drops Beheren',
      manageMembers: 'Leden Beheren',
      waitlist: 'Wachtlijst',
      dropTitle: 'Drop Titel',
      dropTitleEn: 'Titel (Engels)',
      dropTitleNl: 'Titel (Nederlands)',
      description: 'Beschrijving',
      descriptionEn: 'Beschrijving (Engels)',
      descriptionNl: 'Beschrijving (Nederlands)',
      storyEn: 'Verhaal (Engels)',
      storyNl: 'Verhaal (Nederlands)',
      tastingNotesEn: 'Proefnotities (Engels)',
      tastingNotesNl: 'Proefnotities (Nederlands)',
      price: 'Prijs',
      quantity: 'Beschikbare Hoeveelheid',
      startDate: 'Drop Start',
      endDate: 'Drop Einde',
      shopifyProductId: 'Shopify Product ID',
      imageUrl: 'Afbeelding URL',
      createDropBtn: 'Drop Aanmaken',
      updateDropBtn: 'Drop Bijwerken',
      deleteDropBtn: 'Drop Verwijderen',
      memberEmail: 'E-mail',
      memberStatus: 'Status',
      memberStrikes: 'Strikes',
      memberActions: 'Acties',
      memberNotes: 'Notities',
      addNote: 'Klik om notitie toe te voegen...',
      resetStrikes: 'Strikes Resetten',
      addStrike: 'Strike Toevoegen',
      removeStrike: 'Strike Verwijderen',
      suspendMember: 'Opschorten',
      activateMember: 'Activeren',
      approveWaitlist: 'Goedkeuren',
      rejectWaitlist: 'Afwijzen',
      dropReport: 'Drop Rapport',
      selectDrop: 'Selecteer een drop...',
      selectDropPrompt: 'Selecteer een drop om het deelnamerapport te bekijken',
      filterAll: 'Alles',
      filterPurchased: 'Gekocht',
      filterNotPurchased: 'Niet Gekocht',
      totalMembers: 'Totaal Leden',
      purchased: 'Gekocht',
      notPurchased: 'Niet Gekocht',
      purchaseStatus: 'Aankoopstatus',
      noResults: 'Geen resultaten gevonden',
      memberDetails: 'Lid Details',
      notesSaved: 'Notities opgeslagen',
      invitesRemaining: 'Uitnodigingen Over',
      memberSince: 'Lid Sinds',
      communicationNotes: 'Communicatie Notities',
      notesPlaceholder: 'Voeg notities toe over communicatie met lid, afspraken, etc...',
      noNotes: 'Nog geen notities',
      participationHistory: 'Deelname Geschiedenis',
      noParticipationHistory: 'Nog geen drop deelname geschiedenis',
      totalDrops: 'Totaal Drops',
      missed: 'Gemist',
      viewDetails: 'Details Bekijken',
      emailVerifiedLabel: 'Email geverifieerd',
      emailVerifiedSuccess: 'Email succesvol geverifieerd',
      verifyEmailBtn: 'Email handmatig verifiëren',
    },
    common: {
      loading: 'Laden...',
      error: 'Er is een fout opgetreden',
      save: 'Opslaan',
      cancel: 'Annuleren',
      delete: 'Verwijderen',
      edit: 'Bewerken',
      back: 'Terug',
      confirm: 'Bevestigen',
    },
  },
};