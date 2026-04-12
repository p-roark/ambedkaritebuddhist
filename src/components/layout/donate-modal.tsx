'use client'

import { useEffect, useState } from 'react'

const INTERAC_EMAIL = 'ambedkaritebuddhist@outlook.com'

interface DonationObjective {
  id: string
  title: string
  description: string
  targetAmount: number  // cents
  currentAmount: number // cents
  active: boolean
  displayOrder: number
}

interface DonateModalProps {
  open: boolean
  onClose: () => void
}

function formatCAD(cents: number) {
  return `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  if (target <= 0) return null
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{formatCAD(current)} raised</span>
        <span>Goal: {formatCAD(target)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-saffron rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-0.5 text-right">{pct}% funded</p>
    </div>
  )
}

export function DonateModal({ open, onClose }: DonateModalProps) {
  const [objectives, setObjectives] = useState<DonationObjective[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select')

  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('select')
    setSelectedId(null)
    setError('')
    fetch('/api/donations')
      .then((r) => r.json() as Promise<{ objectives: DonationObjective[] }>)
      .then((d) => setObjectives(d.objectives ?? []))
      .catch(() => {})
  }, [open])

  // Trap focus when open
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const selectedObjective = objectives.find((o) => o.id === selectedId) ?? null

  const handleProceed = () => {
    if (!selectedId && objectives.length > 0) {
      setError('Please select a donation objective.')
      return
    }
    setError('')
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const amountNum = parseFloat(amount)
    if (!donorName.trim()) { setError('Name is required.'); return }
    if (!donorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) { setError('Valid email is required.'); return }
    if (!amount || isNaN(amountNum) || amountNum < 1) { setError('Please enter an amount of at least $1.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectiveId: selectedId,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim() || null,
          amount: amountNum,
          message: message.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = (await res.json()) as { error?: string }
        setError(d.error ?? 'Submission failed. Please try again.')
        return
      }
      setStep('success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Donate"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-text-dark">🪷 Make a Donation</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Step: Select objective */}
          {step === 'select' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Select a cause you'd like to support. Donations are made via <strong>Interac e-Transfer</strong> to{' '}
                <span className="text-primary-blue font-medium">{INTERAC_EMAIL}</span>.
              </p>

              {objectives.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-3">☸️</p>
                  <p className="text-sm">No active donation campaigns at the moment. Please check back soon.</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => { setSelectedId(obj.id); setError('') }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                        selectedId === obj.id
                          ? 'border-primary-saffron bg-amber-50'
                          : 'border-gray-200 hover:border-primary-saffron/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          selectedId === obj.id ? 'border-primary-saffron bg-primary-saffron' : 'border-gray-300'
                        }`}>
                          {selectedId === obj.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-dark">{obj.title}</p>
                          {obj.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{obj.description}</p>
                          )}
                          {obj.targetAmount > 0 && (
                            <ProgressBar current={obj.currentAmount} target={obj.targetAmount} />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

              {objectives.length > 0 && (
                <button
                  onClick={handleProceed}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-primary-saffron hover:bg-primary-saffron/90 transition-colors"
                >
                  Continue →
                </button>
              )}
            </>
          )}

          {/* Step: Donor form */}
          {step === 'form' && (
            <>
              {selectedObjective && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Donating towards</p>
                  <p className="font-semibold text-text-dark mt-0.5">{selectedObjective.title}</p>
                </div>
              )}

              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
                <p className="font-semibold mb-1">📧 How to send your donation</p>
                <p>After submitting this form, please send your Interac e-Transfer to:</p>
                <p className="font-bold mt-1 break-all">{INTERAC_EMAIL}</p>
                <p className="mt-1 text-xs text-blue-700">Use your name as the message/note in the transfer.</p>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1" htmlFor="donor-name">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donor-name"
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-saffron focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1" htmlFor="donor-email">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donor-email"
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-saffron focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1" htmlFor="donor-phone">
                    Phone (optional)
                  </label>
                  <input
                    id="donor-phone"
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-saffron focus:border-transparent"
                    placeholder="+1 (xxx) xxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1" htmlFor="donor-amount">
                    Amount (CAD $) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donor-amount"
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-saffron focus:border-transparent"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1" htmlFor="donor-message">
                    Message (optional)
                  </label>
                  <textarea
                    id="donor-message"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-saffron focus:border-transparent resize-none"
                    placeholder="Any message for the community..."
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('select'); setError('') }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-primary-saffron hover:bg-primary-saffron/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🙏</div>
              <h3 className="text-xl font-bold text-text-dark mb-2">Thank you for your generosity!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please complete your donation by sending an Interac e-Transfer to:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
                <p className="font-bold text-primary-blue text-base break-all">{INTERAC_EMAIL}</p>
                <p className="text-xs text-blue-700 mt-1">Use your name as the message in the transfer.</p>
              </div>
              {selectedObjective && (
                <p className="text-sm text-gray-500 mb-4">
                  Towards: <span className="font-medium text-text-dark">{selectedObjective.title}</span>
                </p>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-white bg-primary-blue hover:bg-primary-blue/90 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
