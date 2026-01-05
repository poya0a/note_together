"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/components/_header.module.scss";

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link className={styles.logo} href="https://poya.vercel.app">
                    <Image
                        src="/images/logo_blue.png"
                        width={80}
                        height={80}
                        alt="LOGO"
                    />
                </Link>
            </div>
        </header>
    );
}