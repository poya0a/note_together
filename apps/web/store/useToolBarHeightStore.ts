import { create } from "zustand";

interface ToolBarHeightState {
    useToolBarHeightState: number;
    handleToolBarHeight: (height: number) => void;
}

export const useToolBarHeightStore = create<ToolBarHeightState>((set) => ({
    useToolBarHeightState: 73,

    handleToolBarHeight: (height: number) =>
        set({ useToolBarHeightState: height }),
}));