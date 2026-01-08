import { redirect } from "next/navigation";

function generateDocumentId() {
    return crypto.randomUUID();
}

export default function NoteTogetherEntry() {
    const  documentId = generateDocumentId();
    redirect(`document/${documentId}`);
}
