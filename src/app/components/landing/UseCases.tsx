import { BookOpen, FlaskConical, Lightbulb, PenLine } from 'lucide-react';
const uses = [
  { icon: PenLine, title: 'For creators', text: 'Keep characters, themes, references, and unfinished ideas close while a body of work grows.' },
  { icon: BookOpen, title: 'For knowledge explorers', text: 'Collect a subject over time and return to it without rebuilding your context.' },
  { icon: FlaskConical, title: 'For researchers', text: 'Experiment with memory structures and observe how new evidence changes understanding.' },
  { icon: Lightbulb, title: 'For curious builders', text: 'Prototype cognitive workflows and study how multiple reasoning processes cooperate.' },
];
export function UseCases() { return <section className="rounded-[2rem] bg-slate-950 px-6 py-16 text-white sm:px-10 lg:px-14" aria-labelledby="uses-heading"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">Made for deep work</p><h2 id="uses-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">When one conversation is not enough.</h2><p className="mt-4 leading-7 text-slate-400">Sapiens is for work where the history, relationships, and evolution of an idea matter as much as the latest prompt.</p></div><div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">{uses.map(({icon: Icon,title,text}) => <article key={title}><Icon className="mb-4 size-5 text-amber-300" /><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 leading-7 text-slate-400">{text}</p></article>)}</div></div></section>; }
