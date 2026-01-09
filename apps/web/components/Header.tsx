"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useDocumentStore } from "@/store/useDocumentStore";
import styles from "@/styles/components/_header.module.scss";

export default function Header() {
    const router = useRouter();
    const { documentId } = useParams();

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const { list } = useDocumentStore((state) => state);
    const [active, setActive] = useState<string>("");
    const headerRef = useRef<HTMLElement>(null); 

    useEffect(() => {
        if (typeof documentId !== "string") return;
        setActive(documentId);
    }, [documentId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <header ref={headerRef} className={styles.header}>
            <div className={styles.container}>
                <Link className={styles.logo} href="https://poya.vercel.app">
                    <Image
                        src="/images/logo_blue.png"
                        width={80}
                        height={80}
                        alt="LOGO"
                    />
                </Link>
                <button className={`button ${styles.menu}`} onClick={() => setMenuOpen((prev) => !prev)}>
                    <div className={styles.inner}>
                        <span className={`${styles.bar} ${menuOpen ? styles.bar1 : ""}`}></span>
                        <span className={`${styles.bar} ${menuOpen ? styles.bar2 : ""}`}></span>
                        <span className={`${styles.bar} ${menuOpen ? styles.bar3 : ""}`}></span>
                    </div>
                </button>
            </div>
            <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
                <ul>
                    {list.map((item, index) => (
                        <li
                            key={`document_item_${index}`}
                            className={active === item.id ? styles.active : ""}
                            onClick={() => router.replace(`/document/${item.id}`)}
                        >
                            {item.title}
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}