import { useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, MessageCircle, Plus, ChevronRight } from 'lucide-react';

const stages = [
  { title: 'Make it yours', detail: 'Give your Sapiens a name and a focus.' },
  { title: 'Bring an idea', detail: 'Start with a question, a thought, or some background.' },
  { title: 'Come back to it', detail: 'Revisit a saved conversation and keep exploring.' },
];

export function ProductStudyHero({ cta }: { cta: ReactNode }) {
  const [stage, setStage] = useState(0);
  return <section className="studio-introduction direction-wrap">
    <div className="studio-opening">
      <div><p className="direction-eyebrow">MEET SAPIENS</p><h1>An AI individual.<br/><em>Shaped by experience.</em></h1></div>
      <div className="studio-opening-copy"><p>An individual you can return to, around the ideas, interests and goals that matter to you.</p><div className="direction-actions">{cta}<a href="#studio-walkthrough">Explore the product <ArrowRight size={16}/></a></div></div>
    </div>
    <div id="studio-walkthrough" className="studio-walkthrough">
      <div className="studio-guide"><span className="direction-eyebrow">A FIRST LOOK</span><h2>From a first idea<br/>to an ongoing<br/><em>conversation.</em></h2><div className="studio-stages" aria-label="Product walkthrough">{stages.map((item,i)=><button key={item.title} onClick={()=>setStage(i)} aria-pressed={stage===i} aria-controls="studio-example"><span className="studio-step-number">0{i+1}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={17}/></button>)}</div><p className="studio-demo-note">Illustrative walkthrough · no account needed</p></div>
      <div className="studio-workspace" id="studio-example" aria-live="polite">
        <div className="studio-window-bar"><span>sapiens <span className="studio-asterisk">✳</span></span><span>Product preview</span></div>
        <div className="studio-example-body" key={stage}>
          {stage===0 && <div className="studio-create"><img src="/concepts/sapiens-amber.png" alt="Amber Sapiens sculpture" width="112" height="112"/><h3>Create your Sapiens</h3><p>A name. A starting point. Something to explore.</p><dl><div><dt>Name</dt><dd>Atlas</dd></div><div><dt>Focus <span>(optional)</span></dt><dd>Ideas and reading</dd></div></dl><button className="studio-example-next" onClick={()=>setStage(1)}>See a conversation <ArrowRight size={17}/></button></div>}
          {stage===1 && <div className="studio-conversation"><div className="studio-atlas"><img src="/concepts/sapiens-amber.png" width="38" height="38" alt=""/><span>Atlas<small>Ideas and reading</small></span></div><div className="studio-message"><span>YOU</span><p>I want to start a small reading group. Where should I begin?</p></div><div className="studio-reply"><span>ATLAS</span><p>Start with the kind of conversation you want to have. Is this a group for exploring new ideas, or going deeper into a shared interest?</p></div><div className="studio-composer"><span>Continue the conversation…</span><ArrowUpRight size={18}/></div><p className="studio-demo-note">Example exchange, not a live AI response.</p></div>}
          {stage===2 && <div className="studio-return"><div className="studio-atlas"><img src="/concepts/sapiens-amber.png" width="38" height="38" alt=""/><span>Atlas<small>Ideas and reading</small></span></div><h3>A place to pick up<br/>where you left off.</h3><p>Saved conversations stay within reach.</p><button className="studio-saved" onClick={()=>setStage(1)}><MessageCircle size={20}/><span>Starting a reading group<small>Open the example conversation</small></span><ArrowUpRight size={18}/></button><div className="studio-new"><Plus size={17}/> A new question can start a new conversation.</div><p className="studio-demo-note">Selected past context may inform later replies.</p></div>}
        </div>
        <div className="studio-workspace-bottom"><span>0{stage+1} / 03</span><span>{stages[stage].title}</span><button onClick={()=>setStage((stage+1)%3)} aria-label={stage===2?'Restart walkthrough':'Next walkthrough step'}><ArrowRight size={19}/></button></div>
      </div>
    </div>
    <div className="studio-concept-note"><span className="direction-eyebrow">SHAPED BY EXPERIENCE</span><p>We’re building AI that notices, asks questions, develops understanding and acts—connecting what it encounters with what comes next.</p></div>
  </section>;
}
