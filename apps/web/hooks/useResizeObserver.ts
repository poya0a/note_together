import { useEffect } from "react";

export function useResizeObserver(
    ref: React.RefObject<HTMLElement>,
    onResize: (height: number) => void
) {
    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver(([entry]) => {
        onResize(entry.contentRect.height);
        });

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [ref, onResize]);
}