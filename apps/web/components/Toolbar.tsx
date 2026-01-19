"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import type { Transaction } from 'prosemirror-state';
import Image from "next/image";
import { SketchPicker, ColorResult } from "react-color";
import { useEditorStore } from "@/store/useEditorStore";
import { useToolbarHeightStore } from "@/store/useToolbarHeightStore";
import { useURLPopupStore } from "@/store/popup/useURLPopupStore";
import styles from "@/styles/components/_toolbar.module.scss";

const isTablePresent = (editor: Editor): boolean => {
  const { selection } = editor.state;
  const $from = selection.$from;
  let found = false;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "table") {
      found = true;
      break;
    }
  }

  return found;
};

export default function Toolbar({ editor }: { editor: Editor | null }) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { handleToolbarHeight } = useToolbarHeightStore();
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [currentTextColor, setCurrentTextColor] = useState<string>("#000");
  const [currentHighlightColor, setCurrentHighlightColor] = useState<string>("transparent");
  const [type, setType] = useState<string>("");
  const imgRef = useRef<HTMLInputElement>(null);
  const { useEditorState, setHasTableTag, setFontSize, plusFontSize, minusFontSize } = useEditorStore();
  const { useURLPopupState, toggleURLPopup } = useURLPopupStore();
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // 리사이즈
  useEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      const toolbarElement = entries[0].target as HTMLDivElement;
      handleToolbarHeight(toolbarElement.offsetHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (toolbarRef.current) {
      resizeObserver.observe(toolbarRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleToolbarHeight]);

  // 컬러 피커
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editor === null || colorPickerRef.current === null) return;

      const target = event.target as Element | null;

      if (target === null) return;

      const closestIgnoreElement = target.closest("[data-ignore-outside-click]");

      if (!closestIgnoreElement && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
        setType("");
        editor.view.dom.style.pointerEvents = "auto";
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editor]);

  // 폰트 사이즈
  useEffect(() => {
    if (!editor) return;
    if (useEditorState.fontSize) {
      editor
        .chain()
        .setMark("textStyle", {
          fontSize: useEditorState.fontSize,
        })
        .run();
    }
  }, [useEditorState.fontSize, editor]);

  const handleColorChange = (color: ColorResult) => {
    if (!editor) return;
    if (type === "text") {
      editor.chain().focus().setColor(color.hex).run();
      setCurrentTextColor(color.hex);
    } else if (type === "highlight") {
      editor.chain().focus().setHighlight({ color: color.hex }).run();
      setCurrentHighlightColor(color.hex);
    }
  };

  const handleButtonClick = (name: string) => {
    if (name === type) {
      setShowColorPicker(false);
      setType("");
    } else {
      setShowColorPicker(true);
      setType(name);
    }
  };

  useEffect(() => {
    if (!editor) return;
    if (!useURLPopupState.isActOpen && useURLPopupState.value.URL !== null) {
      editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: useURLPopupState.value.URL, target: "_blank" })
      .run();
    }
  }, [useURLPopupState, editor]);

  const createTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

    if (editor) {
      setHasTableTag(isTablePresent(editor));
    }
  }, [editor, setHasTableTag]);

  const deleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();

    if (editor) {
      setHasTableTag(isTablePresent(editor));
    }
  }, [editor, setHasTableTag]);

  const insertImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result?.toString();
        if (base64Image) {
          editor?.chain()
          .focus()
          .setImage({
            src: base64Image,
            width: "100%",
            style: "max-width: 100%; height: auto;",
          })
          .run();
        }
      };
      reader.readAsDataURL(file);
    },
    [editor]
  );

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        insertImage(file);
      }
    },
    [insertImage]
  );

  // 복사 / 붙여넣기로 이미지 저장
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (!editor) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(item =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) return; // 텍스트 paste 허용

      event.preventDefault();

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) insertImage(file);
      }
    },
    [editor]
  );

  useEffect(() => {
    const handleEditorPaste = (event: ClipboardEvent) => {
      handlePaste(event);
    };

    if (editor) {
      const editorElement = editor.view.dom;
      editorElement.addEventListener("paste", handleEditorPaste);

      return () => {
        editorElement.removeEventListener("paste", handleEditorPaste);
      };
    }
  }, [editor, handlePaste]);

  // 텍스트 컬러, 하이라이트 유지
  useEffect(() => {
    if (!editor) return;

    const handler = ({
      editor, 
      transaction 
    }: {
      editor: Editor;
      transaction: Transaction;
    }) => {
      if (!transaction.docChanged) return;

      const marks = [];

      if (currentTextColor) {
        marks.push(
          editor.schema.marks.textStyle.create({
            color: currentTextColor,
          })
        );
      }

      if (currentHighlightColor) {
        marks.push(
          editor.schema.marks.highlight.create({
            color: currentHighlightColor,
          })
        );
      }

      if (marks.length) {
        editor.view.dispatch(
          editor.state.tr.setStoredMarks(marks)
        );
      }
    };

    editor.on('transaction', handler);

    return () => {
      editor.off('transaction', handler);
    };
  }, [editor, currentTextColor, currentHighlightColor]);

  return (
    <>
      <div
        ref={toolbarRef}
        className={styles.toolbar}
      >
        <div className={styles.toolbarWrapper}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor?.can().chain().focus().toggleBold().run()}
            className={editor?.isActive("bold") ? `${styles.active}` : ""}
            title="강조"
          >
            <Image src="/images/icon/bold.svg" alt="bold" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
            className={editor?.isActive("italic") ? `${styles.active}` : ""}
            title="기울임"
          >
            <Image src="/images/icon/italic.svg" alt="italic" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!editor?.can().chain().focus().toggleStrike().run()}
            className={editor?.isActive("strike") ? `${styles.active}` : ""}
            title="가운데 선"
          >
            <Image src="/images/icon/strikethrough.svg" alt="strike" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            disabled={!editor?.can().chain().focus().toggleUnderline().run()}
            className={editor?.isActive("underline") ? `${styles.active}` : ""}
            title="밑줄"
          >
            <Image src="/images/icon/underline.svg" alt="underline" width={20} height={20} />
          </button>
          <button
            type="button"
            name="text"
            data-ignore-outside-click={true}
            onClick={() => handleButtonClick("text")}
            className={type === "text" ? `${styles.active}` : ""}
            title="색상"
          >
            <Image src="/images/icon/text_color.svg" alt="color" width={20} height={20} />
            <i
              className={styles.colorbar}
              style={{
                backgroundColor: currentTextColor,
                border: currentTextColor === "#fff" ? "1px solid #1f1f1f" : "",
              }}
            />
          </button>
          <button
            type="button"
            name="highlight"
            data-ignore-outside-click={true}
            onClick={() => handleButtonClick("highlight")}
            className={type === "highlight" ? `${styles.active}` : ""}
            title="하이라이트"
          >
            <Image src="/images/icon/text_highlight.svg" alt="highlight" width={20} height={20} />
            <i
              className={styles.colorbar}
              style={{
                backgroundColor: currentHighlightColor,
                border:
                  currentHighlightColor === "transparent" || currentHighlightColor === "#fff"
                    ? "1px solid #000"
                    : "",
              }}
            />
          </button>
          {showColorPicker && (
            <div className={styles.colorPicker} ref={colorPickerRef}>
              <SketchPicker
                color={type === "text" ? currentTextColor : currentHighlightColor}
                onChange={handleColorChange}
              />
            </div>
          )}
          <div className={styles.fontSizeWrapper}>
            <input
              type="text"
              name="font_size"
              id="fontSize"
              className="input"
              value={useEditorState.fontSize}
              onChange={(e) => setFontSize(e.target.value)}
            />
            <button type="button" className={`button ${styles.fontSizeButton}`} onClick={plusFontSize}>
              <Image src="/images/icon/up.svg" alt="" width={20} height={20} />
            </button>
            <button type="button" className={`button ${styles.fontSizeButton}`} onClick={minusFontSize}>
              <Image src="/images/icon/down.svg" alt="" width={20} height={20} />
            </button>
          </div>
        </div>
        <div className={styles.toolbarWrapper}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            className={editor?.isActive({ textAlign: "left" }) ? `${styles.active}` : ""}
            title="좌측 정렬"
          >
            <Image src="/images/icon/textalign_left.svg" alt="left" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            className={editor?.isActive({ textAlign: "center" }) ? `${styles.active}` : ""}
            title="가운데 정렬"
          >
            <Image src="/images/icon/textalign_center.svg" alt="center" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            className={editor?.isActive({ textAlign: "right" }) ? `${styles.active}` : ""}
            title="우측 정렬"
          >
            <Image src="/images/icon/textalign_right.svg" alt="right" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
            className={editor?.isActive({ textAlign: "justify" }) ? `${styles.active}` : ""}
            title="양쪽 맞춤"
          >
            <Image src="/images/icon/textalign_justify.svg" alt="justify" width={20} height={20} />
          </button>
        </div>
        <div className={styles.toolbarWrapper}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive("bulletList") ? `${styles.active}` : ""}
            title="단추형 목록"
          >
            <Image src="/images/icon/list_ul.svg" alt="bulletList" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive("orderedList") ? `${styles.active}` : ""}
            title="번호형 목록"
          >
            <Image src="/images/icon/list_ol.svg" alt="orderedList" width={20} height={20} />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            className={editor?.isActive("taskList") ? `${styles.active}` : ""}
            title="체크박스 목록"
          >
            <Image src="/images/icon/todo_tasks_list.svg" alt="taskList" width={20} height={20} />
          </button>
        </div>
        <div className={styles.toolbarWrapper}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            className={editor?.isActive("codeBlock") ? `${styles.active}` : ""}
            title="코드 블럭"
          >
            <Image src="/images/icon/code.svg" alt="codeBlock" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={editor?.isActive("blockquote") ? `${styles.active}` : ""}
            title="인용"
          >
            <Image src="/images/icon/blockquote.svg" alt="blockquote" width={20} height={20} />
          </button>
          <button type="button" onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="가로선">
            <Image src="/images/icon/horizontal_line.svg" alt="horizontal_line" width={20} height={20} />
          </button>
          <button type="button" onClick={() => editor?.chain().focus().setHardBreak().run()} title="줄바꿈">
            <Image src="/images/icon/hardbreak.svg" alt="hardbreak" width={20} height={20} />
          </button>
        </div>
        <div className={styles.toolbarWrapper}>
          <input
            type="file"
            accept="image/*"
            ref={imgRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
            id="fileInput"
          />
          <button
            type="button"
            onClick={() => {
              if (imgRef.current) {
                imgRef.current.click();
              }
            }}
            title="파일과 그림 삽입"
          >
            <Image src="/images/icon/album.svg" alt="add image" width={20} height={20} />
          </button>
          <button type="button" onClick={createTable} title="표 생성">
            <Image src="/images/icon/grid.svg" alt="create grid" width={20} height={20} />
          </button>
          <button type="button" onClick={() => toggleURLPopup(true)} title="연결 삽입">
            <Image src="/images/icon/link.svg" alt="link" width={20} height={20} />
          </button>
        </div>
        <div className={styles.toolbarWrapper}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().chain().focus().undo().run()}
            title="뒤로 가기"
          >
            <Image src="/images/icon/undo.svg" alt="undo" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().chain().focus().redo().run()}
            title="앞으로 가기"
          >
            <Image src="/images/icon/redo.svg" alt="redo" width={20} height={20} />
          </button>
        </div>
        <br />
        {useEditorState.hasTableTag && (
          <div>
            <div className={styles.toolbarWrapper}>
              <button type="button" onClick={() => editor?.chain().focus().addRowBefore().run()} title="위에 행 추가">
                <Image src="/images/icon/table_row_plus_before.svg" alt="table_row_plus_before" width={20} height={20} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().addRowAfter().run()} title="아래에 행 추가">
                <Image src="/images/icon/table_row_plus_after.svg" alt="아래에 행 추가" width={20} height={20} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().deleteRow().run()} title="행 삭제">
                <Image src="/images/icon/table_row_remove.svg" alt="table_row_remove" width={20} height={20} />
              </button>
            </div>
            <div className={styles.toolbarWrapper}>
              <button
                type="button"
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
                title="왼쪽에 열 삽입"
              >
                <Image src="/images/icon/table_column_plus_before.svg" alt="table_column_plus_before" width={20} height={20} />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                title="오른쪽에 열 삽입"
              >
                <Image src="/images/icon/table_column_plus_after.svg" alt="table_column_plus_after" width={20} height={20} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().deleteColumn().run()} title="열 삭제">
                <Image src="/images/icon/table_column_remove.svg" alt="table_column_remove" width={20} height={20} />
              </button>
            </div>
            <div className={styles.toolbarWrapper}>
              <button type="button" onClick={() => editor?.chain().focus().mergeCells().run()} title="셀 병합">
                <Image src="/images/icon/table_merge_cells.svg" alt="Merge cells" width={20} height={20} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().splitCell().run()} title="병합된 셀 나누기">
                <Image src="/images/icon/table_split_cells.svg" alt="Split cell" width={20} height={20} />
              </button>
            </div>
            <div className={styles.toolbarWrapper}>
              <button type="button" onClick={() => editor?.chain().focus().toggleHeaderRow().run()} title="머릿행">
                <Image src="/images/icon/table_head.svg" alt="table_head" width={20} height={20} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().toggleHeaderColumn().run()} title="머릿열">
                <Image src="/images/icon/table_head.svg" alt="table_head" width={20} height={20} style={{ transform: "rotate(-90deg)" }} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().toggleHeaderCell().run()} title="머릿셀">
                <Image src="/images/icon/table_cell.svg" alt="table_head" width={20} height={20} />
              </button>
            </div>
            <div className={styles.toolbarWrapper}>
              <button type="button" onClick={() => editor?.chain().focus().fixTables().run()} title="틀 고정">
                <Image src="/images/icon/table_fixed.svg" alt="Fix tables" width={20} height={20} />
              </button>
            </div>
            <div className={styles.toolbarWrapper}>
              <button type="button" onClick={deleteTable} title="표 삭제">
                <Image src="/images/icon/grid_off.svg" alt="Delete table" width={20} height={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}