import { render, screen } from '@testing-library/react'
import Home from '../page'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, priority, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Home Page', () => {
  it('renders the main heading "Swamp Spotter"', () => {
    render(<Home />)
    expect(screen.getByText(/Swamp Spotter/i)).toBeInTheDocument()
  })

  it('renders the hero section with key features', () => {
    render(<Home />)
    expect(screen.getByText(/Community-powered invasive plant observations/i)).toBeInTheDocument()
  })

  it('renders the "Submit a Sighting" CTA button', () => {
    render(<Home />)
    const submitButton = screen.getByRole('link', { name: /submit a sighting/i })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('href', '/submit')
  })

  it('renders the "Browse the ID Guide" CTA button', () => {
    render(<Home />)
    const guideButton = screen.getByRole('link', { name: /browse the id guide/i })
    expect(guideButton).toBeInTheDocument()
    expect(guideButton).toHaveAttribute('href', '/guide')
  })

  it('renders feature highlights', () => {
    render(<Home />)
    expect(screen.getByText(/Fast submissions/i)).toBeInTheDocument()
    expect(screen.getByText(/Clean plant guide/i)).toBeInTheDocument()
    expect(screen.getByText(/Map-ready data/i)).toBeInTheDocument()
  })

  it('renders the main purpose description', () => {
    render(<Home />)
    expect(screen.getByText(/Discover, identify, and document plants/i)).toBeInTheDocument()
  })

  it('renders slideshow captions (at least the first one)', () => {
    render(<Home />)
    expect(screen.getByText(/Spot plants in Alachua County parks/i)).toBeInTheDocument()
  })
})
