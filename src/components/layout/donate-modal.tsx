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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-primary-blue to-accent-purple flex justify-between items-start gap-3 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-0.5">Support Our Community</p>
            <h2 className="text-base sm:text-xl font-bold text-white leading-snug">🪷 Make a Donation</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white text-2xl font-semibold leading-none flex-shrink-0 mt-0.5"
          >×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 sm:px-8 py-5 sm:py-6 space-y-5">
          {/* Step: Select objective */}
          {step === 'select' && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-primary-blue flex-shrink-0" />
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Select a Cause</h4>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">💛 Donation Method: Interac e-Transfer</p>
                <p className="text-sm text-amber-900">Send your transfer to <span className="font-bold">{INTERAC_EMAIL}</span> — instructions will follow after you submit.</p>
              </div>

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
                          ? 'border-primary-blue bg-blue-50'
                          : 'border-gray-200 hover:border-primary-blue/40 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          selectedId === obj.id ? 'border-primary-blue bg-primary-blue' : 'border-gray-300'
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
                  className="w-full py-3 rounded-xl font-semibold text-white bg-primary-blue hover:bg-primary-blue/90 transition-colors"
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
                <div className="mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-primary-saffron flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Donating towards</p>
                    <p className="font-semibold text-text-dark">{selectedObjective.title}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-primary-blue flex-shrink-0" />
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Donation Instructions</h4>
                </div>
                <ol className="space-y-2 mb-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-saffron text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-sm text-gray-700 pt-0.5">Fill out the donation form.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-saffron text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-sm text-gray-700 pt-0.5">Open your banking app and send an Interac e-Transfer to: <strong>{INTERAC_EMAIL}</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-saffron text-white flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-sm text-gray-700 pt-0.5">In the message/note field, include your full name and <strong>"ABCC Donation."</strong></span>
                  </li>
                </ol>
                <p className="text-xs text-gray-600 pt-3 border-t border-blue-200">You'll receive a confirmation email from ABCC once your donation is received.</p>
              </div>
              <form onSubmit={(e) => { handleSubmit(e).catch((err: unknown) => { console.error(err); setError('Unexpected error. Please try again.'); }) }} className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-primary-blue flex-shrink-0" />
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Your Details</h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" htmlFor="donor-name">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donor-name"
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" htmlFor="donor-email">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donor-email"
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" htmlFor="donor-phone">
                    Phone (optional)
                  </label>
                  <input
                    id="donor-phone"
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                    placeholder="+1 (xxx) xxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" htmlFor="donor-amount">
                    Amount (CAD $) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donor-amount"
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5" htmlFor="donor-message">
                    Message (optional)
                  </label>
                  <textarea
                    id="donor-message"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition resize-none"
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
                    className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-primary-blue hover:bg-primary-blue/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit Donation'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <>
            <div className="py-4">
              <div className="text-center mb-5">
                <div className="text-5xl mb-3">🙏</div>
                <h3 className="text-xl font-bold text-text-dark mb-1">Thank you for your generosity!</h3>
                <p className="text-sm text-gray-500">Your donation record has been submitted.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">Next Step — Send your Interac e-Transfer</p>
                <p className="text-sm text-amber-900 mb-2">Transfer your donation to:</p>
                <p className="font-bold text-amber-900 text-base break-all mb-2">{INTERAC_EMAIL}</p>
                <p className="text-xs text-amber-700">Use your full name as the message/note in the transfer so we can match it.</p>
              </div>
              {selectedObjective && (
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Towards: <span className="font-medium text-text-dark">{selectedObjective.title}</span>
                </p>
              )}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-white bg-primary-blue hover:bg-primary-blue/90 transition-colors"
              >
                Done
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
