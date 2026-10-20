'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { AddressSuggestion } from '@/lib/address-search';
import { useFeature } from '@/lib/use-feature';

interface AddressSearchProps {
  /** Called with the chosen address; the form fills its own fields */
  onSelect: (address: AddressSuggestion) => void;
  /** Called when the lookup service can't be reached, so the form can allow typing */
  onUnavailable?: () => void;
  inputClassName?: string;
}

type SearchState = 'idle' | 'searching' | 'done' | 'unavailable';

const DEBOUNCE_MS = 350;

/**
 * "Find your address" box: suggests real Canadian street addresses as the
 * member types and fills street, city and province. Hidden when the
 * Address search feature switch is off. Postal code and unit are still typed.
 */
export function AddressSearch({ onSelect, onUnavailable, inputClassName = '' }: AddressSearchProps) {
  const enabled = useFeature('addressLookup');
  const id = useId();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [chosen, setChosen] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  // Latest callback without re-running the search when the parent re-renders
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 5 || !/\d/.test(q) || q === chosen) {
      requestRef.current?.abort();
      return;
    }
    const timer = setTimeout(() => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setState('searching');
      fetch(`/api/address-search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => (res.ok ? (res.json() as Promise<{ suggestions: AddressSuggestion[]; unavailable?: boolean }>) : Promise.reject(new Error(String(res.status)))))
        .then((data) => {
          setSuggestions(data.suggestions);
          setState(data.unavailable ? 'unavailable' : 'done');
          if (data.unavailable) onUnavailableRef.current?.();
          setActive(data.suggestions.length > 0 ? 0 : -1);
          setOpen(true);
        })
        .catch((error: unknown) => {
          if ((error as { name?: string })?.name === 'AbortError') return;
          setSuggestions([]);
          setState('unavailable');
          onUnavailableRef.current?.();
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, chosen]);

  if (!enabled) return null;

  const choose = (suggestion: AddressSuggestion) => {
    onSelect(suggestion);
    setChosen(suggestion.label);
    setQuery(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    setState('idle');
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setChosen(null);
    const q = value.trim();
    if (q.length < 5 || !/\d/.test(q)) {
      setSuggestions([]);
      setOpen(false);
      setState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const listId = `${id}-list`;
  const showList = open && suggestions.length > 0;
  const status =
    chosen && query === chosen
      ? 'Address filled in below. Add your unit number (if any) and postal code.'
      : state === 'searching'
        ? 'Searching…'
        : state === 'unavailable'
          ? 'Address search isn’t available right now. Please type your address below.'
          : state === 'done' && suggestions.length === 0
            ? 'No matching street address found. Check the number and street name. If your address isn’t listed, please contact us.'
            : '';

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="mb-1 block text-sm font-medium text-slate-700">
        Find your address
      </label>
      <input
        id={`${id}-input`}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-describedby={`${id}-status`}
        autoComplete="off"
        placeholder="Start with your street number, e.g. 100 Queen St W"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={inputClassName}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching addresses"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.label}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(s)}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-3 text-sm text-text-dark ${i === active ? 'bg-blue-50' : ''}`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <p id={`${id}-status`} aria-live="polite" className="mt-1 min-h-[1.25rem] text-sm text-text-medium">
        {status}
      </p>
    </div>
  );
}
