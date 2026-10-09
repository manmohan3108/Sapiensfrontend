import { CircleHelp, ClipboardCheck, Layers, Target, Users, Wrench } from 'lucide-react';
import { LandingIdentityCore } from './LandingIdentity';

const descriptions = [
  'The Sapiens individual notices incoming information and an unanswered question.',
  'The same Sapiens connects earlier experience with a goal to consider what matters.',
  'The same Sapiens reaches out to people and tools as two ways to participate.',
  'The same Sapiens relates an outcome to earlier experience, informing the next encounter.',
];

// Each scene illustrates one idea. Lines inside a scene show associations;
// directional arrows belong only to the sequence between the stage cards.
export function CycleIllustration({ stage }: { stage: number }) {
  return <svg className="landing-cycle-art" viewBox="0 0 240 144" role="img" aria-label={descriptions[stage]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse className="cycle-art-halo" cx="120" cy="72" rx="94" ry="58" stroke="none" />
    {stage === 0 && <>
      <path d="M63 57L85 66M155 64L178 49" strokeDasharray="3 5" />
      <rect className="cycle-art-paper" x="24" y="30" width="38" height="48" rx="8" />
      <path d="M34 43H52M34 53H52M34 63H46" />
      <CircleHelp x="180" y="28" width="32" height="32" />
    </>}
    {stage === 1 && <>
      <path d="M62 56L85 66M155 66L178 56" />
      <Layers x="26" y="30" width="36" height="36" />
      <Target x="178" y="30" width="36" height="36" />
    </>}
    {stage === 2 && <>
      <path d="M87 82C68 82 64 69 53 64M153 82C172 82 176 69 187 64" />
      <Users x="26" y="30" width="36" height="36" />
      <Wrench x="178" y="30" width="36" height="36" />
    </>}
    {stage === 3 && <>
      <path d="M44 30C82 5 158 5 196 30" strokeDasharray="4 5" />
      <ClipboardCheck x="26" y="30" width="36" height="36" />
      <Layers x="178" y="30" width="36" height="36" />
      <path d="M62 60L85 72M155 72L178 60" />
    </>}
    <g transform="translate(120 76)"><LandingIdentityCore /></g>
    <g className="landing-art-label" stroke="none" fill="currentColor" textAnchor="middle">
      <text x="44" y="100">{['Information', 'Experience', 'People', 'Outcome'][stage]}</text>
      <text x="196" y="100">{['Question', 'Goal', 'Tools', 'Context'][stage]}</text>
    </g>
  </svg>;
}
