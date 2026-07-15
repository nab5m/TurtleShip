import { notFound } from "next/navigation";
import ReviewSession from "@/components/ReviewSession";
import { TOTAL_DAYS } from "@/data/curriculum";

export function generateStaticParams() {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => ({ day: String(i + 1) }));
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const n = Number(day);
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_DAYS) notFound();
  return <ReviewSession day={n} />;
}
