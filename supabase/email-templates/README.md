# League Weaver Supabase Email Templates

Paste these into Supabase Dashboard -> Authentication -> Email Templates.

## Required Branding Assets

These templates use:

- Logo: `{{ .SiteURL }}/branding/leagueweaver-email-mark.png`
- Display font: `{{ .SiteURL }}/fonts/BarlowCondensed-Bold.ttf`
- Body font: `{{ .SiteURL }}/fonts/Archivo-Variable.ttf`

Email clients do not all load custom fonts. These templates include the League Weaver fonts where supported and strong fallback fonts everywhere else.

Every template also includes:

- Hidden preheader text
- The League Weaver PNG mark
- Email-safe table layout
- Mobile padding and button safeguards
- One primary CTA for action emails
- Manual fallback URLs when Supabase provides `{{ .ConfirmationURL }}`
- Security guidance for unexpected emails
- Support footer: `support@leagueweaver.com`

## Supabase Setup

1. What to click
   Supabase Dashboard -> Authentication -> URL Configuration.

2. What to type or paste
   Set Site URL to your production domain:

   `https://leagueweaver.com`

   Add redirect URLs:

   `https://leagueweaver.com/auth/callback`

   `https://leagueweaver.com/auth/callback?next=*`

3. What should happen next
   Supabase will resolve the logo and font URLs from `{{ .SiteURL }}`.

## Template Subjects

- Confirm sign up: `Confirm your League Weaver account`
- Invite user: `You have been invited to League Weaver`
- Magic Link: `Your League Weaver sign-in link`
- Change email address: `Confirm your new League Weaver email`
- Reset password: `Reset your League Weaver password`
- Reauthentication: `Your League Weaver verification code`
- Password changed notification: `Your League Weaver password was changed`
- Email address changed notification: `Your League Weaver email was changed`

## Supabase Variable Limits

Supabase provides different variables per template. These templates only use variables supported by the matching template:

- `{{ .ConfirmationURL }}` for action links
- `{{ .Token }}` for reauthentication
- `{{ .Email }}` for recipient/current email
- `{{ .NewEmail }}` for confirming a new email
- `{{ .OldEmail }}` for email changed notifications
- `{{ .SiteURL }}` for hosted logo and font assets

Supabase does not provide an inviter name or exact timestamp in these dashboard templates by default, so the copy avoids pretending those values are available.

## Important Supabase Note

New Supabase Free projects created on or after June 3, 2026 need either a paid Supabase plan or custom SMTP before auth email templates can be customized.
