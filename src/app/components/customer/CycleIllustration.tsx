import { CircleHelp, ClipboardCheck, Layers, Search, Target, Users, Wrench } from 'lucide-react';

const descriptions = [
  'Information and an unanswered question gathered around an investigation.',
  'Earlier context and a goal brought together to consider a decision.',
  'One individual connected to people and tools as two ways to participate.',
  'An outcome connected back to the individual’s existing context.',
];

// Each scene illustrates one idea. Lines inside a scene show associations;
// directional arrows belong only to the sequence between the stage cards.
export function CycleIllustration({ stage }: { stage: number }) {
  return <svg className="landing-cycle-art" viewBox="0 0 240 144" role="img" aria-label={descriptions[stage]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse className="cycle-art-halo" cx="120" cy="72" rx="94" ry="58" stroke="none" />
    {stage === 0 && <>
      <path d="M71 62L98 73M150 70L175 51" strokeDasharray="3 5" />
      <rect className="cycle-art-paper" x="32" y="38" width="42" height="52" rx="8" />
      <path d="M43 52H61M43 62H61M43 72H54" />
      <circle className="cycle-art-paper" cx="120" cy="79" r="29" />
      <Search x="102" y="61" width="36" height="36" />
      <CircleHelp x="174" y="33" width="32" height="32" />
      <circle cx="88" cy="28" r="3" fill="currentColor" stroke="none" />
    </>}
    {stage === 1 && <>
      <path d="M69 63L105 77M171 63L135 77" />
      <Layers x="34" y="38" width="36" height="36" />
      <Target x="171" y="38" width="36" height="36" />
      <path className="cycle-art-paper" d="M120 57L146 83L120 109L94 83Z" />
      <circle cx="120" cy="83" r="6" fill="currentColor" stroke="none" />
      <path d="M120 110V124" strokeDasharray="2 4" />
    </>}
    {stage === 2 && <>
      <path d="M120 58V74M120 74C120 89 58 75 58 93M120 74C120 89 182 75 182 93" />
      <circle cx="120" cy="41" r="20" />
      <circle cx="120" cy="41" r="10" fill="currentColor" stroke="none" />
      <Users x="40" y="92" width="36" height="36" />
      <Wrench x="164" y="92" width="36" height="36" />
    </>}
    {stage === 3 && <>
      <path d="M65 49C97 15 159 21 185 51M185 97C149 129 94 123 65 94" strokeDasharray="4 5" />
      <ClipboardCheck x="42" y="55" width="36" height="36" />
      <Layers x="166" y="55" width="36" height="36" />
      <path d="M79 73H101M139 73H165" />
      <circle className="cycle-art-paper" cx="120" cy="73" r="19" />
      <circle cx="120" cy="73" r="8" fill="currentColor" stroke="none" />
    </>}
  </svg>;
}
