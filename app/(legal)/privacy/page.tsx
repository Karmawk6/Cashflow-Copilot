import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL, EFFECTIVE_DATE } from '../legal-info'

export const metadata: Metadata = {
  title: 'Privacy Policy — CashFlow Copilot',
  description: 'How CashFlow Copilot collects, stores, and protects your data.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>

      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        This policy explains what information CashFlow Copilot (&quot;we&quot;,
        &quot;the Service&quot;) collects, how it is stored and protected, who it
        is shared with, and the choices you have. The short version: we collect
        only what the product needs to work, we never sell your data, and we do
        not use your data for advertising.
      </p>

      <Section title="1. Information we collect">
        <p>
          <strong className="text-foreground">Account information.</strong> Your
          name, email address, and password. Passwords are hashed by our
          authentication provider — we never see or store them in plain text.
        </p>
        <p>
          <strong className="text-foreground">Business data you enter.</strong>{' '}
          Clients and their contact details, proposals, invoices, recurring
          schedules, notes, email templates, and follow-up history. This
          includes personal information about your clients (names, email
          addresses) that you choose to store. You are responsible for having a
          lawful basis to store your clients&apos; information.
        </p>
        <p>
          <strong className="text-foreground">Usage records.</strong> Activity
          events inside your workspace (for example, &quot;follow-up email
          sent&quot;) that power the activity feed and rate limiting, and
          standard technical logs (IP address, browser type) kept by our hosting
          provider for security and debugging.
        </p>
        <p>
          <strong className="text-foreground">What we do not collect:</strong>{' '}
          we do not process or store payment card details, bank credentials, or
          client funds, and we do not use advertising trackers or analytics
          cookies.
        </p>
      </Section>

      <Section title="2. How your data is stored and protected">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            All data is stored in a managed PostgreSQL database (Supabase) and
            is encrypted at rest and in transit (HTTPS/TLS everywhere,
            enforced with HTTP Strict Transport Security).
          </li>
          <li>
            Every workspace is isolated with database-level row security
            policies: your data is only readable by members of your workspace,
            enforced by the database itself, not just the application.
          </li>
          <li>
            Authentication is handled by Supabase Auth with secure, HTTP-only
            session cookies.
          </li>
          <li>
            The application enforces rate limiting and input limits to protect
            against abuse.
          </li>
        </ul>
        <p>
          No system is perfectly secure, but if we learn of a breach affecting
          your personal data, we will notify you without undue delay.
        </p>
      </Section>

      <Section title="3. Services we rely on (subprocessors)">
        <p>
          We share data with a small number of service providers, only as
          needed to run the product:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Supabase</strong> — database and
            authentication (stores all account and business data).
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> — application
            hosting and delivery.
          </li>
          <li>
            <strong className="text-foreground">OpenAI</strong> — only when you
            click to generate an AI email draft, the relevant context (client
            name, invoice or proposal details, your chosen tone) is sent to
            OpenAI&apos;s API to produce the draft. Under OpenAI&apos;s API
            terms, this data is not used to train their models.
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> — email
            delivery, only when you send a follow-up email through the
            platform.
          </li>
          <li>
            <strong className="text-foreground">Google</strong> — only if you
            explicitly connect your Gmail account for sending (optional
            feature; see section 4).
          </li>
        </ul>
        <p>We never sell your data to anyone, for any purpose.</p>
      </Section>

      <Section title="4. Google user data (optional Gmail connection)">
        <p>
          If you choose to connect a Gmail account, we store the OAuth tokens
          Google issues so we can send emails on your behalf, and your Gmail
          address so we can show you which account is connected. We request
          only the permission to send email (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">gmail.send</code>
          ) — we cannot read your inbox. Tokens are stored encrypted at rest,
          are accessible only to your user account, and are deleted when you
          disconnect Gmail or delete your account.
        </p>
        <p>
          CashFlow Copilot&apos;s use and transfer of information received from
          Google APIs adheres to the{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>
          We use only essential cookies: the session cookies required to keep
          you signed in. We do not use advertising, analytics, or cross-site
          tracking cookies, which is why you do not see a cookie consent
          banner.
        </p>
      </Section>

      <Section title="6. How long we keep data">
        <p>
          We keep your data for as long as your account is active. When you
          delete individual records (clients, invoices, proposals), they are
          removed from the live database. When your account or workspace is
          deleted, all associated business data is deleted with it; residual
          copies in encrypted backups expire on the backup provider&apos;s
          rotation schedule.
        </p>
      </Section>

      <Section title="7. Your rights and choices">
        <p>Wherever you are located, we extend the same rights to you:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Access &amp; portability</strong> — export
            your clients, proposals, and invoices at any time with the built-in
            CSV export.
          </li>
          <li>
            <strong className="text-foreground">Correction</strong> — edit any
            record directly in the app.
          </li>
          <li>
            <strong className="text-foreground">Deletion</strong> — delete
            individual records in the app, or email us to permanently delete
            your entire account and workspace. We complete deletion requests
            within 30 days.
          </li>
          <li>
            <strong className="text-foreground">Objection or complaint</strong> — contact
            us with any concern; if you are in the EU/UK you may also lodge a
            complaint with your local data protection authority.
          </li>
        </ul>
        <p>
          For any of these, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>{' '}
          from the address on your account.
        </p>
      </Section>

      <Section title="8. Your clients' data">
        <p>
          When you store information about your clients in the Service, you are
          the data controller for that information and we process it on your
          instructions. If one of your clients asks you to delete their
          information, you can do so directly in the app; deleting a client
          removes their contact details from your workspace.
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          The Service is for business use and is not directed at children. We
          do not knowingly collect personal information from anyone under 16.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          If we make material changes to this policy, we will update the
          effective date above and take reasonable steps to notify you before
          the changes take effect.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Privacy questions or requests:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          . See also our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </Section>
    </article>
  )
}
