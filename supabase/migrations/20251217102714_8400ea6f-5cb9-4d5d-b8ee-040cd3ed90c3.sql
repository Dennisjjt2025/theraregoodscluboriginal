-- Add email message settings for welcome, waitlist, and unsubscribe emails
INSERT INTO public.site_settings (key, value_en, value_nl) VALUES
  -- Welcome email for new members
  ('welcome_email_subject', 'Welcome to The Rare Goods Club', 'Welkom bij The Rare Goods Club'),
  ('welcome_email_message', 'Thank you for joining The Rare Goods Club. To complete your registration and activate your membership, please verify your email address by clicking the button below.', 'Bedankt voor je aanmelding bij The Rare Goods Club. Om je registratie te voltooien en je lidmaatschap te activeren, verifieer je e-mailadres door op de onderstaande knop te klikken.'),
  
  -- Waitlist confirmation email
  ('waitlist_email_subject', 'You''re on the waitlist!', 'Je staat op de wachtlijst!'),
  ('waitlist_email_message', 'Thank you for your interest in The Rare Goods Club. You have been added to our exclusive waitlist. We''ll notify you when a spot becomes available or when we have special offers for waitlist members.', 'Bedankt voor je interesse in The Rare Goods Club. Je bent toegevoegd aan onze exclusieve wachtlijst. We laten je weten wanneer er een plek beschikbaar komt of wanneer we speciale aanbiedingen hebben voor wachtlijstleden.'),
  
  -- Unsubscribe confirmation email
  ('unsubscribe_email_subject', 'You have been unsubscribed', 'Je bent uitgeschreven'),
  ('unsubscribe_email_message', 'We''re sorry to see you go. You have been successfully unsubscribed from The Rare Goods Club communications. If you change your mind, you can always rejoin our waitlist.', 'Jammer dat je gaat. Je bent succesvol uitgeschreven van The Rare Goods Club communicatie. Als je van gedachten verandert, kun je je altijd opnieuw aanmelden op onze wachtlijst.')
ON CONFLICT (key) DO NOTHING;