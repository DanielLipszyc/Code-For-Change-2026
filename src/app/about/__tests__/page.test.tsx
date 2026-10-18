import { render, screen } from '@testing-library/react'
import About from '../page'

describe('About Page', () => {
  it('renders the main heading "About Swamp Spotter"', () => {
    render(<About />)
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Swamp Spotter')).toBeInTheDocument()
  })

  it('renders the mission section', () => {
    render(<About />)
    expect(screen.getByText(/Our Mission/i)).toBeInTheDocument()
    expect(screen.getByText(/Making conservation accessible to everyone/i)).toBeInTheDocument()
  })

  it('renders the mission description', () => {
    render(<About />)
    expect(screen.getByText(/Swamp Spotter is designed to make environmental reporting accessible/i)).toBeInTheDocument()
  })

  it('renders the "Our Team" section', () => {
    render(<About />)
    expect(screen.getByText(/Our Team/i)).toBeInTheDocument()
    expect(screen.getByText(/A small group of builders focused on clarity/i)).toBeInTheDocument()
  })

  it('renders team member cards', () => {
    render(<About />)
    expect(screen.getByText(/Mia Camacho/i)).toBeInTheDocument()
    expect(screen.getByText(/Daniel Lipszyc/i)).toBeInTheDocument()
    expect(screen.getByText(/Jonathan Kissil/i)).toBeInTheDocument()
    expect(screen.getByText(/Rawan Hussain/i)).toBeInTheDocument()
  })

  it('renders team member roles', () => {
    render(<About />)
    const fullStackDevs = screen.getAllByText(/Full-Stack Developer/i)
    const designProduct = screen.getAllByText(/Design \/ Product/i)
    expect(fullStackDevs.length).toBeGreaterThan(0)
    expect(designProduct.length).toBeGreaterThan(0)
  })

  it('renders the "Tech Stack" section', () => {
    render(<About />)
    expect(screen.getByText(/Tech Stack/i)).toBeInTheDocument()
    expect(screen.getByText(/The tools and frameworks powering/i)).toBeInTheDocument()
  })

  it('renders tech stack items', () => {
    render(<About />)
    expect(screen.getByText(/Next.js \(App Router\)/i)).toBeInTheDocument()
    expect(screen.getByText(/React \+ TypeScript/i)).toBeInTheDocument()
    expect(screen.getByText(/Tailwind CSS/i)).toBeInTheDocument()
    const clerkItems = screen.getAllByText(/Clerk/i)
    const mongoItems = screen.getAllByText(/MongoDB/i)
    expect(clerkItems.length).toBeGreaterThan(0)
    expect(mongoItems.length).toBeGreaterThan(0)
  })

  it('renders tech stack badges', () => {
    render(<About />)
    const frontend = screen.getAllByText(/Frontend/i)
    const backend = screen.getAllByText(/Backend/i)
    const database = screen.getAllByText(/Database/i)
    const auth = screen.getAllByText(/Auth/i)
    expect(frontend.length).toBeGreaterThan(0)
    expect(backend.length).toBeGreaterThan(0)
    expect(database.length).toBeGreaterThan(0)
    expect(auth.length).toBeGreaterThan(0)
  })

  it('renders team member links', () => {
    render(<About />)
    const githubLinks = screen.getAllByText(/GitHub/i)
    const linkedinLinks = screen.getAllByText(/LinkedIn/i)
    expect(githubLinks.length).toBeGreaterThan(0)
    expect(linkedinLinks.length).toBeGreaterThan(0)
  })

  it('renders the footer message', () => {
    render(<About />)
    expect(screen.getByText(/Built with care for the environment/i)).toBeInTheDocument()
  })
})
