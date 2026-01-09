"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { getOrCreateClientData, addDocument, getUserInfo } from "@/lib/clientStorage/clientData";
import { useDocumentStore } from "@/store/useDocumentStore";
import { DocumentData } from "@/lib/document";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import ImageResize from "tiptap-extension-resize-image";
import { common, createLowlight } from "lowlight";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toolbar from "@/components/Toolbar";
import { createYjs, sendYjsCommand } from "@/lib/yjs/createYjs";
import { useToolBarHeightStore } from "@/store/useToolBarHeightStore";
import styles from "@/styles/pages/_noteTogether.module.scss";

type DocumentClientProps = {
    document: DocumentData;
};

const lowlight = createLowlight(common);

const CustomTextStyle = TextStyle.extend({
    addAttributes() {
        return {
        fontSize: {
            default: null,
            parseHTML: el => el.style.fontSize.replace("px", "") || null,
            renderHTML: attrs => ({ style: `font-size: ${attrs.fontSize || 14}px` }),
        },
        };
    },
});

export default function DocumentClient({ document }: DocumentClientProps) {
    const router = useRouter();
    const { setDocument } = useDocumentStore();
    const { useToolBarHeightState } = useToolBarHeightStore();

    const user = useMemo(() => getUserInfo(), []);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [title, setTitle] = useState<string>("");
    const [onlineUsers, setOnlineUsers] = useState<{ name: string; color: string; cursor?: number | null }[]>([]);
    const yjsRef = useRef<{
        doc: Y.Doc;
        provider: HocuspocusProvider;
        title: Y.Text;
        content: Y.XmlFragment;
    } | null>(null);

    useEffect(() => {
        setDocument(document);
    }, [document, setDocument]);

    useEffect(() => {
        addDocument(document.id);

        const initDocument = async () => {
        yjsRef.current = createYjs(document.id);
        const { provider, title: yTitle, content } = yjsRef.current;

        if (provider.awareness) {
            provider.awareness.setLocalStateField("user", { ...user, cursor: null });
        }

        yTitle.doc?.transact(() => {
            yTitle.delete(0, yTitle.length);
            yTitle.insert(0, document.title || "");
        });

        setTitle(yTitle.toString());
        const titleObserver = () => setTitle(yTitle.toString());
        yTitle.observe(titleObserver);

        const newEditor = new Editor({
            extensions: [
                StarterKit.configure({ history: false }),
                Collaboration.configure({ document: yjsRef.current.doc, fragment: content }),
                CollaborationCursor.configure({ provider, user }),
                TextStyle,
                CustomTextStyle,
                Color,
                ListItem,
                CodeBlockLowlight.configure({ lowlight }),
                Highlight.configure({ multicolor: true }),
                Underline,
                Image.configure({ inline: true, allowBase64: true }),
                ImageResize,
                StarterKit.configure({
                    bulletList: { keepMarks: true, keepAttributes: false },
                    orderedList: { keepMarks: true, keepAttributes: false },
                }),
                Link.configure({ openOnClick: true, autolink: true }),
                Table.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
                TaskList,
                TaskItem.configure({ nested: true }),
            ],
            onCreate({ editor }) {
                if (content.length > 0) return;

                if (document.yjs_state) {
                    editor.commands.setContent(document.yjs_state);
                }
            },
        });

        setEditor(newEditor);

        return () => {
            newEditor.destroy();
            yTitle.unobserve(titleObserver);
            yjsRef.current?.provider.destroy();
            yjsRef.current?.doc.destroy();
        };
        };

        initDocument();
    }, [user, router, document]);

    const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!editor) return;
        if (e.key === "Enter") {
            e.preventDefault();
            editor.commands.focus();
        }
    };

    useEffect(() => {
        if (!yjsRef.current) return;

        const interval = setInterval(async () => {
        try {
                await sendYjsCommand(yjsRef.current!.provider, { type: "SAVE", title });
            } catch {
                console.log("자동 저장 실패. 네트워크 상태를 확인하세요.");
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [title]);

    useEffect(() => {
        if (!yjsRef.current) return;

        const provider = yjsRef.current.provider;
        if (!provider) return;

        const handleStatus = (event: { status: "connected" | "disconnected" | "connecting" }) => {
            // if (event.status === "disconnected") {
            //     alert("문서가 삭제되었거나 서버 연결이 끊겼습니다.");
            //     notFound();
            // }
        };

        provider.on("status", handleStatus);

        return () => {
            provider.off("status", handleStatus);
        };
    }, [router]);

    useEffect(() => {
        if (!yjsRef.current) return;

        const provider = yjsRef.current.provider;
        if (!provider) return;

        const handleStateless = (message: { type: string }) => {
        if (message.type === "DELETED") {
            alert("문서가 삭제되어 퇴장합니다.");
            notFound();
        }
        };

        const listener = (event: string | Uint8Array) => {
        try {
            const message = JSON.parse(
                typeof event === "string" ? event : new TextDecoder().decode(event)
            );
            handleStateless(message);
        } catch (err) {
            console.error("Failed to parse stateless message:", err);
        }
        };

        provider.on("stateless", listener);

        return () => {
            provider.off("stateless", listener);
        };
    }, [router]);

    useEffect(() => {
        if (!yjsRef.current) return;
        const provider = yjsRef.current.provider;
        if (!provider || !provider.awareness) return;

        const updateUsers = () => {
        const states = Array.from(provider.awareness!.getStates().values())
            .map((s: any) => s.user)
            .filter(Boolean);
        setOnlineUsers(states);
        };

        provider.awareness.on("change", updateUsers);
        updateUsers();

        return () => {
            provider.awareness?.off("change", updateUsers);
        };
    }, [user, editor]);

    useEffect(() => {
        if (!editor || !yjsRef.current?.provider?.awareness || !user) return;

        const updateCursor = () => {
            const pos = editor.state.selection.anchor;
            yjsRef.current!.provider!.awareness!.setLocalStateField("user", {
                name: user.name,
                color: user.color,
                cursor: pos,
            });
        };

        editor.on("selectionUpdate", updateCursor);

        return () => {
            editor.off("selectionUpdate", updateCursor);
        };
    }, [editor, user]);

    const handleNewDocument = () => {
        const newId = crypto.randomUUID();
        const clientData = getOrCreateClientData();
        clientData.documents.unshift(newId);
        localStorage.setItem("noteTogetherClientData", JSON.stringify(clientData));
        router.push(`/document/${newId}`);
    };

    const handleSave = async () => {
        if (!yjsRef.current) return;
        try {
            await sendYjsCommand(yjsRef.current!.provider, { type: "SAVE", title });
            alert("저장 완료");
        } catch {
            alert("저장 실패");
        }
    };

    const handleDelete = async () => {
        if (!yjsRef.current) return;
        if (!confirm("문서를 삭제하면 모든 사용자가 퇴장됩니다. 계속할까요?")) return;

        try {
            await sendYjsCommand(yjsRef.current.provider, { type: "DELETE" });

            const clientData = getOrCreateClientData();
            clientData.documents = clientData.documents.filter(doc => doc !== document.id);
            localStorage.setItem("noteTogetherClientData", JSON.stringify(clientData));

            yjsRef.current.provider.sendStateless(JSON.stringify({ type: "DELETED" }));

            alert("문서가 삭제되었습니다.");
            notFound();
        } catch {
            alert("삭제 실패");
        }
    };

    return (
        <>
            <Header />
            <div className={styles.container} style={{ paddingTop: `calc(${useToolBarHeightState}px + 110px)` }}>
                <div className={styles.titleContainer}>
                    <input
                        type="text"
                        className={styles.editorTitle}
                        placeholder="제목 없음"
                        maxLength={50}
                        value={title}
                        onChange={e => {
                        const value = e.target.value;
                        setTitle(value);
                        if (yjsRef.current) {
                            const yTitle = yjsRef.current.title;
                            yTitle.doc?.transact(() => {
                            yTitle.delete(0, yTitle.length);
                            yTitle.insert(0, value);
                            });
                        }
                        }}
                        onKeyUp={handleEnter}
                    />
                    <button className={styles.linkCopyButton} onClick={() => navigator.clipboard.writeText(window.location.href)}>
                        링크 복사
                    </button>
                </div>

                <Toolbar editor={editor} />
                <EditorContent editor={editor} />

                <div className={styles.buttonContainer}>
                    <button className={styles.deleteButton} onClick={handleDelete}>삭제</button>
                    <button className={styles.saveButton} onClick={handleSave}>저장</button>
                    <button className={styles.saveButton} onClick={handleNewDocument}>새 문서</button>
                </div>
            </div>
            <Footer />
        </>
    );
}