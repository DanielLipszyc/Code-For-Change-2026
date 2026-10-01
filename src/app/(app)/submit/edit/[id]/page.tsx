import { redirect } from "next/navigation";
import { getViewer } from "@/server/authz";
import { getSubmission } from "@/server/submissions";
import EditSubmissionClient from "./EditSubmissionClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubmissionPage({ params }: PageProps) {
  const { id } = await params;

  const viewer = await getViewer();
  if (!viewer.userId) redirect("/sign-in");

  // Only the submitter can edit (admins included: they can delete, not edit)
  const submission = await getSubmission(id, viewer);
  if (!submission || submission.userId !== viewer.userId) redirect("/map");

  return <EditSubmissionClient submission={submission} />;
}
