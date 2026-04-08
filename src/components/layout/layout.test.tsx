import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Layout } from './layout'
import { ThemeProvider } from '../../contexts/theme-context'
import { AuthProvider } from '../../contexts/auth-context'
import { CartProvider } from '../../contexts/cart-context'
import { WishlistProvider } from '../../contexts/wishlist-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Ensure we don't fetch anything during tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
)

describe('Layout Component', () => {
  it('renders the skip to content link', () => {
    render(
      <MockProviders>
        <Layout>
          <div>Page Content</div>
        </Layout>
      </MockProviders>
    )
    
    const skipLink = screen.getByText(/skip to main content/i)
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('renders the layout children correctly', () => {
    render(
      <MockProviders>
        <Layout>
          <div data-testid="page-content">Test Body Content</div>
        </Layout>
      </MockProviders>
    )
    
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
    expect(screen.getByText('Test Body Content')).toBeInTheDocument()
  })
})
