"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getOrCreateClientData, addDocument, removeDocument } from "@/lib/clientStorage/clientData";
import { useDocumentStore } from "@/store/useDocumentStore";
import { createNewDocument, fetchTitleList } from "@/lib/document";
import styles from "@/styles/components/_header.module.scss";

export default function Header() {
    const router = useRouter();
    const { documentId } = useParams();

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const { list, setList, setDocument } = useDocumentStore((state) => state);
    const [active, setActive] = useState<string>("");
    const headerRef = useRef<HTMLElement>(null); 

    useEffect(() => {
        if (typeof documentId !== "string") return;

        const init = async () => {
            setActive(documentId);
            const clientData = getOrCreateClientData();
            
            // 기존 문서 데이터가 있는 경우
            if (clientData.documents && clientData.documents.length > 0) {
                const titles = await fetchTitleList(clientData.documents);
                if (titles && titles.length > 0) {
                    setList(titles);
                }
            }
        }

        init();
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

    const handlePage = (pageId: string) => {
        if (pageId === documentId) return;
        router.replace(`/document/${pageId}`);
    }

    const handleExitDocument = (pageId: string) => {
        removeDocument(pageId);

        const clientData = getOrCreateClientData();
        const targetDocId = clientData.documents[clientData.documents.length - 1];
        if (targetDocId) {
            router.push(`/document/${targetDocId}`);
        } else {
            router.push("/");
        }
    };

    const handleNewDocument = async () => {
        const newId = crypto.randomUUID();
        const newDoc = await createNewDocument(newId);

        if (newDoc) {
            // 전역 변수에 저장
            setDocument(newDoc);
            addDocument(newDoc.id);
            router.push(`/document/${newDoc.id}`);
        }
    };

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
                        >
                            <button 
                                className={styles.titleButton} 
                                onClick={() => handlePage(item.id)}
                            >
                                {item.title !== "" ? item.title : "제목 없음"}
                            </button>
                            <button 
                                className={styles.exitButton} 
                                onClick={() => handleExitDocument(item.id)}
                            >
                                    나가기
                            </button>
                        </li>
                    ))}
                    <li className={styles.buttonContainer}>
                        <button className={styles.createButton} onClick={handleNewDocument}>새 문서</button>
                    </li>
                </ul>
            </nav>
        </header>
    );
}