import { useEffect, useRef } from 'react';
import '../../../styles/science-background-study.css';

const wave = Array.from({length:121},(_,i)=>`${i?'L':'M'}${i*5} ${55-Math.sin(i/120*Math.PI*6)*31}`).join(' ');
function Prism() {
  return <><path className="study-guide" d="M5 100H245M125 8V150"/><path className="study-glass" d="M115 20L55 132H185Z"/><path d="M5 68L82 81L146 78"/>
    {[0,1,2,3,4].map(i=><path key={i} className={i%2?'study-amber':'study-copper'} opacity={1-i*.12} d={`M146 78L240 ${72+i*16}`}/>)}
    <path className="study-light" d="M5 68L82 81L146 78L240 104" pathLength="100"/><path className="study-guide" d="M91 64A24 24 0 0 1 105 93"/><text x="99" y="63">θ</text></>;
}
function Instrument() {
  return <><path className="study-guide" d="M15 158H220M110 10V175"/><g transform="rotate(28 105 60)"><path className="study-glass" d="M89 18H118V89H89Z"/><path d="M85 12H122V23H85ZM94 89V102H113V89"/></g><path d="M139 58C197 79 198 135 158 151M145 75C179 94 176 122 151 136M65 116H144M102 117V144M73 158Q112 134 160 158V168H73Z"/><circle cx="148" cy="79" r="10"/><circle className="study-copper" cx="148" cy="79" r="4"/><path className="study-copper" d="M82 109H121M111 124L133 135"/></>;
}
/** Optional background only. Remove its single mount to revert. */
export function ScienceBackgroundStudy() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const layer=ref.current, page=layer?.parentElement;
    if(!layer||!page) return;
    const opening=page.querySelector('.experience-opening'), copy=page.querySelector('.experience-opening-copy'), system=page.querySelector('.world-section'), contact=page.querySelector('.spectrum-contact');
    const place=()=>{
      const base=page.getBoundingClientRect(), hero=opening?.getBoundingClientRect(), text=copy?.getBoundingClientRect(), graph=system?.getBoundingClientRect(), end=contact?.getBoundingClientRect();
      if(!hero||!text||!graph||!end) return;
      const set=(name:string,value:number)=>layer.style.setProperty(name,`${Math.round(value)}px`);
      set('--study-copy-left',text.left-base.left); set('--study-copy-width',text.width);
      const paragraph=copy?.querySelector('p')?.getBoundingClientRect();
      if(paragraph) {
        set('--study-aside-left',paragraph.right-base.left+10);
        set('--study-aside-top',paragraph.top-base.top);
        set('--study-aside-width',Math.max(0,text.right-paragraph.right-14));
      }
      set('--study-top',hero.top-base.top+8); set('--study-top-height',Math.max(0,text.top-hero.top-18));
      set('--study-prism-top',text.bottom-base.top+8); set('--study-prism-height',Math.max(0,hero.bottom-text.bottom-20));
      set('--study-wave-top',hero.bottom-base.top-61);
      set('--study-lab-top',graph.bottom-base.top+7); set('--study-lab-height',Math.max(0,end.top-graph.bottom-14));
      set('--study-rail-top',graph.top-base.top+220); set('--study-rail-width',Math.max(22,graph.left-base.left-6));
    };
    const resize=new ResizeObserver(place);
    [page,opening,copy,system,contact].forEach(e=>e&&resize.observe(e)); place();
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-in-view',entry.isIntersecting)));
    layer.querySelectorAll('svg').forEach(e=>observer.observe(e));
    const visibility=()=>layer.classList.toggle('is-paused',document.hidden);
    document.addEventListener('visibilitychange',visibility); visibility();
    return ()=>{resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);};
  },[]);
  return <div ref={ref} className="science-background-study" aria-hidden="true">
    <svg className="study-orbits" viewBox="0 0 500 115" focusable="false">
      <path className="study-guide" d="M0 57H500M110 3V112M375 3V112"/>
      <g className="study-orbital-motion">{[0,60,120].map(a=><ellipse key={a} cx="110" cy="57" rx="53" ry="20" transform={`rotate(${a} 110 57)`}/>)}<circle className="study-dot" cx="163" cy="57" r="4"/></g>
      <circle className="study-dot" cx="110" cy="57" r="4"/><path d="M295 83L350 16L423 34L446 91L365 106ZM350 16L365 106L423 34L295 83L446 91Z"/><path className="study-guide" d="M295 83L375 57L446 91M375 57L350 16"/><text x="224" y="63">π</text><text x="460" y="32">∠</text>
    </svg>
    <svg className="study-prism" viewBox="0 0 250 180" focusable="false"><Prism/></svg>
    <svg className="study-mobile-prism" viewBox="0 0 250 180" focusable="false"><Prism/></svg>
    <svg className="study-wave" viewBox="0 0 900 110" focusable="false">
      <g className="study-guide">{Array.from({length:13},(_,i)=><path key={i} d={`M${150+i*50} 10V100`}/>)}<path d="M140 24H760M140 55H760M140 86H760"/></g>
      <path d="M140 55H774M150 100V5M768 50L774 55L768 60"/><g transform="translate(150 0)"><path className="study-copper" d={wave}/><path className="study-wave-motion" d={wave} pathLength="100"/></g><text x="103" y="63">∿</text><text x="788" y="60">x</text><text x="132" y="16">y</text>
    </svg>
    <svg className="study-pendulum" viewBox="0 0 90 340" focusable="false"><path d="M9 22H81M45 22V35"/><path className="study-guide" d="M45 35V255M8 244Q45 272 82 244"/><g className="study-pendulum-motion"><path d="M45 35V232"/><circle className="study-glass" cx="45" cy="244" r="12"/></g><text x="31" y="304">θ</text></svg>
    <svg className="study-helix" viewBox="0 0 90 380" focusable="false">
      {Array.from({length:17},(_,i)=>{const y=20+i*20,x=Math.sin(i*Math.PI/8)*30;return <path className="study-guide" key={i} d={`M${45-x} ${y}H${45+x}`}/>;})}
      <path d="M45 20C-15 73 105 127 45 180S-15 287 45 340"/><path className="study-copper" d="M45 20C105 73-15 127 45 180S105 287 45 340"/>
    </svg>
    <svg className="study-lab" viewBox="0 0 920 180" focusable="false">
      <g><Instrument/></g><g transform="translate(300 0)"><Prism/></g>
      <g transform="translate(660 0)"><path className="study-guide" d="M0 154H240M120 12V170"/><g transform="rotate(-25 118 65)"><path className="study-glass" d="M30 43H179V83H30ZM179 36H194V90H179Z"/><path d="M14 51H30V75H14M194 41H205V85H194"/></g><path d="M117 91V110M117 110L71 160M117 110L164 160M117 110V165"/><circle className="study-copper" cx="117" cy="97" r="7"/></g>
    </svg>
  </div>;
}

