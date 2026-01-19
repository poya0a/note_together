// tiptap.d.ts
import "@tiptap/core";
import { StoredStyle } from "@/extensions/StoredStyleExtension";

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        color: {
            setColor: (color: string) => ReturnType
        }
        highlight: {
            setHighlight: (options: { color: string }) => ReturnType
        }
        table: {
            insertTable: (options: { rows: number; cols: number; withHeaderRow?: boolean }) => ReturnType
            deleteTable: () => ReturnType
            addRowBefore: () => ReturnType
            addRowAfter: () => ReturnType
            deleteRow: () => ReturnType
            addColumnBefore: () => ReturnType
            addColumnAfter: () => ReturnType
            deleteColumn: () => ReturnType
            mergeCells: () => ReturnType
            splitCell: () => ReturnType
            toggleHeaderRow: () => ReturnType
            toggleHeaderColumn: () => ReturnType
            toggleHeaderCell: () => ReturnType
            fixTables: () => ReturnType
        }
        image: {
            setImage: (options: { src: string; alt?: string; title?: string; width?: string | number; height?: string | number ; style?: string; }) => ReturnType
        }
        textAlign: {
            setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => ReturnType
        }
        list: {
            toggleBulletList: () => ReturnType
            toggleOrderedList: () => ReturnType
            toggleTaskList: () => ReturnType
        }
        bold: { toggleBold: () => ReturnType }
        italic: { toggleItalic: () => ReturnType }
        strike: { toggleStrike: () => ReturnType }
        underline: { toggleUnderline: () => ReturnType }
        codeBlock: { toggleCodeBlock: () => ReturnType }
        blockquote: { toggleBlockquote: () => ReturnType }
        horizontalRule: { setHorizontalRule: () => ReturnType }
        hardBreak: { setHardBreak: () => ReturnType }
        history: {
            undo: () => ReturnType
            redo: () => ReturnType
        }
        storedStyle: {
            setStoredStyle: (style: StoredStyle) => ReturnType
            clearStoredStyle: () => ReturnType
        }
    }
}