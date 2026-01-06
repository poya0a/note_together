import { create } from "zustand";

interface URLPopupData {
    isActOpen: boolean;
    value: {
        URL: string | null;
        label: string | null;
    };
}

interface URLPopupStore {
    useURLPopupState: URLPopupData;
    toggleURLPopup: (
        props: boolean | { URL: string | null; label: string | null }
    ) => void;
}

export const useURLPopupStore = create<URLPopupStore>((set) => ({
    useURLPopupState: {
        isActOpen: false,
        value: {
        URL: null,
        label: null,
        },
    },

    toggleURLPopup: (
        props: boolean | { URL: string | null; label: string | null }
    ) => {
        if (typeof props === "object") {
        set({ useURLPopupState: { isActOpen: false, value: props } });
        } else {
        set({
            useURLPopupState: {
            isActOpen: true,
            value: { URL: null, label: null },
            },
        });
        }
    },
}));