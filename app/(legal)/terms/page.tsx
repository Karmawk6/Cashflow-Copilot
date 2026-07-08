import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL, EFFECTIVE_DATE } from '../legal-info'

export const metadata: Metadata = {
  title: 'Terms & Conditions — CashFlow Copilot',
  description: 'The terms that govern your use of CashFlow Copilot.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>

      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of CashFlow
        Copilot (the &quot;Service&quot;), a tool that helps consultants and agencies
        track clients, proposals, and invoices and draft follow-up emails. By
        creating an account or using the Service, you agree to these Terms. If
        you do not agree, do not use the Service.
      </p>

      <Section title="1. Your account">
        <p>
          You must provide accurate information when creating an account and
          keep your password secure. You are responsible for all activity that
          happens under your account. You must be at least 16 years old and
          using the Service for business purposes.
        </p>
        <p>
          If you join or create a shared workspace, members of that workspace
          can see the business data (clients, proposals, invoices, follow-ups)
          stored in it. Only invite people you trust with that information.
        </p>
      </Section>

      <Section title="2. Your data belongs to you">
        <p>
          You retain full ownership of everything you enter into the Service —
          your clients, contacts, proposals, invoices, notes, and templates
          (&quot;Your Content&quot;). We claim no rights over Your Content except the
          limited permission needed to store it, display it back to you, and
          operate the features you use (for example, generating a draft email
          from an invoice&apos;s details). You can export your data at any time
          using the built-in CSV export.
        </p>
      </Section>

      <Section title="3. Emails you send">
        <p>
          The Service drafts follow-up emails, but <strong>you</strong> review
          and send them, and you are the sender of record. You are responsible
          for ensuring your emails comply with the laws that apply to you and
          your recipients (such as CAN-SPAM, CASL, or GDPR), that you have a
          lawful basis to contact your recipients, and that the content of your
          emails is accurate and appropriate.
        </p>
      </Section>

      <Section title="4. AI-drafted content">
        <p>
          Email drafts may be generated with the help of artificial
          intelligence. Drafts are suggestions only: they may contain errors,
          and you must review every draft before sending it. We are not
          responsible for the consequences of emails you choose to send.
        </p>
      </Section>

      <Section title="5. We never touch your money">
        <p>
          CashFlow Copilot does not process, hold, or transfer payments. Any
          payment links included in your emails are your own, provided by you,
          and payments happen entirely between you and your clients. Invoice
          amounts and statuses in the Service are records you maintain — they
          are not financial or legal advice, and we do not guarantee that any
          invoice will be paid.
        </p>
      </Section>

      <Section title="6. Acceptable use">
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>send spam, harassment, or deceptive or unlawful messages;</li>
          <li>store or transmit content you have no right to use;</li>
          <li>attempt to access other users&apos; data or probe, disrupt, or overload the Service;</li>
          <li>resell or provide the Service to third parties without our permission.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules or put
          the Service or other users at risk.
        </p>
      </Section>

      <Section title="7. Service availability and changes">
        <p>
          The Service is provided on an early-access basis. We work to keep it
          available and reliable, but we do not guarantee uninterrupted
          operation, and we may add, change, or remove features at any time. We
          will make reasonable efforts to notify you of material changes that
          affect your use of the Service.
        </p>
      </Section>

      <Section title="8. Termination">
        <p>
          You can stop using the Service and request deletion of your account
          and data at any time by emailing{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          . We may suspend or terminate your access if you materially violate
          these Terms. Upon termination, we will delete Your Content in
          accordance with our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </Section>

      <Section title="9. Disclaimer of warranties">
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available,&quot;
          without warranties of any kind, express or implied, including
          warranties of merchantability, fitness for a particular purpose, and
          non-infringement. The Service provides organizational tooling — it is
          not legal, financial, accounting, or debt-collection advice.
        </p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law, CashFlow Copilot and its
          operators will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or for lost profits, revenue,
          data, or business opportunities, arising from your use of the
          Service. Our total liability for any claim relating to the Service is
          limited to the amount you paid us for the Service in the twelve
          months before the claim (or US $50 if you paid nothing).
        </p>
      </Section>

      <Section title="11. Changes to these Terms">
        <p>
          We may update these Terms from time to time. When we make material
          changes, we will update the effective date above and take reasonable
          steps to notify you, such as an in-app notice or email. Continuing to
          use the Service after changes take effect means you accept the
          updated Terms.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these Terms? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </article>
  )
}
