import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 — 거북선",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-bold">이용약관</h1>
      <p className="mt-2 text-sm text-muted">시행일: 2026년 7월 15일</p>

      <Section title="제1조 (목적)">
        <p>
          본 약관은 거북선(이하 &lsquo;서비스&rsquo;)이 제공하는 한국사능력검정시험 대비 학습 서비스의 이용과
          관련하여 서비스와 이용자 간의 권리·의무 및 책임 사항을 규정합니다.
        </p>
      </Section>

      <Section title="제2조 (서비스의 제공)">
        <ul className="list-disc space-y-1 pl-5">
          <li>서비스는 한국사 학습 카드, 퀴즈, 복습 일정, 즐겨찾기 등의 기능을 제공합니다.</li>
          <li>서비스는 현재 무료로 제공되며, 향후 유료 기능이 추가될 수 있습니다.</li>
          <li>이용자는 회원가입(구글 로그인) 없이도 게스트로 서비스를 이용할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="제3조 (회원가입 및 계정)">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원가입은 구글 계정을 통한 로그인으로 이루어집니다.</li>
          <li>이용자는 본인의 계정 정보를 관리할 책임이 있으며, 계정을 타인에게 양도·대여할 수 없습니다.</li>
          <li>이용자는 언제든지 계정 삭제(탈퇴)를 요청할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="제4조 (콘텐츠의 정확성에 관한 고지)">
        <p>
          서비스가 제공하는 학습 콘텐츠는 <b>학습 참고용</b>이며, 교과서·기출 통설을 바탕으로 작성되었으나
          오류나 최신 학설과의 차이가 있을 수 있습니다. 서비스는 콘텐츠 이용을 통한 <b>시험 합격이나 특정
          점수를 보장하지 않습니다.</b> 중요한 내용은 공식 교재 등으로 반드시 확인하시기 바랍니다.
        </p>
      </Section>

      <Section title="제5조 (이용자의 의무)">
        <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>서비스의 콘텐츠를 무단으로 복제·배포·판매하는 행위</li>
          <li>비정상적인 접근이나 서비스 운영을 방해하는 행위</li>
          <li>타인의 계정을 도용하거나 권리를 침해하는 행위</li>
        </ul>
      </Section>

      <Section title="제6조 (지식재산권)">
        <p>
          서비스가 제작한 학습 콘텐츠에 대한 권리는 서비스에 있습니다. 카드·퀴즈에 사용된 일부 이미지는{" "}
          <b>Wikimedia Commons</b> 등에서 제공되는 자료로, 각 자료의 라이선스를 따릅니다.
        </p>
      </Section>

      <Section title="제7조 (책임의 제한)">
        <p>
          서비스는 천재지변, 이용자의 귀책, 제3자 서비스(호스팅·인증 등)의 장애 등 서비스가 통제할 수 없는
          사유로 인한 손해에 대해 책임을 지지 않습니다. 서비스는 무료로 제공되며, 서비스 이용으로 발생한 결과에
          대한 책임은 이용자 본인에게 있습니다.
        </p>
      </Section>

      <Section title="제8조 (서비스의 변경 및 중단)">
        <p>
          서비스는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
        </p>
      </Section>

      <Section title="제9조 (약관의 변경)">
        <p>
          서비스는 필요 시 본 약관을 개정할 수 있으며, 변경 시 서비스 내 공지를 통해 안내합니다. 변경된 약관에
          동의하지 않는 경우 이용자는 이용을 중단하고 탈퇴할 수 있습니다.
        </p>
      </Section>

      <Section title="제10조 (준거법 및 문의)">
        <p>
          본 약관은 대한민국 법령에 따라 해석됩니다.
          <br />
          문의: 김준영 ·{" "}
          <a href="mailto:disnwkdl420@gmail.com" className="text-accent hover:underline">
            disnwkdl420@gmail.com
          </a>
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
