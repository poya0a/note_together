"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import {
  Editor,
  EditorContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { common, createLowlight } from "lowlight";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import ImageResize from "tiptap-extension-resize-image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toolbar from "@/components/Toolbar";
import { createYjs, sendYjsCommand } from "@/lib/yjs/createYjs";
import { useToolBarHeightStore } from "@/store/useToolBarHeightStore";
import styles from "@/styles/pages/_noteTogether.module.scss";

const lowlight = createLowlight(common);

function randomColor() {
  const colors = ["#f87171", "#60a5fa", "#34d399", "#facc15", "#a78bfa", "#fb7185"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (el) => el.style.fontSize.replace("px", "") || null,
        renderHTML: (attrs) => ({ style: `font-size: ${attrs.fontSize || 14}px` }),
      },
    }
  },
});

export default function NoteTogetherPage() {
  const { documentId } = useParams();
  const router = useRouter();

  const userRef = useRef<{ name: string; color: string } | null>(null);
  const yjsRef = useRef<{ doc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const { useToolBarHeightState } = useToolBarHeightStore();

  useEffect(() => {

    if (typeof documentId !== "string") {
      router.replace("/not-found");
      return;
    }

    if (!userRef.current) {
      userRef.current = {
        name: `User-${crypto.randomUUID().slice(0, 4)}`,
        color: randomColor(),
      };
    }

    if (!yjsRef.current) {
      yjsRef.current = createYjs(documentId);
    }

    if (editorRef.current) return;

    const newEditor = new Editor({
      extensions: [
        StarterKit.configure({ history: false }),
        Collaboration.configure({ document: yjsRef.current.doc }),
        CollaborationCursor.configure({ provider: yjsRef.current.provider, user: userRef.current }),
        TextStyle,
        Color,
        ListItem,
        CustomTextStyle,
        CodeBlockLowlight.configure({ lowlight }),
        Highlight.configure({
          multicolor: true,
        }),
        Underline,
        Image.configure({ inline: true, allowBase64: true }),
        ImageResize,
        StarterKit.configure({
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Link.configure({
          openOnClick: true,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https"],
        }),
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
      ],
    });

    editorRef.current = newEditor;
    setEditor(newEditor);

    return () => {
      newEditor.destroy();
      yjsRef.current?.provider.destroy();
      yjsRef.current?.doc.destroy();
    };
  }, [documentId, router]);

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!editor) return;
    if (e.key === "Enter") {
      e.preventDefault();
      editor.commands.focus();
    };
  };

  useEffect(() => {
    if (!yjsRef.current) return;

    const interval = setInterval(async () => {
      try {
        await sendYjsCommand(yjsRef.current!.provider, "SAVE");
      } catch {
        console.log("자동 저장에 실패했습니다. 네트워크 상태를 확인해주세요.");
      };
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!yjsRef.current) return;

    const provider = yjsRef.current.provider;

    const handleStatus = (event: { status: "connected" | "disconnected" | "connecting" }) => {
      if (event.status === "disconnected") {
        alert("문서가 삭제되었거나 서버 연결이 끊겼습니다.");
        router.replace("/not-found");
      }
    };

    provider.on("status", handleStatus);

    return () => {
      provider.off("status", handleStatus);
    };
  }, [router]);

  const handleSave = async () => {
    if (!yjsRef.current) return;
    try {
      await sendYjsCommand(yjsRef.current.provider, "SAVE");
      alert("저장 완료");
    } catch {
      alert("저장 실패");
    }
  };

  const handleDelete = async () => {
    if (!yjsRef.current) return;
    if (!confirm("문서를 삭제하면 모든 사용자가 퇴장됩니다. 계속할까요?")) return;

    try {
      await sendYjsCommand(yjsRef.current.provider, "DELETE");

      yjsRef.current.provider.sendStateless(JSON.stringify({ type: "DELETED" }));

      alert("문서가 삭제되었습니다.");
      router.replace("/not-found");
    } catch {
      alert("삭제 실패");
    }
  };

  useEffect(() => {
    if (!yjsRef.current) return;

    const handleStateless = (message: { type: string }) => {
      if (message.type === "DELETED") {
        alert("문서가 삭제되어 퇴장합니다.");
        router.replace("/not-found");
      }
    };

    yjsRef.current.provider.on("stateless", (event: string | Uint8Array) => {
      try {
        const message = JSON.parse(
          typeof event === "string" ? event : new TextDecoder().decode(event)
        );
        handleStateless(message);
      } catch {}
    });


    return () => {
      yjsRef.current?.provider.off("stateless");
    };
  }, [router]);

  return (
    <>
      <Header />
      <div 
        className={styles.container}
        style={{ paddingTop: `calc(${useToolBarHeightState}px + 110px)`}}
      >
        <div className={styles.titleContainer}>
          <input
            type="text"
            className={styles.editorTitle}
            placeholder="제목 없음"
            maxLength={50}
            onKeyUp={handleEnter}
            // onChange={(e) => setTitle(e.target.value)}
            // value={useEditorState.title}
          />
          <button
            className={styles.linkCopyButton}
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
              링크 복사
          </button>
        </div>
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
        <div className={styles.buttonContainer}>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
          >
              삭제
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
          >
              저장
          </button>
        </div>
      </div>
      <Footer />
    </>
  )
};