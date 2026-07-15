"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { XIcon } from "./icons";

// Chrome 계열 설치 프롬프트 이벤트 (표준 타입에 없어 직접 정의)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 이미 홈 화면 PWA(스탠드얼론)로 실행 중이면 표시하지 않음
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    // iOS의 '홈 화면에 추가'는 Safari에서만 지원 (Chrome/Firefox for iOS는 제외)
    const iosSafari = ios && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);

    // Android/Chrome: 설치 가능 시점에 이벤트 발생 → 커스텀 배너 표시
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // 설치 완료되면 배너 숨김
    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari: beforeinstallprompt가 없으므로 안내형 배너를 바로 노출
    // (effect 본문 동기 setState를 피하려 microtask로 지연)
    if (iosSafari) {
      queueMicrotask(() => {
        setIsIos(true);
        setVisible(true);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt();
      // 수락/거절과 무관하게 배너를 닫는다 (다시 접속하면 재노출)
      setVisible(false);
      setDeferred(null);
    } else if (isIos) {
      setShowGuide((v) => !v);
    }
  }

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-2 border-b border-accent/25 bg-accent-soft px-3 py-2">
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <Logo className="h-8 w-8 shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-accent">홈 화면에 추가</span>
            <span className="block truncate text-[11px] text-muted">
              앱처럼 빠르게, 오프라인으로 학습하세요
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="닫기"
          className="shrink-0 rounded-full p-1.5 text-muted hover:bg-card/60 hover:text-foreground"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {showGuide && isIos && (
        <div className="border-b border-border bg-card px-4 py-3 text-xs leading-relaxed">
          <p className="font-bold">Safari에서 설치하기</p>
          <p className="mt-1 text-muted">
            하단 <b className="text-foreground">공유</b> 버튼(□↑)을 누른 뒤{" "}
            <b className="text-foreground">‘홈 화면에 추가’</b>를 선택하세요.
          </p>
        </div>
      )}
    </div>
  );
}
