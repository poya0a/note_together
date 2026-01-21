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

    useEffect(() => {
        const setHeight = () => {
            const scrollPos = window.scrollY;
            document.documentElement.style.setProperty('--height', `${window.innerHeight}px`);
            window.scrollTo({ top: scrollPos });
        };

        setHeight();
        window.addEventListener('resize', setHeight);
        return () => window.removeEventListener('resize', setHeight);
    }, []);

    return <>{children}</>;
}