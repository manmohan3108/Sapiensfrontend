import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import * as React from 'react';
import * as Icons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Real presentation components, isolated fixtures. No browser, server or live API.
const h = {
  values: [], refs: [], effects: [], pending: [], params: new URLSearchParams(),
  reset(values = []) { this.effects.forEach(effect => effect?.cleanup?.()); this.values = values; this.refs = []; this.effects = []; this.pending = []; this.params = new URLSearchParams(); this.begin(); },
  begin() { this.cursor = 0; this.refCursor = 0; this.effectCursor = 0; },
  useState(initial) { const i = h.cursor++; if (!(i in h.values)) h.values[i] = typeof initial === 'function' ? initial() : initial; return [h.values[i], value => { h.values[i] = typeof value === 'function' ? value(h.values[i]) : value; }]; },
  useRef(initial) { return h.refs[h.refCursor++] ||= { current: initial }; },
  useEffect(fn, deps) { const i = h.effectCursor++; const old = h.effects[i]; if (!old || deps.some((value, k) => value !== old.deps[k])) { old?.cleanup?.(); const effect = { deps }; h.effects[i] = effect; h.pending.push(() => { effect.cleanup = fn(); }); } },
  flush() { h.pending.splice(0).forEach(fn => fn()); },
};
globalThis.simulationTest = { React, Icons, h };
const strip = source => source.replace(/^import[\s\S]*?;\r?\n/gm, '');
async function load(path, prelude = '', extra = '') {
  const source = await readFile(new URL('../src/app/' + path, import.meta.url), 'utf8');
  const icons = [...source.matchAll(/import \{([^}]+)\} from 'lucide-react'/g)].map(match => `const {${match[1]}} = globalThis.simulationTest.Icons;`).join('\n');
  const { code } = await transformWithEsbuild(`const React=globalThis.simulationTest.React;\n${icons}\n${prelude}\n${strip(source)}\n${extra}`, path, { loader:'tsx', jsx:'transform', jsxFactory:'React.createElement', jsxFragment:'React.Fragment' });
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const hooks = `const {h}=globalThis.simulationTest;
const useState=h.useState,useRef=h.useRef,useEffect=h.useEffect;
const useSearchParams=()=>[h.params,value=>{h.params=typeof value==='function'?value(h.params):value;}];
const useLocation=()=>({search:'?sapienId=65&sapienName=Rashi&returnTo=%2Fadmin%2Fanalyse'});
const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);
const Button=({children,variant,size,...props})=>React.createElement('button',props,children);
`;
const model = await load('components/simulation/simulationOverviewModel.ts');
globalThis.simulationTest.model = model;
const modelImports = `const {${Object.keys(model).join(',')}}=globalThis.simulationTest.model;`;
const primitives = await load('components/analyse/DiagnosticPrimitives.tsx', 'const {useState,useId}=React;');
globalThis.simulationTest.primitives = primitives;
const primitiveImports = 'const {DiagnosticText,DiagnosticDisclosure,DiagnosticBadge}=globalThis.simulationTest.primitives;';
const reader = await load('components/simulation/SimulationRecordReader.tsx', hooks + modelImports + primitiveImports, 'export {LinkedDecisions};');
globalThis.simulationTest.reader = reader;
const { SimulationVisualOverview } = await load('components/simulation/SimulationVisualOverview.tsx', hooks + modelImports + primitiveImports + `
const {SimulationRecordReader,activityOrigin}=globalThis.simulationTest.reader;
const useSimulationOverview=()=>globalThis.simulationTest.state;
`);
const { SimulationShell, SIMULATION_SECTIONS } = await load('components/simulation/SimulationShell.tsx', hooks + modelImports + `const OpenRunWorkspace=({sapienId})=>React.createElement('button',{'data-sapien':sapienId},'Open this Sapien’s workspace');`);

const run = { run_id:'run-example', sapien_id:65, participant_id:'rashi', case_id:'sentinel_desk', status:'running', simulated_time:'2026-01-05T09:00:00Z', speed:20, event_count:430 };
const record = (patch = {}) => ({ record_id:'record-8', sequence:8, category:'message', event_type:'MessageDelivered', occurred_at:'2026-01-05T09:00:00Z', observed_at:'2026-10-30T08:00:00Z', connection:'teams', message_id:'message-1', channel_id:null, issue_key:null, payload:{sender_id:'rashi',recipient_id:'arjun',text:'Which tenant boundary should I check?'}, arguments:null, result:null, ...patch });
const outgoing = record();
const incoming = record({record_id:'record-7',sequence:7,message_id:'message-2',payload:{sender_id:'arjun',recipient_id:'rashi',text:'Please review the boundary.'}});
const tool = record({record_id:'record-6',sequence:6,message_id:null,event_type:'ToolActivity',category:'tool',connection:'jira',issue_key:'SD-7',payload:{actor_id:'rashi',tool:'jira_get_issue'},arguments:{issue_key:'SD-7'}});
const page = { run_id:run.run_id, participant_id:'rashi', through:430, items:[outgoing,incoming,tool], has_more:true, next_before:6 };
const overview = { run_id:run.run_id, participant_id:'rashi', through:430, partial:false, evaluation:{available:false,reason:'run_not_finished'} };
const spec = {specification:{scenario:{initial_world:{people:[{person_id:'rashi',name:'Rashi',facts:[{key:'role',text:'Engineer'}]},{person_id:'arjun',name:'Arjun',facts:[]}],channels:[]}},overview:{mission:'Coordinate the team’s tenant-isolation work.'}}};
const state = {snapshot:{overview,spec,page},loading:false,loadingMore:false,error:'',contextError:'',refresh(){},loadMore(){}};
globalThis.simulationTest.state = state;
const children = node => React.isValidElement(node) ? React.Children.toArray(node.props.children) : [];
function all(node) { if (Array.isArray(node)) return node.flatMap(all); if (!React.isValidElement(node)) return []; return [node,...children(node).flatMap(all)]; }
const find = (tree, predicate) => { const found=all(tree).find(predicate); assert(found,'Expected UI element'); return found; };
const html = tree => renderToStaticMarkup(tree);

assert.equal(model.toolOutcome(tool).label,'Tool outcome not recorded');
for (const missing of [undefined,null,'false',0]) assert.equal(model.toolOutcome({...tool,payload:{...tool.payload,is_error:missing}}).tone,'neutral');
assert.equal(model.toolOutcome({...tool,payload:{is_error:false}}).tone,'success');
assert.equal(model.toolOutcome({...tool,payload:{is_error:true}}).tone,'danger');
assert.equal(model.toolOutcome(outgoing),null);
assert.equal(model.canInspectDecision(incoming,'rashi'),true);
assert.equal(model.canInspectDecision(outgoing,'rashi'),false);
assert.equal(model.canInspectDecision(incoming,null),false);
assert.equal(model.activityLabel(outgoing,'rashi'),'Sent message');
assert.equal(model.activityLabel(tool,'rashi'),'Read issue');
assert.equal(model.simulationTime('invalid'),'Time not recorded');
assert.match(model.simulationTime('2026-01-05T09:00:00Z'),/2:30 pm IST/i);
const delivery=record({record_id:'delivery-2',payload:{...outgoing.payload,recipient_id:'grace'}});
const grouped=model.groupActivity([outgoing,delivery,incoming]);
assert.equal(grouped.length,2); assert.equal(grouped[0].records.length,2,'All delivery evidence retained');
assert.equal(model.groupActivity([outgoing,{...outgoing,record_id:'other',message_id:'other'}]).length,2,'Matching prose is never deduplicated');
assert.equal(model.mergeActivityPages(page,{...page,items:[tool,record({record_id:'older'})],has_more:false}).items.length,4);
assert.throws(()=>model.mergeActivityPages(page,{...page,through:431}),/snapshot changed/);
assert.throws(()=>model.mergeActivityPages(page,{...page,run_id:'another-run'}),/snapshot changed/);
const lab=new URL(model.simulationLabReturn(run,'Rashi','/admin/analyse/awareness'),'https://test.invalid');
assert.equal(lab.searchParams.get('runId'),run.run_id);assert.equal(lab.searchParams.get('sapienId'),'65');
assert.equal(lab.searchParams.get('returnTo'),'/admin/analyse/awareness');
assert(!model.simulationLabReturn(run,'Rashi','https://other.invalid').includes('returnTo'));
const sectionUrl=new URL(model.simulationSectionPath(run,'messages','Rashi','/admin/analyse/awareness'),'https://test.invalid');
assert.equal(sectionUrl.searchParams.get('sapienId'),'65');assert.equal(sectionUrl.searchParams.get('sapienName'),'Rashi');
assert.equal(sectionUrl.searchParams.get('returnTo'),'/admin/analyse/awareness');assert(!sectionUrl.searchParams.has('runId'));

h.reset();
let tree=SimulationVisualOverview({run,knownSapienName:'Rashi'});
let markup=html(tree);
assert(markup.includes('Assigned role: Engineer'));assert(markup.includes('Which tenant boundary should I check?'));
assert(markup.indexOf('Recorded activity')<markup.indexOf('The setting'),'Evidence precedes secondary context');
assert(markup.includes('Rashi → Arjun'));assert(!markup.includes('Verified results'));
assert(markup.includes('No final evaluation yet'));assert(markup.includes('Simulated time:'));
assert.equal(all(tree).filter(n=>n.props['aria-current']==='true').length,1);
let frames=[];globalThis.requestAnimationFrame=fn=>frames.push(fn);
find(tree,n=>n.type==='button' && n.props['aria-controls']==='simulation-activity-reader' && !n.props['aria-current']).props.onClick();
assert.equal(h.params.get('activity'),'message:message-2');assert.equal(h.values[0],true);
h.begin();tree=SimulationVisualOverview({run,knownSapienName:'Rashi'});
assert(html(tree).includes('Linked decisions &amp; actions'));
find(tree,n=>n.props.className==='sv-back').props.onClick();assert.equal(h.values[0],false);
h.params.set('activity','record:not-loaded');h.begin();tree=SimulationVisualOverview({run});
assert(html(tree).includes('Selected entry is outside the loaded records'),'Do not silently display a different record for a saved selection');
for (const testState of [
  {...state,snapshot:null,loading:true},
  {...state,snapshot:null,error:'Network unavailable'},
  {...state,snapshot:{...state.snapshot,page:{...page,items:[],has_more:false}}},
  {...state,error:'Refresh failed'},
  {...state,snapshot:{...state.snapshot,overview:{...overview,partial:true,evaluation:{available:true}}}},
]) {
  h.reset();globalThis.simulationTest.state=testState;markup=html(SimulationVisualOverview({run}));
  if(testState.loading) assert(markup.includes('Loading recorded activity'));
  if(testState.error) assert(markup.includes('role="alert"'));
  if(testState.snapshot?.page.items.length===0) assert(markup.includes('No participant activity'));
  if(testState.error && testState.snapshot) assert(markup.includes('Which tenant boundary'),'Stale records remain visible after refresh error');
  if(testState.snapshot?.overview.partial) assert(markup.includes('partial retained evidence'));
}
const names=new Map([['rashi','Rashi'],['arjun','Arjun']]);
const readProps={records:[tool],runId:run.run_id,participant:'rashi',names,channels:new Map(),hrefFor:section=>model.simulationSectionPath(run,section,'Rashi','/admin/analyse')};
h.reset();markup=html(reader.SimulationRecordReader(readProps));assert(markup.includes('Tool outcome not recorded'));assert(!markup.includes('Tool reported success'));assert(markup.includes('SD-7'));
for(const status of ['unavailable','ambiguous','linked']) {
  h.reset([{link_status:status,through:440,reason:'conversation_match_not_unique',beat:null,actions:[],actions_truncated:false,missing_operation_ids:[]},'',0]);
  markup=html(reader.LinkedDecisions({...readProps,source:incoming}));
  if(status==='linked') assert(markup.includes('No external action is included'));
  else {assert(markup.includes('Browse conversations'));assert(!markup.includes('Outcome not yet established'));}
}

h.reset();tree=SimulationShell({run,name:'Rashi',section:'messages',children:React.createElement('p',null,'Body unchanged')});markup=html(tree);
assert.equal(SIMULATION_SECTIONS.filter(n=>n.id==='overview').length,1);
assert(!markup.includes('Overview Old'));assert(markup.includes('Body unchanged'));assert(markup.includes('aria-current="page"'));
for(const link of all(tree).filter(n=>n.type==='a'||n.props.to)) {
  if(link.props.to?.includes('/world/')) assert(link.props.to.includes('sapienId=65'));
}
find(tree,n=>n.props['aria-controls']==='simulation-mobile-sections').props.onClick();h.begin();tree=SimulationShell({run,name:'Rashi',section:'messages',children:null});
assert(all(tree).some(n=>n.props.id==='simulation-mobile-sections'));
h.reset();tree=SimulationShell({run,name:'Rashi',section:'people',children:null});
assert(html(tree).includes('All diagnostics'));assert(all(tree).some(n=>n.props['aria-current']==='page'&&n.props.to.includes('/diagnostics')));

// Exercise real async loader against controllable read-only API responses.
const calls=[];
const deferred=(kind,args)=>new Promise((resolve,reject)=>calls.push({kind,args,resolve,reject}));
globalThis.simulationTest.service={inspectionOverview:(...args)=>deferred('overview',args),inspectionSpecification:(...args)=>deferred('spec',args),inspectionJourney:(...args)=>deferred('journey',args)};
const {useSimulationOverview}=await load('components/simulation/useSimulationOverview.ts',hooks+modelImports+'const simulationService=globalThis.simulationTest.service;');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const take=kind=>{const index=calls.findIndex(call=>call.kind===kind);assert(index>=0,kind);return calls.splice(index,1)[0];};
const renderHook=id=>{h.begin();const result=useSimulationOverview(id);h.flush();return result;};
h.reset();renderHook(run.run_id);take('overview').resolve(overview);await settle();
take('spec').reject(new Error('Specification unavailable'));let request=take('journey');assert.deepEqual(request.args[1],{through:430,order:'desc',limit:30});request.resolve(page);await settle();
let result=renderHook(run.run_id);assert.equal(result.snapshot.page.items.length,3);assert(result.contextError);assert(!result.error);
const more=result.loadMore();request=take('journey');assert.equal(request.args[1].before,6);assert.equal(request.args[1].through,430);assert(!('after' in request.args[1]));
request.resolve({...page,items:[tool,record({record_id:'older'})],has_more:false});await more;result=renderHook(run.run_id);assert.equal(result.snapshot.page.items.length,4);
result.refresh();renderHook(run.run_id);take('overview').reject(new Error('Refresh failed'));await settle();result=renderHook(run.run_id);assert(result.error);assert.equal(result.snapshot.page.items.length,4);
result.refresh();renderHook(run.run_id);const stale=take('overview');renderHook('new-run');assert(stale.args[2].aborted,'Switching run aborts the previous load');stale.resolve(overview);await settle();assert.equal(renderHook('new-run').snapshot,null,'Old run never replaces new run');
take('overview').resolve({...overview,run_id:'new-run'});await settle();take('spec').resolve(spec);take('journey').resolve({...page,run_id:'new-run'});await settle();assert.equal(renderHook('new-run').snapshot.overview.run_id,'new-run');
h.reset();
const routeSource=await readFile(new URL('../src/app/pages/SimulationWorldPage.tsx',import.meta.url),'utf8');
const validRoutes=routeSource.match(/const valid = \[([^\]]+)\]/)?.[1] || '';
for(const section of SIMULATION_SECTIONS)assert(validRoutes.includes(`'${section.id}'`),`Navigation target ${section.id} is still routed`);
console.log('Simulation overview checks passed: evidence semantics, grouping, selection, missing/partial/error states, navigation and async pagination/run-switch handling. No server or live records used.');
