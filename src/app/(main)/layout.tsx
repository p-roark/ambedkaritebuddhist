import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MembershipGate } from '@/components/auth/membership-gate'
import { AccountInactiveModal } from '@/components/auth/account-inactive-modal'

function UnderConstruction() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="text-5xl sm:text-7xl mb-6">☸️</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white font-poppins mb-4">
          Coming Soon
        </h1>
        <p className="text-white/80 text-lg leading-relaxed mb-8">
          We are building something meaningful for our community.<br />
          Please check back soon.
        </p>
        <div className="inline-block px-6 py-3 bg-primary-saffron text-text-dark font-bold rounded-lg text-sm">
          Ambedkarite Buddhist Community Of Canada
        </div>
        <p className="mt-6 text-white/60 text-sm">
          Questions? Write to us at{' '}
          <a href="mailto:info@ambedkaritebuddhist.org" className="text-primary-saffron hover:underline">
            info@ambedkaritebuddhist.org
          </a>
        </p>
      </div>
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  if (process.env.UNDER_CONSTRUCTION === 'true') {
    return <UnderConstruction />
  }

  return (
    <>
      <Header />
      <MembershipGate />
      <AccountInactiveModal />
      <main className="flex-grow min-h-screen bg-white text-text-dark pt-20">{children}</main>
      <Footer />
    </>
  )
}
