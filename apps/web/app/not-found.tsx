"use client";
import styles from "@/styles/pages/_notFound.module.scss";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className={styles.notFound}>
            <h1>페이지를 찾을 수 없습니다.</h1>
            <div className={styles.goToHome}>
                <Link
                className={styles.homeButton}
                href="https://note-together-kappa.vercel.app"
                >
                홈으로
                </Link>
            </div>
        </div>
    );
}