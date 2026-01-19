import { create } from "zustand";

interface EditorData {
  hasTableTag: boolean;
  title: string;
  fontSize: string;
}

interface EditorStore {
  useEditorState: EditorData;
  setHasTableTag: (hasTableTag: boolean) => void;
  setTitle: (title: string) => void;
  setFontSize: (fontSize: string) => void;
  plusFontSize: () => void;
  minusFontSize: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  useEditorState: {
    hasTableTag: false,
    title: "",
    fontSize: "16",
  },

  setHasTableTag: (hasTableTag: boolean) => {
    set((state) => ({
      useEditorState: { ...state.useEditorState, hasTableTag },
    }));
  },

  setTitle: (title: string) => {
    set((state) => ({
      useEditorState: { ...state.useEditorState, title },
    }));
  },

  setFontSize: (fontSize: string) => {
    const fontSizeValue = parseInt(fontSize, 10);
    if (fontSizeValue < 1 || fontSizeValue > 999) return;
    set((state) => ({
      useEditorState: { ...state.useEditorState, fontSize },
    }));
  },

  plusFontSize: () => {
    const fontSize = parseInt(get().useEditorState.fontSize, 10);
    if (fontSize > 998) return;
    set((state) => ({
      useEditorState: {
        ...state.useEditorState,
        fontSize: (fontSize + 1).toString(),
      },
    }));
  },

  minusFontSize: () => {
    const fontSize = parseInt(get().useEditorState.fontSize, 10);
    if (fontSize < 2) return;
    set((state) => ({
      useEditorState: {
        ...state.useEditorState,
        fontSize: (fontSize - 1).toString(),
      },
    }));
  },
}));