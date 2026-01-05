"use client";
import { redirect } from "next/navigation";

function generateRoomId() {
    return crypto.randomUUID();
}

export default function NoteTogetherEntry() {
    const roomId = generateRoomId();
    redirect(`/${roomId}`);
}
