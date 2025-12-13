import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-1000 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-24">
          <Link href="/" className="flex-shrink-0 font-poppins font-bold text-2xl md:text-3xl bg-gradient-primary bg-clip-text text-transparent">
            ABC Canada
          </Link>
        </div>
      </div>
    </nav>
  )
}
