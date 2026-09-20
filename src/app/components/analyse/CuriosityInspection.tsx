import { InquiryInspection } from './InquiryInspection';
export function CuriosityInspection({ sapienId }: { sapienId: string }) {
  return <InquiryInspection key={sapienId} sapienId={sapienId} kind="curiosity" />;
}
