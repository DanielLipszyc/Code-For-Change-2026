import { render, screen } from '@testing-library/react'
import SignUpPage from '../page'

jest.mock('@clerk/nextjs', () => ({
  SignUp: ({ appearance }: any) => (
    <div data-testid="clerk-sign-up">
      <div className={appearance?.elements?.rootBox || ''}>
        <div className={appearance?.elements?.card || ''}>
          Clerk Sign Up Component
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

describe('Sign Up Page', () => {
  it('renders the main heading', () => {
    render(<SignUpPage />)
    expect(screen.getByText('Join')).toBeInTheDocument()
    expect(screen.getByText('Swamp Spotter')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<SignUpPage />)
    expect(screen.getByText(/Create an account to start contributing plant sightings/i)).toBeInTheDocument()
  })

  it('renders the Clerk SignUp component', () => {
    render(<SignUpPage />)
    expect(screen.getByTestId('clerk-sign-up')).toBeInTheDocument()
  })

  it('renders the page with proper styling classes', () => {
    const { container } = render(<SignUpPage />)
    const mainDiv = container.querySelector('div[class*="bg-gradient-to-b"]')
    expect(mainDiv).toBeInTheDocument()
  })

  it('shows the sign-up form for signed-out users', () => {
    render(<SignUpPage />)
    expect(screen.getByText(/Clerk Sign Up Component/i)).toBeInTheDocument()
  })
})
