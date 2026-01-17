import { randomColor, randomUserName } from "@/utils/random";

export type UserInfo = {
    name: string;
    color: string;
};

export type ClientData = {
    user: UserInfo;
    documents: string[];
};

const LOCAL_STORAGE_KEY = "noteTogetherClientData";
const MAX_DOCS = 20;

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

function createUser(): UserInfo {
    return {
        name: randomUserName(),
        color: randomColor(),
    };
}

export function getOrCreateClientData(): ClientData {
    if (!isBrowser()) {
        return {
            user: { name: "", color: "" },
            documents: [],
        };
    }

    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (stored) {
            const parsed = JSON.parse(stored);

            const data: ClientData = {
                user: parsed.user ?? createUser(),
                documents: Array.isArray(parsed.documents)
                    ? parsed.documents
                    : [],
            };

            localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(data)
            );

            return data;
        }
    } catch {
        // 에러 발생 시 데이터 지우고 새로 생성
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    const data: ClientData = {
        user: createUser(),
        documents: [],
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return data;
}

export function addDocumentId(documentId: string) {
    if (!isBrowser()) return;

    const data = getOrCreateClientData();

    data.documents = [
        documentId,
        ...data.documents.filter(id => id !== documentId),
    ].slice(0, MAX_DOCS);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function removeDocumentId(documentId: string) {
    if (!isBrowser()) return;

    const data = getOrCreateClientData();

    data.documents = data.documents.filter(id => id !== documentId);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function getLastOpenedDocument(): string | null {
    const data = getOrCreateClientData();
    if (data.documents.length === 0) return null;
    return data.documents[data.documents.length - 1];
}

export function getUserInfo(): UserInfo {
    return getOrCreateClientData().user;
}

export function getDocuments(): string[] {
    return getOrCreateClientData().documents;
}