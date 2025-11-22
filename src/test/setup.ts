/**
 * Test setup file for Vitest
 */

import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string
    alt: string
    [key: string]: any
  }) => <img src={src} alt={alt} {...props} />,
}))

// Global test utilities
declare global {
  namespace Vi {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toBeVisible(): R
      toHaveClass(className: string): R
    }
  }
}
