import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabase, isValidId, toSubmission } from '@/lib/supabase';
import { canEditSubmission } from '@/lib/auth';
import EditSubmissionClient from './EditSubmissionClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSubmissionPage({ params }: PageProps) {
  const { id } = await params;

  // Check authentication
  const authResult = await auth();
  const userId = authResult.userId;

  if (!userId) {
    redirect('/sign-in');
  }

  // Validate ID
  if (!isValidId(id)) {
    redirect('/map');
  }

  // Check if user can edit this submission
  const canEdit = await canEditSubmission(userId, id);
  if (!canEdit) {
    redirect('/map');
  }

  // Fetch submission data
  const { data: row, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !row) {
    redirect('/map');
  }

  const s = toSubmission(row);
  const submissionData = {
    _id: s._id,
    plantName: s.plantName,
    scientificName: s.scientificName ?? undefined,
    lat: s.lat,
    lng: s.lng,
    timestamp: s.timestamp,
    notes: s.notes ?? undefined,
    imageData: s.imageData ?? undefined,
  };

  return <EditSubmissionClient submission={submissionData} />;
}
