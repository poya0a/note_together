This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# NoteTogether 📝

> 하나의 링크로 여러 명이 동시에 문서를 작성·수정할 수 있는 실시간 협업 에디터

---

## 🔗 프로젝트 링크

<!-- - [Demo URL](): -->
- 실시간 동기화: **wss://demos.yjs.dev** 사용
- 데이터 영속성: Supabase 무료 플랜

---

## 📚 소개

`NoteTogether`는 **실시간 협업**을 지원하는 텍스트 에디터입니다.  
한 링크를 통해 여러 사용자가 동시에 편집할 수 있으며, 각 사용자의 커서 위치와 색상이 표시됩니다.

주요 특징:

- TipTap 기반 리치 텍스트 에디터
- Y.js를 이용한 실시간 동기화
- Supabase에 5분 단위/수동 저장 가능
- 사용자 커서 및 이름 표시
- 공유 링크 생성 및 복사 기능
- 공개 문서 삭제 기능 (삭제 후 재접속 시 Not Found 처리)

---

## 🛠 기술 스택

- **Frontend:** React, Next.js, SCSS
- **Editor:** TipTap (Y.js 연동)
- **Realtime Sync:** Y.js + Hocuspocus Demo Server (`wss://demos.yjs.dev`)
- **Persistence:** Supabase (Free Plan)
- **State Management:** Zustand

---

<!-- ## 🏗️ 아키텍처 -->