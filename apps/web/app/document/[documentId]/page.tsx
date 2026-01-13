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
import TextAlign from "@tiptap/extension-text-align";
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
import styles from "@/styles/pages/_noteTogether.module.scss";

type ConfirmAlertState = {
    open: boolean;
    message: string;
    onConfirm?: () => void;
};

const TITLE_MAX = 20;

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

export default function DocumentPage() {
    const router = useRouter();
    const { document, setDocument } = useDocumentStore();

    const user = useMemo(() => getUserInfo(), []);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [title, setTitle] = useState<string>("");
    const titleRef = useRef(title);
    const [onlineUsers, setOnlineUsers] = useState<{ name: string; color: string; cursor?: number | null }[]>([]);
    const yjsRef = useRef<{
        doc: Y.Doc;
        provider: HocuspocusProvider;
        title: Y.Text;
        content: Y.XmlFragment;
    } | null>(null);
    const [showAlert, setShowAlert] = useState<string>("");
    const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertState>({
        open: false,
        message: "",
    });

    useEffect(() => {
        if (document?.id === "" || !document?.id) {
            router.push("/");
            return;
        }
        
        setDocument(document);
        addDocument(document.id);

        const initDocument = async () => {
            yjsRef.current = createYjs(document.id);
            const { provider, title: yTitle, content, doc } = yjsRef.current;

            provider.awareness?.setLocalStateField("user", { ...user });

            const newEditor = new Editor({
                extensions: [
                    StarterKit.configure({ history: false }),
                    Collaboration.configure({ document: yjsRef.current.doc, fragment: content }),
                    CollaborationCursor.configure({ provider, user }),
                    TextStyle,
                    TextAlign.configure({
                        types: ["heading", "paragraph"],
                    }),
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

            const syncTitle = () => {
                const value = yTitle.toString().slice(0, TITLE_MAX);
                setTitle(value);
                titleRef.current = value;
            };

            yTitle.observe(syncTitle);
            syncTitle();

            return () => {
                newEditor.destroy();
                yTitle.unobserve(syncTitle);
                provider.destroy();
                yjsRef.current?.doc.destroy();
            };
        };

        initDocument();
    }, [user, router, document]);

    const handleLinkCopy = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setShowAlert("링크가 복사되었습니다.");
    }

    const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!editor) return;
        if (e.key === "Enter") {
            e.preventDefault();
            editor.commands.focus();
        }
    };

    const hasChangesRef = useRef(false);

    useEffect(() => {
      if (!yjsRef.current) return;

      const doc = yjsRef.current.doc;

      const onUpdate = () => {
        hasChangesRef.current = true;
      };

      doc.on("update", onUpdate);

      return () => {
        doc.off("update", onUpdate);
      };
    }, []);

    useEffect(() => {
        if (!yjsRef.current) return;

        const interval = setInterval(() => {
          if (!hasChangesRef.current) return;
          sendYjsCommand(yjsRef.current!.provider, {
              type: "SAVE",
              title: titleRef.current,
          }).catch(() => setShowAlert("자동 저장에 실패하였습니다."));
          hasChangesRef.current = false;
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!yjsRef.current) return;

        const provider = yjsRef.current.provider;

        const onStateless = (payload: string | Uint8Array) => {
            try {
            const message = JSON.parse(
                typeof payload === "string"
                ? payload
                : new TextDecoder().decode(payload)
            );

            if (message.type === "DELETED") {
                closeConfirmAlert();
                setShowAlert("문서가 삭제되었습니다.");
                notFound();
            }
            } catch {}
        };

        provider.on("stateless", onStateless);

        return () => {
            provider.off("stateless", onStateless);
        };
    }, []);

    useEffect(() => {
        if (!yjsRef.current?.provider?.awareness) return;

        const awareness = yjsRef.current.provider.awareness;

        const updateUsers = () => {
            const users = Array.from(awareness.getStates().values())
            .map((s: any) => s.user)
            .filter(Boolean);

            setOnlineUsers(users);
        };

        awareness.on("change", updateUsers);
        updateUsers();

        return () => {
            awareness.off("change", updateUsers);
        };
    }, []);

    useEffect(() => {
        if (!editor || !yjsRef.current?.provider?.awareness) return;

        const awareness = yjsRef.current.provider.awareness;

        const updateCursor = () => {
            awareness.setLocalStateField("user", {
            name: user.name,
            color: user.color,
            cursor: editor.state.selection.anchor,
            });
        };

        updateCursor();
        editor.on("selectionUpdate", updateCursor);
        editor.on("focus", updateCursor);

        return () => {
            editor.off("selectionUpdate", updateCursor);
            editor.off("focus", updateCursor);
        };
    }, [editor, user]);

    const handleSave = async () => {
        if (!yjsRef.current) return;

        if (!hasChangesRef.current) {
            setShowAlert("변경된 내용이 없습니다.");
            return;
        }

        await sendYjsCommand(yjsRef.current.provider, {
            type: "SAVE",
            title: titleRef.current,
        });
        
        hasChangesRef.current = false;
        setShowAlert("저장 완료되었습니다.");
    };

    const handleDelete = async () => {
        if (!yjsRef.current) return;

        await sendYjsCommand(yjsRef.current.provider, { type: "DELETE" });

        const clientData = getOrCreateClientData();
        clientData.documents = clientData.documents.filter(id => id !== document.id);
        localStorage.setItem("noteTogetherClientData", JSON.stringify(clientData));

        yjsRef.current.provider.sendStateless(JSON.stringify({ type: "DELETED" }));
        notFound();
    };

    const openConfirmAlert = (
        message: string,
        onConfirm: () => void
    ) => {
        setConfirmAlert({
            open: true,
            message,
            onConfirm,
        });
    };

    const closeConfirmAlert = () => {
        setConfirmAlert(prev => ({
            ...prev,
            open: false,
        }));
    };

    useEffect(() => {
        if (showAlert && showAlert !== "") {
            const timer = setTimeout(() => setShowAlert(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [showAlert]);

    return (
        <>
            <Header />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <input
                        type="text"
                        className={styles.editorTitle}
                        placeholder="제목 없음"
                        maxLength={TITLE_MAX}
                        value={title}
                        onChange={e => {
                            const value = e.target.value.slice(0, TITLE_MAX);
                            if (!yjsRef.current) return;
                            const yTitle = yjsRef.current.title;
                            yTitle.doc?.transact(() => {
                                yTitle.delete(0, yTitle.length);
                                yTitle.insert(0, value);
                            });
                        }}
                        onKeyUp={handleEnter}
                    />
                    <button className={styles.linkCopyButton} onClick={handleLinkCopy}>
                        링크 복사
                    </button>
                </div>

                <Toolbar editor={editor} />
                <EditorContent editor={editor} />

                <div className={styles.buttonContainer}>
                    <button className={styles.deleteButton} onClick={() => openConfirmAlert("문서를 삭제하면 모든 사용자가 퇴장됩니다.", handleDelete)}>삭제</button>
                    <button className={styles.saveButton} onClick={handleSave}>저장</button>
                </div>
            </div>
            <Footer />
            {confirmAlert.open &&
                <div className={styles.alertOverlay}>
                    <div className={styles.alert}>
                        <div className={styles.alertHeader}>안내</div>
                        <p>{confirmAlert.message}</p>
                        <div className={styles.buttonContainer}>
                            <button className={styles.cancelButton} onClick={closeConfirmAlert}>취소</button>
                            <button className={styles.approveButton} onClick={confirmAlert.onConfirm}>확인</button>
                        </div>
                    </div>
                </div>
            }
            {showAlert && showAlert !== "" &&
                <div className={styles.alert}>
                    <p>{showAlert}</p>
                </div>
            }
        </>
    );
}