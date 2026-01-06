import { redirect } from "next/navigation";

function generatePageId() {
    return crypto.randomUUID();
}

export default function NoteTogetherEntry() {
    const pageId = generatePageId();
    redirect(`page/${pageId}`);
}
