import { render, screen } from '@testing-library/react'
import Map from '../page'

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: null,
    isLoaded: true,
  }),
}))

jest.mock('leaflet', () => ({}), { virtual: true })

jest.mock('../alachua.json', () => ({}), { virtual: true })

const mockGeolocation = {
  getCurrentPosition: jest.fn((success) =>
    success({
      coords: {
        latitude: 29.6516,
        longitude: -82.3250,
        accuracy: 10,
      },
    })
  ),
}

global.navigator.geolocation = mockGeolocation as any

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as any

describe('Map Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the main heading', () => {
    render(<Map />)
    expect(screen.getByText(/Alachua County Invasive Plant Map/i)).toBeInTheDocument()
  })

  it('renders the Export CSV button', () => {
    render(<Map />)
    const exportButton = screen.getByRole('button', { name: /export csv/i })
    expect(exportButton).toBeInTheDocument()
  })

  it('renders the Filter Sightings section', () => {
    render(<Map />)
    expect(screen.getByText(/Filter Sightings/i)).toBeInTheDocument()
  })

  it('renders filter controls (expandable)', () => {
    render(<Map />)
    expect(screen.getByText(/Click to expand filters/i)).toBeInTheDocument()
  })
})
