export interface PlantSubmission {
  id: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
}

// LocalStorage key for plant submissions
export const SUBMISSIONS_KEY = 'swamp-spotter-submissions';

// Get all submissions from localStorage
export function getSubmissions(): PlantSubmission[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SUBMISSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

// Add a new submission to localStorage
export function addSubmission(submission: PlantSubmission): void {
  const submissions = getSubmissions();
  submissions.push(submission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
}

// Clear all submissions from localStorage
export function clearSubmissions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SUBMISSIONS_KEY);
}
