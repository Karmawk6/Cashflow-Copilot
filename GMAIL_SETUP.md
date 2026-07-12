# Gmail sending setup (Google OAuth, testing mode)

Lets each user connect their own Gmail from **Settings → Email sending**, so approved
follow-ups are sent from their real address and replies land in their inbox.

The app only requests two scopes: `gmail.send` (send, never read) and
`userinfo.email` (to show which account is connected).

## One-time Google Cloud setup (~15 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project
   (e.g. `duebird`).
2. **APIs & Services → Library** → search **Gmail API** → Enable.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**, then fill in app name, support email, developer email.
   - Publishing status: leave in **Testing**.
   - **Audience → Test users**: add every email that will connect a Gmail
     (you + the pilot companies' users, up to 100).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs — add BOTH:
     - `http://localhost:3000/api/gmail/callback`
     - `https://duebird.io/api/gmail/callback`
5. Copy the **Client ID** and **Client secret** into:
   - `.env.local` (for local dev)
   - Vercel → Project → Settings → Environment Variables (for production)

   ```
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```
6. Redeploy. The Settings card switches from the setup notice to a
   **Connect Gmail** button.

## Testing-mode limitations (why, and the upgrade path)

`gmail.send` is a Google **restricted** scope. While the OAuth app is in
**Testing** status:

- Only the allowlisted test users (max 100) can connect.
- Google shows an "unverified app" style consent screen — expected, tell pilots.
- **Refresh tokens expire after 7 days** — connected users must reconnect
  weekly (the Settings card shows "Connection expired — reconnect" when this
  happens; sending silently falls back to the platform sender meanwhile).

To open this to the public later, the app must go through Google's OAuth
verification, which for restricted scopes includes a paid third-party security
assessment (CASA — budget weeks of lead time and ~$500+/year). Until pilots
prove the feature out, testing mode is the pragmatic choice.

## How sending picks a route

1. User connected Gmail and the token is healthy → send via **their Gmail**.
2. Otherwise → platform sender (Resend if `RESEND_API_KEY` is set, console log
   in demo mode). A Gmail failure never blocks the email — it falls back.
