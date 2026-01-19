"use client";
import { useEffect, useRef, useState, useMemo, KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { addDocumentId, getUserInfo, removeDocumentId } from "@/lib/clientStorage/clientData";
import { useDocumentStore } from "@/store/useDocumentStore";
import { fetchDocument } from "@/lib/document";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit"; 
import Collaboration from "@tiptap/extension-collaboration";
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

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toolbar from "@/components/Toolbar";
import { createYjs, sendYjsCommand } from "@/lib/yjs/createYjs";
import styles from "@/styles/pages/_noteTogether.module.scss";

type AwarenessState = {
    user: {
        name: string;
        color: string;
    };
    pointer?: {
        x: number;
        y: number;
        type: "mouse" | "touch";
    };
};

function throttle<T extends (...args: any[]) => void>(fn: T, delay: number) {
    let last = 0;
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - last >= delay) {
            last = now;
            fn(...args);
        }
    };
}

export interface LinkPopupState {
    open: boolean;
    value: {
        URL: string;
        label: string;
    };
}

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
            renderHTML: attrs => ({ style: `font-size: ${attrs.fontSize || 16}px` }),
        },
        };
    },
});

export default function DocumentPage() {
    const { documentId } = useParams<{ documentId: string }>();
    const router = useRouter();
    const { setDocument } = useDocumentStore();

    const user = useMemo(() => getUserInfo(), []);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [currentDocId, setCurrentDocId] = useState<string>("");

    const yjsRef = useRef<{
        doc: Y.Doc;
        provider: HocuspocusProvider;
        meta: Y.Map<any>;
        content: Y.XmlFragment;
    } | null>(null);

    const [title, setTitle] = useState("");
    const titleRef = useRef("");
    const hasChangesRef = useRef(false);
    const [remotePointers, setRemotePointers] = useState<AwarenessState[]>([]);

    const [linkPopup, setLinkPopup] = useState<LinkPopupState>({
        open: false,
        value: {
            URL: "",
            label: "",
        },
    });
    const [URLValue, setURLValue] = useState<string>("");
    const [labelValue, setLabelValue] = useState<string>("");
    const [notUrl, setNotUrl] = useState<boolean>(false);

    const [showAlert, setShowAlert] = useState<string>("");
    const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertState>({
        open: false,
        message: "",
    });

    // 문서 아이디 확인 / Yjs + Editor 초기화
    useEffect(() => {
        if (!documentId) return router.replace("/");

        (async () => {
            const findDoc = await fetchDocument(documentId);
            if (!findDoc) {
                removeDocumentId(documentId);
                return router.replace("/not-found");
            }
            setDocument({
                id: findDoc.id,
                title: findDoc.title,
            });
            addDocumentId(findDoc.id);
            setCurrentDocId(findDoc.id);

            yjsRef.current = createYjs(findDoc.id);
            const { provider, content, meta, doc } = yjsRef.current;

            provider.awareness?.setLocalStateField("user", { ...user });

            const newEditor = new Editor({
                extensions: [
                    StarterKit.configure({ 
                        history: false,
                        bulletList: { keepMarks: true, keepAttributes: false }, 
                        orderedList: { keepMarks: true, keepAttributes: false }
                    }),
                    Collaboration.configure({ document: doc, fragment: content }),
                    CustomTextStyle,
                    TextAlign.configure({ types: ["heading", "paragraph"] }),
                    Color.configure({
                        types: ["textStyle"],
                    }),
                    ListItem,
                    Underline,
                    Highlight.configure({ multicolor: true }),
                    Image,
                    ImageResize,
                    Link.configure({ autolink: true, openOnClick: true }),
                    Table.configure({ resizable: true }),
                    TableRow,
                    TableHeader,
                    TableCell,
                    TaskList,
                    TaskItem.configure({ nested: true }),
                    CodeBlockLowlight.configure({ lowlight }),
                ],
            });
            setEditor(newEditor);

            const syncTitle = () => {
                const value = meta.get("title");
                if (typeof value !== "string") return;

                setTitle(value);
                titleRef.current = value;
            };

            provider.on("synced", (synced: boolean) => {
                if (!synced) return;
                syncTitle();
            });
            
            newEditor.on("transaction", ({ transaction }) => {
                if (transaction.docChanged) {
                    hasChangesRef.current = true;
                }
            });
            return () => {
                meta.unobserve(syncTitle);
                provider.disconnect();
                doc.destroy();
                yjsRef.current = null;
            };
        })();
    }, [documentId]);

    // awareness 세팅
    useEffect(() => {
        if (!yjsRef.current) return;

        const provider = yjsRef.current.provider;
        
        const onStatus = (e: { status: "connected" | "disconnected" }) => {
            if (e.status !== "connected") return;

            const awareness = provider.awareness;
            if (!awareness) return;

            awareness.setLocalState({
                user: {
                    name: user.name,
                    color: user.color,
                },
            });
        };

        provider.on("status", onStatus);

        return () => {
            provider.off("status", onStatus);
        };
    }, [yjsRef.current, user]);

    // pointer 송신
    useEffect(() => {
        if (!yjsRef.current?.provider?.awareness) return;

        const awareness = yjsRef.current.provider.awareness;

        const sendPointer = throttle(
            (x: number, y: number, type: "mouse" | "touch") => {
                awareness.setLocalStateField("pointer", { x, y, type });
            },
            40
        );

        const onMouseMove = (e: MouseEvent) =>
            sendPointer(e.clientX, e.clientY, "mouse");

        const onTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            if (!t) return;
            sendPointer(t.clientX, t.clientY, "touch");
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchmove", onTouchMove);
        };
    }, [yjsRef.current?.provider]);

    // pointer 수신
    useEffect(() => {
        if (!yjsRef.current?.provider?.awareness) return;

        const awareness = yjsRef.current.provider.awareness;

        const update = () => {
            const states: AwarenessState[] = [];
            const localClientId = awareness.clientID;

            awareness.getStates().forEach((state, clientId) => {
                if (!state?.user) return;
                if (!state.pointer) return;

                if (clientId === localClientId) return; 

                states.push({
                    user: {
                        name: state.user.name,
                        color: state.user.color,
                    },
                    pointer: {
                        x: state.pointer.x,
                        y: state.pointer.y,
                        type: state.pointer.type,
                    },
                });
            });

            setRemotePointers(states);
        };

        awareness.on("change", update);
        update();

        return () => awareness.off("change", update);
    }, [yjsRef.current?.provider]);

    // 자동 저장
    useEffect(() => {
        const interval = setInterval(() => {
            handleSave();
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
                    router.replace("/not-found");
                }
            } catch {}
        };

        provider.on("stateless", onStateless);

        return () => {
            provider.off("stateless", onStateless);
        };
    }, []);

    const handleSave = async () => {
        if (!yjsRef.current) return;

        if (!hasChangesRef.current) {
            setShowAlert("변경된 내용이 없습니다.");
            return;
        }

        await sendYjsCommand(yjsRef.current.provider, {
            type: "SAVE",
        });
        
        hasChangesRef.current = false;
        setShowAlert("저장 완료되었습니다.");
    };

    const handleDelete = async () => {
        if (!yjsRef.current) return;

        await sendYjsCommand(yjsRef.current.provider, { type: "DELETE" });

        removeDocumentId(currentDocId);

        yjsRef.current.provider.sendStateless(JSON.stringify({ type: "DELETED" }));
        router.replace("/");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleLinkSave();
        }
    };

    const openLinkPopup = () => {
        setLinkPopup({
            open: true,
            value: { 
                URL: "",
                label: ""
            }
        });
    }

    const closeLinkPopup = () => {
        setLinkPopup({
            open: false,
            value: { 
                URL: "",
                label: ""
            }
        });

        setURLValue("");
        setLabelValue("");
        setNotUrl(false);
    }
    
    const handleLinkSave = () => {
        const urlPattern = new RegExp(
            "^(https?:\\/\\/)?" + // 프로토콜 (선택)
                "((([a-zA-Z0-9\\-]+\\.)+[a-zA-Z]{2,})|" + // 도메인명
                "((\\d{1,3}\\.){3}\\d{1,3}))" + // IP 주소 (IPv4)
                "(\\:\\d+)?(\\/[-a-zA-Z0-9%_.~+]*)*" + // 포트와 경로
                "(\\?[;&a-zA-Z0-9%_.~+=-]*)?" + // 쿼리 문자열 (선택)
                "(\\#[-a-zA-Z0-9_]*)?$", // 해시 (선택)
            "i"
        );
        if (!urlPattern.test(URLValue)) {
            return setNotUrl(true);
        }

        setLinkPopup({
            open: false,
            value: { 
                URL: URLValue,
                label: labelValue
            }
        });

        setURLValue("");
        setLabelValue("");
        setNotUrl(false);
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

    return (
        <>
            <Header />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        className={styles.editorTitle}
                        placeholder="제목 없음"
                        maxLength={TITLE_MAX}
                        value={title}
                        onChange={e => {
                            const value = e.target.value.slice(0, TITLE_MAX);
                            if (!yjsRef.current) return;

                            const meta = yjsRef.current.meta;

                            yjsRef.current.doc.transact(() => {
                                meta.set("title", value);
                                setTitle(value);
                            });
                        }}
                        onKeyUp={handleEnter}
                    />
                    <button className={styles.linkCopyButton} onClick={handleLinkCopy}>
                        링크 복사
                    </button>
                </div>

                <Toolbar 
                    editor={editor} 
                    linkPopupState={linkPopup}
                    openLinkPopup={openLinkPopup} 
                />
                <EditorContent editor={editor} />

                <div className={styles.buttonContainer}>
                    <button className={styles.deleteButton} onClick={() => openConfirmAlert("문서를 삭제하면 모든 사용자가 퇴장됩니다.", handleDelete)}>삭제</button>
                    <button className={styles.saveButton} onClick={handleSave}>저장</button>
                </div>
            </div>
            <Footer />
            <div className={styles.pointerLayer}>
                {remotePointers.map((u, i) =>
                    u.pointer ? (
                        <div
                            key={i}
                            className={styles.pointer}
                            style={{
                                transform: `translate(${u.pointer.x}px, ${u.pointer.y}px)`,
                            }}
                        >
                            <div
                                className={styles.pointerDot}
                                style={{ backgroundColor: u.user.color }}
                            />
                            <span className={styles.pointerLabel}>{u.user.name}</span>
                        </div>
                    ) : null
                )}
            </div>
            {linkPopup.open &&
                <div className={styles.alertOverlay}>
                    <div className={styles.alert}>
                        <div className={styles.alertHeader}>URL</div>
                        <div className={styles.inputText}>
                            <label htmlFor="url">URL 주소</label>
                            <input
                                id="url"
                                name="url"
                                type="text"
                                maxLength={100}
                                value={URLValue}
                                onChange={(e) => {
                                    setNotUrl(false);
                                    setURLValue(e.target.value);
                                    setLabelValue(e.target.value);
                                }}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className={styles.inputText}>
                            <label htmlFor="label">URL 연결 문구</label>
                            <input
                                id="label"
                                name="label"
                                type="text"
                                maxLength={30}
                                value={labelValue}
                                onChange={(e) => {
                                    setLabelValue(e.target.value);
                                }}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        {notUrl && <p className={styles.errorMessage}>URL 형식이 올바르지 않습니다. 다시 입력해 주세요.</p>}
                        <div className={styles.buttonContainer}>
                            <button className={styles.cancelButton} onClick={closeLinkPopup}>닫기</button>
                            <button className={styles.approveButton} onClick={handleLinkSave}>확인</button>
                        </div>
                    </div>
                </div>
            }
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