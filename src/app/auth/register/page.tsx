'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate referral code format
    if (!formData.referralCode.startsWith('BHIM-')) {
      setError('Referral code must start with BHIM-');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: formData.referralCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login?message=Registration successful, please login');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully. Redirecting to login page...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="auth-container flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-orange-50 pt-20">
        <div className="max-w-md w-full">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-3 font-poppins">
              Join Our Community
            </h2>
            <p className="text-text-medium text-lg">
              Create your account with a valid referral code
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-text-dark mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary-blue focus:bg-blue-50/30 transition-all"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-text-dark mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary-blue focus:bg-blue-50/30 transition-all"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-text-dark mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary-blue focus:bg-blue-50/30 transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-dark mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary-blue focus:bg-blue-50/30 transition-all"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Referral Code Field */}
              <div>
                <label htmlFor="referralCode" className="block text-sm font-semibold text-text-dark mb-2">
                  Referral Code <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary-blue focus:bg-blue-50/30 transition-all"
                  placeholder="e.g., BHIM-ABC-7K2M"
                  value={formData.referralCode}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-text-medium">
                  You must have a valid BHIM- prefixed referral code to register
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-blue text-white font-semibold rounded-lg hover:bg-primary-blue/90 focus:outline-none focus:ring-2 focus:ring-primary-blue/50 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-text-medium">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 border-2 border-primary-blue text-primary-blue font-semibold text-center rounded-lg hover:bg-blue-50 transition-all"
            >
              Sign In Here
            </Link>
          </div>

          {/* Footer Help */}
          <p className="text-center text-text-medium text-sm mt-6">
            Questions? <Link href="/contact" className="text-primary-blue font-semibold hover:underline">Contact us</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="auth-container flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-orange-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
            <p className="mt-4 text-text-medium">Loading registration form...</p>
          </div>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </>
  );
}