export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-text-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          {/* Logo/Name */}
          <div>
            <h3 className="font-poppins text-xl font-bold mb-2 text-primary-saffron">🪷 ABC Canada</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-noto-sans max-w-2xl mx-auto">
              Ambedkarite Buddhist Community in Canada - Fostering unity, education, and social welfare.
            </p>
          </div>

          {/* Contact */}
          <div className="pt-6 pb-6">
            <p className="text-gray-300 text-sm">
              Email: <a href="mailto:info@ambedkaritebuddhist.ca" className="hover:text-primary-saffron transition-colors">info@ambedkaritebuddhist.ca</a>
            </p>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 text-sm">
              © {currentYear} Ambedkarite Buddhist Organization Canada. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
