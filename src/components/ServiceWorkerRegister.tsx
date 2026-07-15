"use client";

import { useEffect } from "react";

// 프로덕션에서만 서비스워커를 등록 (오프라인 학습 지원)
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 등록 실패는 무시 (앱은 정상 동작)
      });
    }
  }, []);
  return null;
}
