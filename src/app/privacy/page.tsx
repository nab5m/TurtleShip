import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 거북선",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-bold">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted">시행일: 2026년 7월 15일</p>

      <p className="mt-6 text-sm leading-relaxed">
        거북선(이하 &lsquo;서비스&rsquo;)은 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다. 본
        방침은 서비스가 어떤 정보를 수집하고 어떻게 이용·보관하는지 설명합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>회원(구글 로그인) 시</b>: 구글 계정으로부터 제공받는 이메일 주소, 이름, 프로필 이미지
          </li>
          <li>
            <b>학습 데이터</b>: 학습·복습 완료 기록, 퀴즈 점수, 즐겨찾기, 진도 정보
          </li>
          <li>
            <b>비회원(게스트) 이용 시</b>: 위 학습 데이터가 서버로 전송되지 않고 이용자의 브라우저(로컬
            저장소)에만 저장됩니다.
          </li>
          <li>
            <b>자동 수집</b>: 서비스 운영·보안을 위해 접속 로그, 기기·브라우저 정보가 호스팅 과정에서 생성될
            수 있습니다.
          </li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>학습 서비스 제공 및 학습 기록의 기기 간 동기화</li>
          <li>본인 식별 및 계정 관리</li>
          <li>문의 응대 및 서비스 개선</li>
        </ul>
      </Section>

      <Section title="3. 보관 및 파기">
        <p>
          개인정보는 회원 탈퇴(계정 삭제) 시 지체 없이 파기합니다. 비회원의 학습 데이터는 이용자가 브라우저의
          저장소를 삭제하면 즉시 제거됩니다. 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
      </Section>

      <Section title="4. 제3자 제공 및 처리 위탁 (국외 이전 포함)">
        <p>서비스는 원활한 운영을 위해 아래 사업자에 개인정보 처리를 위탁·연동합니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <b>Supabase</b>: 인증 및 학습 데이터 저장 (데이터가 국외 서버에 저장·처리될 수 있습니다)
          </li>
          <li>
            <b>Google</b>: 구글 로그인(OAuth) 인증 처리
          </li>
        </ul>
        <p className="mt-2">위 목적 외의 제3자에게 개인정보를 판매하거나 제공하지 않습니다.</p>
      </Section>

      <Section title="5. 이용자의 권리">
        <p>
          이용자는 언제든지 본인의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다. 계정 및 학습
          데이터 삭제를 원하시면 아래 문의처로 요청해 주세요. 비회원은 브라우저 저장소를 직접 삭제할 수 있습니다.
        </p>
      </Section>

      <Section title="6. 쿠키 및 로컬 저장소">
        <p>
          서비스는 로그인 상태 유지와 학습 기록 저장을 위해 쿠키 및 브라우저 로컬 저장소(localStorage)를
          사용합니다. 이용자는 브라우저 설정에서 이를 차단하거나 삭제할 수 있으나, 일부 기능이 제한될 수
          있습니다.
        </p>
      </Section>

      <Section title="7. 안전성 확보 조치">
        <p>
          회원 데이터는 접근 권한 제어(Row Level Security 등)를 통해 본인만 접근할 수 있도록 관리합니다.
        </p>
      </Section>

      <Section title="8. 개인정보 보호책임자 및 문의처">
        <p>
          성명: 김준영
          <br />
          이메일:{" "}
          <a href="mailto:disnwkdl420@gmail.com" className="text-accent hover:underline">
            disnwkdl420@gmail.com
          </a>
        </p>
      </Section>

      <Section title="9. 방침의 변경">
        <p>
          본 방침은 법령 및 서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지를 통해 알립니다.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-bold">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
