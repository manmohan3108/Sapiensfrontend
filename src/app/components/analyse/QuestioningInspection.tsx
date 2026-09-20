import { InquiryInspection } from './InquiryInspection';
export function QuestioningInspection({ sapienId }: { sapienId: string }) {
  return <InquiryInspection key={sapienId} sapienId={sapienId} kind="questioning" />;
}
