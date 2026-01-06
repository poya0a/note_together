import '@tiptap/core'
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
    }
}
