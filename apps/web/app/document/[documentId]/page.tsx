import { notFound } from "next/navigation";
import { fetchDocument } from "@/lib/document";
import DocumentClient from "./DocumentClient";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentPage({ params }: Props) {
  const { documentId } = await params;

  const document = await fetchDocument(documentId);

  if (!document) {
    notFound();
  }

  return <DocumentClient document={document} />;
}