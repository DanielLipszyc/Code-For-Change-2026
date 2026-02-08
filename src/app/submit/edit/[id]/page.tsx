import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
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

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    redirect('/map');
  }

  // Check if user can edit this submission
  const canEdit = await canEditSubmission(userId, id);
  if (!canEdit) {
    redirect('/map');
  }

  // Fetch submission data
  const db = await getDb();
  const submission = await db.collection('submissions').findOne({
    _id: new ObjectId(id),
  }) as {
    _id: ObjectId;
    plantName: string;
    scientificName?: string;
    lat: number;
    lng: number;
    timestamp: number;
    notes?: string;
    imageData?: string;
  } | null;

  if (!submission) {
    redirect('/map');
  }

  // Convert ObjectId to string for client component
  const submissionData = {
    ...submission,
    _id: submission._id.toString(),
  };

  return <EditSubmissionClient submission={submissionData} />;
}
