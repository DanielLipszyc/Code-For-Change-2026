import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GuidePage from '../page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

jest.mock('@/lib/translation', () => ({
  translations: {
    en: {
      guide: {
        threatLevel: 'Threat level',
        quickId: 'Quick ID',
        tip: 'Look for:',
        whyItMattersTitle: 'Why it matters',
        whyItMattersBody: 'Invasive plants can spread quickly',
        whatToDoTitle: 'What to do if you find it',
        photoTip: 'Take a clear photo',
        locationTip: 'Note the location',
        avoidSpreading: 'Avoid spreading seeds',
        reportButton: 'Report this plant',
      },
    },
    es: {
      guide: {
        threatLevel: 'Nivel de amenaza',
        quickId: 'Identificación rápida',
        tip: 'Identificar por:',
        whyItMattersTitle: 'Por qué importa',
        whyItMattersBody: 'Las plantas invasoras pueden propagarse rápidamente',
        whatToDoTitle: 'Qué hacer si la encuentra',
        photoTip: 'Tome una foto clara',
        locationTip: 'Anote la ubicación',
        avoidSpreading: 'Evite propagar semillas',
        reportButton: 'Reportar esta planta',
      },
    },
  },
}))

describe('Guide Page', () => {
  it('renders the main heading', () => {
    render(<GuidePage />)
    expect(screen.getByText(/Alachua County Invasive Plant ID Guide/i)).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(<GuidePage />)
    const searchInput = screen.getByPlaceholderText(/Search plants/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('renders the language selector', () => {
    render(<GuidePage />)
    const languageSelect = screen.getAllByRole('combobox')[0]
    expect(languageSelect).toBeInTheDocument()
  })

  it('renders plant cards', () => {
    render(<GuidePage />)
    expect(screen.getByText(/Air Potato/i)).toBeInTheDocument()
    expect(screen.getByText(/Coral Adisia/i)).toBeInTheDocument()
    expect(screen.getByText(/Spanish Gold/i)).toBeInTheDocument()
  })

  it('renders scientific names on plant cards', () => {
    render(<GuidePage />)
    expect(screen.getByText(/Dioscorea bulbifera/i)).toBeInTheDocument()
    expect(screen.getByText(/Ardisia crenata/i)).toBeInTheDocument()
  })

  it('renders threat level badges', () => {
    render(<GuidePage />)
    const threatLevels = screen.getAllByText(/Threat level/i)
    expect(threatLevels.length).toBeGreaterThan(0)
  })

  it('allows filtering by search query', async () => {
    render(<GuidePage />)
    const searchInput = screen.getByPlaceholderText(/Search plants/i)

    fireEvent.change(searchInput, { target: { value: 'Air Potato' } })

    await waitFor(() => {
      expect(screen.getByText(/Air Potato/i)).toBeInTheDocument()
    })
  })

  it('allows language switching to Spanish', () => {
    render(<GuidePage />)
    const languageSelect = screen.getAllByRole('combobox')[0]

    fireEvent.change(languageSelect, { target: { value: 'es' } })

    expect(screen.getByText(/Guía de Identificación de Plantas Invasoras/i)).toBeInTheDocument()
  })

  it('renders filter controls', () => {
    render(<GuidePage />)
    expect(screen.getByText(/All threat levels/i)).toBeInTheDocument()
    expect(screen.getByText(/Sort: Threat/i)).toBeInTheDocument()
  })

  it('renders plant identification tips', () => {
    render(<GuidePage />)
    expect(screen.getByText(/pointed, heart-shaped leaves/i)).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<GuidePage />)
    expect(screen.getByText(/Search by common or scientific name/i)).toBeInTheDocument()
  })
})
