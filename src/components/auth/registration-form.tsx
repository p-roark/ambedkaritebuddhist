'use client';

import { useRef, useState } from 'react';
import {
  AGE_CONFIRMATION_LABEL,
  BOARD_INTEREST_LABEL,
  DISCLAIMER_CHECKBOX_LABEL,
  DISCLAIMER_TITLE,
  PROVINCE_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
} from '@/lib/registration-config';
import { validateRegistration, type RegistrationFieldName } from '@/lib/registration';

export type RegistrationFormValues = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  residencyStatus: string;
};

interface RegistrationFormProps {
  initialValues: RegistrationFormValues;
  inviteCode: string | null;
  onSuccess: () => void | Promise<void>;
}

type FieldErrors = Partial<Record<RegistrationFieldName, string>>;
type Checkboxes = { ageConfirmed: boolean; boardInterest: boolean; disclaimerAccepted: boolean };

const inputClass =
  'w-full px-3 py-2.5 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors';

export function RegistrationForm({ initialValues, inviteCode, onSuccess }: RegistrationFormProps) {
  const [values, setValues] = useState(initialValues);
  const [checks, setChecks] = useState<Checkboxes>({ ageConfirmed: false, boardInterest: false, disclaimerAccepted: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const setField = (field: keyof RegistrationFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field as RegistrationFieldName]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setCheck = (field: keyof Checkboxes, checked: boolean) => {
    setChecks((prev) => ({ ...prev, [field]: checked }));
    if (field !== 'boardInterest' && errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const showErrors = (fieldErrors: FieldErrors, message: string) => {
    setErrors(fieldErrors);
    setFormError(message);
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...values, ...checks, code: inviteCode ?? undefined };

    const check = validateRegistration(payload);
    if (!check.ok) {
      showErrors(check.errors, 'Please correct the highlighted fields.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; fieldErrors?: FieldErrors };
      if (!res.ok) {
        showErrors(data.fieldErrors ?? {}, data.error ?? 'Registration failed. Please try again.');
        return;
      }
      await onSuccess();
    } catch {
      showErrors({}, 'Registration failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldProps = (field: RegistrationFieldName) => ({
    id: `reg-${field}`,
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `reg-${field}-error` : undefined,
  });

  const errorText = (field: RegistrationFieldName) =>
    errors[field] ? (
      <p id={`reg-${field}-error`} className="mt-1 text-sm text-red-700">
        {errors[field]}
      </p>
    ) : null;

  const borderClass = (field: RegistrationFieldName) => (errors[field] ? 'border-red-500' : 'border-slate-300');

  const label = (field: RegistrationFieldName, text: string, required = true) => (
    <label htmlFor={`reg-${field}`} className="mb-1 block text-sm font-medium text-slate-700">
      {text}
      {required && <span className="text-red-700" aria-hidden="true"> *</span>}
    </label>
  );

  const checkbox = (field: keyof Checkboxes, text: string, required: boolean) => {
    const id = `reg-${field}`;
    const error = field === 'boardInterest' ? undefined : errors[field];
    return (
      <div>
        <div className="flex items-start gap-3">
          <input
            id={id}
            type="checkbox"
            checked={checks[field]}
            onChange={(e) => setCheck(field, e.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="mt-1 h-5 w-5 shrink-0 rounded border-slate-400 text-primary-blue focus:ring-primary-blue"
          />
          <label htmlFor={id} className="text-sm font-medium text-text-dark">
            {text}
            {required && <span className="text-red-700" aria-hidden="true"> *</span>}
          </label>
        </div>
        {field !== 'boardInterest' && errorText(field)}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </div>
      )}

      <p className="text-sm text-text-medium">
        Fields marked <span className="text-red-700">*</span> are required.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {label('name', 'Full name')}
          <input {...fieldProps('name')} autoComplete="name" value={values.name} onChange={(e) => setField('name', e.target.value)} className={`${inputClass} ${borderClass('name')}`} />
          {errorText('name')}
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-slate-700">Email (from Google)</label>
          <input id="reg-email" value={values.email} readOnly className={`${inputClass} border-slate-200 bg-slate-50 text-slate-600`} />
        </div>
        <div className="md:col-span-2">
          {label('phone', 'Phone number')}
          <input {...fieldProps('phone')} type="tel" autoComplete="tel" placeholder="416-555-0123" value={values.phone} onChange={(e) => setField('phone', e.target.value)} className={`${inputClass} ${borderClass('phone')}`} />
          {errorText('phone')}
        </div>
        <div className="md:col-span-2">
          {label('addressLine1', 'Street address')}
          <input {...fieldProps('addressLine1')} autoComplete="address-line1" value={values.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} className={`${inputClass} ${borderClass('addressLine1')}`} />
          {errorText('addressLine1')}
        </div>
        <div className="md:col-span-2">
          {label('addressLine2', 'Apartment, unit, etc.', false)}
          <input {...fieldProps('addressLine2')} autoComplete="address-line2" value={values.addressLine2} onChange={(e) => setField('addressLine2', e.target.value)} className={`${inputClass} ${borderClass('addressLine2')}`} />
          {errorText('addressLine2')}
        </div>
        <div>
          {label('city', 'City')}
          <input {...fieldProps('city')} autoComplete="address-level2" value={values.city} onChange={(e) => setField('city', e.target.value)} className={`${inputClass} ${borderClass('city')}`} />
          {errorText('city')}
        </div>
        <div>
          {label('province', 'Province / territory')}
          <select {...fieldProps('province')} autoComplete="address-level1" value={values.province} onChange={(e) => setField('province', e.target.value)} className={`${inputClass} bg-white ${borderClass('province')}`}>
            <option value="">Select province or territory</option>
            {PROVINCE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {errorText('province')}
        </div>
        <div>
          {label('postalCode', 'Postal code')}
          <input {...fieldProps('postalCode')} autoComplete="postal-code" placeholder="M5V 2T6" value={values.postalCode} onChange={(e) => setField('postalCode', e.target.value.toUpperCase())} className={`${inputClass} uppercase ${borderClass('postalCode')}`} />
          {errorText('postalCode')}
        </div>
        <div>
          {label('residencyStatus', 'Residency status in Canada')}
          <select {...fieldProps('residencyStatus')} value={values.residencyStatus} onChange={(e) => setField('residencyStatus', e.target.value)} className={`${inputClass} bg-white ${borderClass('residencyStatus')}`}>
            <option value="">Select residency status</option>
            {RESIDENCY_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errorText('residencyStatus')}
        </div>
      </div>

      <div className="space-y-3">
        {checkbox('ageConfirmed', AGE_CONFIRMATION_LABEL, true)}
        {checkbox('boardInterest', BOARD_INTEREST_LABEL, false)}
      </div>

      <fieldset className={`rounded-2xl border p-4 ${errors.disclaimerAccepted ? 'border-red-500' : 'border-slate-200'} bg-background-light`}>
        <legend className="px-1 text-base font-semibold text-text-dark">{DISCLAIMER_TITLE}</legend>
        {checkbox('disclaimerAccepted', DISCLAIMER_CHECKBOX_LABEL, true)}
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="w-full md:w-auto px-8 py-3 rounded-xl bg-primary-blue text-white text-base font-bold hover:bg-primary-blue/90 disabled:opacity-60 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}
