import { render, screen } from '@testing-library/react'
import SignInPage from '../page'

jest.mock('@clerk/nextjs', () => ({
  SignIn: ({ appearance }: any) => (
    <div data-testid="clerk-sign-in">
      <div className={appearance?.elements?.rootBox || ''}>
        <div className={appearance?.elements?.card || ''}>
          Clerk Sign In Component
        </div>
      </div>
    </div>
  ),
  useUser: () => ({
    isSignedIn: false,
    isLoaded: true,
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}))

describe('Sign In Page', () => {
  it('renders the main heading', () => {
    render(<SignInPage />)
    expect(screen.getByText(/Welcome back to/i)).toBeInTheDocument()
    expect(screen.getByText(/Swamp Spotter/i)).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<SignInPage />)
    expect(screen.getByText(/Sign in to submit and manage plant sightings/i)).toBeInTheDocument()
  })

  it('renders the Clerk SignIn component', () => {
    render(<SignInPage />)
    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument()
  })

  it('renders the page with proper styling classes', () => {
    const { container } = render(<SignInPage />)
    const mainDiv = container.querySelector('div[class*="bg-gradient-to-b"]')
    expect(mainDiv).toBeInTheDocument()
  })

  it('shows the sign-in form for signed-out users', () => {
    render(<SignInPage />)
    expect(screen.getByText(/Clerk Sign In Component/i)).toBeInTheDocument()
  })
})
