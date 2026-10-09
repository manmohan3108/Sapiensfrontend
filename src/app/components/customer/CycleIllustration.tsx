import identity from '../../../assets/landing/identity-480.webp';
import information from '../../../assets/landing/information.webp';
import question from '../../../assets/landing/question.webp';
import experience from '../../../assets/landing/experience.webp';
import goal from '../../../assets/landing/goal.webp';
import person from '../../../assets/landing/person.webp';
import tool from '../../../assets/landing/tool.webp';
import outcome from '../../../assets/landing/outcome.webp';
import context from '../../../assets/landing/context.webp';

const stages = [
  [{ image: information, label: 'Information' }, { image: question, label: 'A question' }],
  [{ image: experience, label: 'Earlier experience' }, { image: goal, label: 'A goal' }],
  [{ image: person, label: 'People' }, { image: tool, label: 'Tools' }],
  [{ image: outcome, label: 'An outcome' }, { image: context, label: 'Retained context' }],
];

// Both subjects relate to the same individual. These lines are associations,
// not a sequence between the subjects; arrows connect only the stage cards.
export function CycleIllustration({ stage }: { stage: number }) {
  return <div className="landing-cycle-art">
    <svg className="landing-card-associations" viewBox="0 0 240 160" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M120 86C120 98 50 86 50 104M120 86C120 98 190 86 190 104" />
    </svg>
    <div className="landing-card-identity">
      <img src={identity} width="64" height="64" loading="lazy" alt="" />
      <span>Sapiens</span>
    </div>
    <div className="landing-card-subjects">
      {stages[stage].map(subject => <figure key={subject.label}>
        <img src={subject.image} width="80" height="80" loading="lazy" decoding="async" alt="" />
        <figcaption>{subject.label}</figcaption>
      </figure>)}
    </div>
  </div>;
}
