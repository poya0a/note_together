import { Metadata } from "next";
import "@/styles/globals.scss";

export const metadata: Metadata = {
    title: "페이지를 찾을 수 없습니다",
    description: "Not Found Page",
};

export default function NotFoundLayout({
    children,
}: {
children: React.ReactNode;
}) {
    return (
        <html lang="ko" id="html">
            <body id="body">
                {children}
            </body>
        </html>
    );
}
