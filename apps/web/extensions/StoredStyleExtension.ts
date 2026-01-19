import { Extension } from "@tiptap/core";
import type { Mark } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";

export type StoredStyle = {
    color?: string
    fontSize?: string
    backgroundColor?: string
}

export const StoredStyleExtension = Extension.create({
    name: 'storedStyle',

    addStorage() {
        return {
            style: {} as StoredStyle,
        };
    },

    addCommands() {
        return {
            setStoredStyle:
                (style: StoredStyle) =>
                    ({ editor }) => {
                        editor.storage.storedStyle.style = {
                            ...editor.storage.storedStyle.style,
                            ...style,
                    };
                        return true;
                },

            clearStoredStyle:
                () =>
                    ({ editor }) => {
                        editor.storage.storedStyle.style = {}
                    return true;
                },
        }
    },

    appendTransaction(
        transactions: readonly Transaction[],
        _oldState: EditorState,
        newState: EditorState
    ): Transaction | void {
        const editor = this.editor;
        if (!editor || editor.view.composing) return;

        const style = editor.storage.storedStyle.style;
        if (!style || Object.keys(style).length === 0) return;

        const existing =
            newState.storedMarks ??
            newState.selection.$from.marks();

        const next = existing.filter(
            m => m.type !== newState.schema.marks.textStyle
        );

        next.push(
            newState.schema.marks.textStyle.create(style)
        );

        return newState.tr.setStoredMarks(next);
    }
})