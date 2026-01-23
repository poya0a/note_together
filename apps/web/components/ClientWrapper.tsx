"use client";
import { useEffect, ReactNode } from "react";
import { useToolbarHeightStore } from "@/store/useToolbarHeightStore";

export default function ClientWrapper({ children }: { children: ReactNode }) {
    const { useToolbarHeightState } = useToolbarHeightStore(state => state);

    useEffect(() => {
        document.documentElement.style.setProperty(
        "--toolbar-height",
        `${useToolbarHeightState}px`
        );
    }, [useToolbarHeightState]);

    return <>{children}</>;
}