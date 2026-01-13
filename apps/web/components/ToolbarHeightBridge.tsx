"use client";
import { useEffect } from "react";
import { useToolbarHeightStore } from "@/store/useToolbarHeightStore";

export default function ToolbarHeightBridge() {
    const { useToolbarHeightState } = useToolbarHeightStore(state => state);

    useEffect(() => {
        document.documentElement.style.setProperty(
        "--toolbar-height",
        `${useToolbarHeightState}px`
        );
    }, [useToolbarHeightState]);

    return null;
}