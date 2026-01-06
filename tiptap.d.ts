import "@tiptap/core";

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        color: {
            setColor: (color: string) => ReturnType
        }
        highlight: {
            setHighlight: (options: { color: string }) => ReturnType
        }
    }
}
