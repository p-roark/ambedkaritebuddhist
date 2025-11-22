import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-primary-saffron text-white hover:bg-opacity-90 focus-visible:ring-primary-saffron',
    secondary: 'bg-primary-blue text-white hover:bg-opacity-90 focus-visible:ring-primary-blue',
    outline: 'border-2 border-primary-saffron text-primary-saffron hover:bg-primary-saffron hover:text-white focus-visible:ring-primary-saffron',
    ghost: 'text-primary-saffron hover:bg-primary-saffron hover:bg-opacity-10 focus-visible:ring-primary-saffron',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  const finalClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`.trim()

  return (
    <button className={finalClassName} {...props}>
      {children}
    </button>
  )
}
