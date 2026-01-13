import { create } from "zustand";

interface ToolbarHeightState {
    useToolbarHeightState: number;
    handleToolbarHeight: (height: number) => void;
}

export const useToolbarHeightStore = create<ToolbarHeightState>((set) => ({
    useToolbarHeightState: 73,

    handleToolbarHeight: (height: number) =>
        set({ useToolbarHeightState: height }),
}));