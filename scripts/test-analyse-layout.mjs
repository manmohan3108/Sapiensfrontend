import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import * as React from 'react';
import * as Icons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// No server or API calls. Exercise production render trees and handlers with
// isolated saved-record fixtures and a small state harness.
const h = {
  values: [], refs: [], cursor: 0, refCursor: 0, params: new URLSearchParams(),
  reset(values = []) { this.values = values; this.refs = []; this.params = new URLSearchParams(); this.begin(); },
  begin() { this.cursor = 0; this.refCursor = 0; },
  useState(initial) { const i = h.cursor++; if (!(i in h.values)) h.values[i] = typeof initial === 'function' ? initial() : initial; return [h.values[i], value => { h.values[i] = typeof value === 'function' ? value(h.values[i]) : value; }]; },
  useRef(initial) { const i = h.refCursor++; return h.refs[i] ||= { current: initial }; },
};
globalThis.analyseTest = { React, Icons, h };
const strip = text => text.replace(/^import[\s\S]*?;\r?\n/gm, '');
async function load(path, prelude = '', extra = '') {
  const source = await readFile(new URL('../src/app/' + path, import.meta.url), 'utf8');
  const icons = [...source.matchAll(/import \{([^}]+)\} from 'lucide-react'/g)].map(match => `const {${match[1]}} = globalThis.analyseTest.Icons;`).join('\n');
  const { code } = await transformWithEsbuild(`const React = globalThis.analyseTest.React;\n${icons}\n${prelude}\n${strip(source)}\n${extra}`, path, { loader:'tsx', jsx:'transform', jsxFactory:'React.createElement', jsxFragment:'React.Fragment' });
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const hooks = `const {h} = globalThis.analyseTest;
const useState=h.useState, useRef=h.useRef, useEffect=()=>{}, useMemo=fn=>fn(), useCallback=fn=>fn;
const useSearchParams=()=>[h.params, value=>{h.params=typeof value==='function'?value(h.params):value;}];
const useNavigate=()=>()=>{};
const useSapiensStore=select=>select({currentSapiens:{id:'58',name:'Sapien 58'}});
const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);
const Dialog=({open,children})=>open?children:null, DialogContent=({children})=>children, DialogTitle=({children})=>children, DialogDescription=({children})=>children;
const AnalyseControls=globalThis.analyseTest.Controls;
`;
const { AnalyseControls: Controls } = await load('components/analyse/AnalyseControls.tsx', 'const {useState,useId}=React;');
globalThis.analyseTest.Controls = Controls;
const { AnalyseControls: ControlledToolbar } = await load('components/analyse/AnalyseControls.tsx', 'const useState=globalThis.analyseTest.h.useState; const useId=()=>"filters";');
const children = node => React.isValidElement(node) ? React.Children.toArray(node.props.children) : [];
function all(node) { if (Array.isArray(node)) return node.flatMap(all); if (!React.isValidElement(node)) return []; return [node, ...children(node).flatMap(all)]; }
const find = (tree, predicate) => { const node = all(tree).find(predicate); assert(node, 'Expected UI control'); return node; };
const html = tree => renderToStaticMarkup(tree);
const primaryNames = toolbar => all(toolbar.props.primary).filter(n=>n.type==='input'||n.type==='select').map(n=>n.props.name||n.props['aria-label']||n.props.placeholder);

const {ANALYSE_GROUPS}=await load('components/analyse/AnalyseShell.tsx',hooks);
globalThis.analyseTest.groups=ANALYSE_GROUPS;
const {AnalyseOverview}=await load('components/analyse/AnalyseOverview.tsx',hooks+'const ANALYSE_GROUPS=globalThis.analyseTest.groups;');
let overviewAction='';
const overview=AnalyseOverview({go:id=>overviewAction=id,hrefFor:id=>id==='simulation'?'/admin/simulations?sapienId=58&returnTo=%2Fadmin%2Fanalyse':'/admin/analyse/'+id});
const overviewHtml=html(overview);
assert.equal((overviewHtml.match(/<a /g)||[]).length,13,'Overview destinations are native links');
assert.equal((overviewHtml.match(/<button /g)||[]).length,1,'Only the usage dialog is a button');
assert.equal(all(overview).filter(n=>n.type==='h2').length,4);
for(const group of ANALYSE_GROUPS)for(const item of group.items)assert(overviewHtml.includes(item.label.replaceAll('&','&amp;')));
find(overview,n=>n.type==='button').props.onClick();assert.equal(overviewAction,'usage');
assert(overviewHtml.includes('sapienId=58'));assert(!overviewHtml.includes('notebook-figure'));

h.reset(); let refreshes=0, removed=0;
const props={summary:'All sources',primary:React.createElement('input',{'aria-label':'Search',defaultValue:'query'}),children:React.createElement('input',{name:'source',defaultValue:'teams'}),onRefresh:()=>refreshes++,filters:[{label:'Source: Teams',onRemove:()=>removed++}]};
const toolbar=()=>{h.begin();return ControlledToolbar(props);};
let tree=toolbar();
assert.equal(find(tree,n=>n.props.id==='filters').props.hidden,true);
assert.equal(find(tree,n=>n.props['aria-label']==='Search').props.defaultValue,'query');
assert.equal(find(tree,n=>n.props.name==='source').props.defaultValue,'teams','Folded inputs stay mounted for form submission');
find(tree,n=>n.props['aria-controls']==='filters').props.onClick();
assert.equal(find(toolbar(),n=>n.props.id==='filters').props.hidden,false);
find(tree,n=>n.props.className==='analyse-controls-refresh').props.onClick();
find(tree,n=>n.props['aria-label']==='Remove Source: Teams filter').props.onClick();
assert.equal(refreshes,1);assert.equal(removed,1);
for(const button of all(tree).filter(n=>n.type==='button'))assert.equal(button.props.type,'button','Toolbar controls never submit enclosing filter forms');

const jobs=await load('components/analyse/EngineJobsInspection.tsx',hooks,'export {JobList};');
const defaults={days:7,engine_name:'',status:'',limit:50};
const jobPage={total:1,filters:defaults,limit:50,summary:[{engine_name:'awareness',status:'failed',count:1,retried:1}],jobs:[{id:'job-1',engine_name:'awareness',action:'Review new input',status:'failed',retries:1,max_retries:3,has_error:true,eligibility:'terminal',origin:{source:'conversation'}}]};
h.reset([{...defaults},{filters:{...defaults},cursors:[null],revision:0},jobPage,null,false,[]]);
const renderJobs=()=>{h.begin();return jobs.JobList({sapienId:'58',initialEngine:'',initialJob:''});};
tree=renderJobs();let controls=find(tree,n=>n.type===Controls);
assert.equal(all(controls.props.primary).filter(n=>n.type==='input'||n.type==='select').length,3,'Time, engine and status remain visible');
assert(html(tree).indexOf('Review new input')<html(tree).indexOf('Window summary'),'Records precede aggregate breakdown');
const status=find(controls.props.primary,n=>n.type==='select');status.props.onChange({target:{value:'failed'}});
assert.equal(h.values[1].filters.status,'','Draft edits must not change applied filters');
tree=renderJobs();find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});
assert.equal(h.values[1].filters.status,'failed');assert.deepEqual(h.values[1].cursors,[null]);
for (const variant of [{...jobPage,jobs:[],summary:[],total:0},null]) {h.reset([{...defaults},{filters:{...defaults},cursors:[null],revision:0},variant,null,!variant,[]]); assert(html(renderJobs()).includes('Creation window'));}

const tools=await load('components/analyse/ToolLearningInspection.tsx',hooks,'export {Lessons, LessonPreview, Detail, ServiceSelector, serviceName, toolName};');
h.reset(['',0,undefined]);
tree=tools.ToolLearningInspection({sapienId:'58'});controls=find(tree,n=>n.type===Controls);
assert(primaryNames(controls).includes('q'));assert(primaryNames(controls).includes('scopeChoice'));
assert(!all(controls.props.children).some(n=>n.props.name==='server'),'Service selection replaces the duplicate exact-server filter');
const form=find(tree,n=>n.type==='form');
const NativeFormData=globalThis.FormData;
globalThis.FormData=class {constructor(values){this.values=values;}get(key){return this.values[key]??null;}};
form.props.onSubmit({preventDefault(){},currentTarget:{q:'calendar',scopeChoice:'live',sort:'updated_at',direction:'desc'}});
assert.equal(h.params.get('scope'),'','An empty scope means normal/live, not all scopes');assert.equal(h.params.get('q'),'calendar');
h.params=new URLSearchParams();
form.props.onSubmit({preventDefault(){},currentTarget:{scopeChoice:'run',run:''}});
assert.equal(h.params.toString(),'');assert.match(h.values[0],/run ID/,'Invalid run selection remains a visible validation error');
globalThis.FormData=NativeFormData;

// The actual service catalogue walks every page, not the current filtered list.
let serviceCalls=[];
globalThis.analyseTest.toolApi={get:async (url,{signal}={})=>{
  assert(signal);serviceCalls.push(url);
  const query=new URL(url,'https://example.test').searchParams;
  assert.equal(query.get('sort'),'server');assert.equal(query.has('scope'),false);assert.equal(query.has('q'),false);
  assert.equal(query.has('server'),false);
  const offset=Number(query.get('offset'));
  return {data:{items:offset===0?[{server:'jira'}]:offset===25?[{server:'jira'}]:[{server:'teams'}],next_offset:offset===0?25:offset===25?50:null}};
}};
const {toolLearningService:toolApi}=await load('core/services/toolLearningService.ts','const apiClient=globalThis.analyseTest.toolApi;');
assert.deepEqual(await toolApi.services('58',new AbortController().signal),['jira','teams']);
assert.equal(serviceCalls.length,3,'Teams on the last page is discovered');
const catalogue={key:'58/services/0',attempt:0,data:['jira','teams']};
let chosenService;
h.reset([0,catalogue]);
tree=tools.ServiceSelector({sapienId:'58',version:0,selected:'jira',visibleServices:['jira'],onSelect:value=>chosenService=value});
assert(html(tree).includes('Microsoft Teams'),'Teams remains visible while only Jira results are displayed');
find(tree,n=>n.type==='button'&&n.props.children?.[0]==='Microsoft Teams').props.onClick();assert.equal(chosenService,'teams');
find(tree,n=>n.type==='button'&&n.props.children==='All services').props.onClick();assert.equal(chosenService,null);
h.reset(['',0,undefined]);h.params=new URLSearchParams('server=jira&q=channel&scope=run-2&offset=25&profile=old');
tree=tools.ToolLearningInspection({sapienId:'58'});
find(tree,n=>n.type===tools.ServiceSelector).props.onSelect('teams');
assert.equal(h.params.get('server'),'teams');assert.equal(h.params.get('offset'),null);assert.equal(h.params.get('profile'),null);
assert.equal(h.params.get('q'),'channel');assert.equal(h.params.get('scope'),'run-2');
globalThis.FormData=class {constructor(values){this.values=values;}get(key){return this.values[key]??null;}};
h.begin();tree=tools.ToolLearningInspection({sapienId:'58'});
find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){},currentTarget:{q:'reply',scopeChoice:'live'}});
assert.equal(h.params.get('server'),'teams','Applying filters preserves the selected service');
globalThis.FormData=NativeFormData;
assert(!html(tree).includes('Group by'));
h.reset([0,{key:'58/services/0',attempt:0,error:{message:'Failure'}}]);
tree=tools.ServiceSelector({sapienId:'58',version:0,selected:'jira',visibleServices:['jira'],onSelect(){}});
assert(html(tree).includes('Could not load the full service list'));
find(tree,n=>n.type==='button'&&n.props.children==='Retry service list').props.onClick();assert.equal(h.values[0],1);
// A later-page failure must not be mistaken for a complete Jira-only catalogue.
globalThis.analyseTest.toolApi.get=async url=>{
  if(new URL(url,'https://example.test').searchParams.get('offset')==='0')return {data:{items:[{server:'jira'}],next_offset:25}};
  throw new Error('Second page failed');
};
await assert.rejects(()=>toolApi.services('58',new AbortController().signal),/Second page failed/);
globalThis.analyseTest.toolApi.get=async()=>({data:{items:[],next_offset:0}});
await assert.rejects(()=>toolApi.services('58',new AbortController().signal),/finish reading/);
const cancelled=new AbortController();cancelled.abort();
await assert.rejects(()=>toolApi.services('58',cancelled.signal),{name:'AbortError'});
const midScan=new AbortController();let midScanCalls=0;
globalThis.analyseTest.toolApi.get=async()=>{midScanCalls++;midScan.abort();return {data:{items:[{server:'jira'}],next_offset:25}};};
await assert.rejects(()=>toolApi.services('58',midScan.signal),{name:'AbortError'});
assert.equal(midScanCalls,1,'Leaving the page stops further catalogue requests');
h.reset([0,catalogue]);
assert(!html(tools.ServiceSelector({sapienId:'59',version:0,selected:null,visibleServices:[],onSelect(){}})).includes('Microsoft Teams'),'A new Sapien never shows the previous catalogue');

// Lesson wording is saved evidence, not inferred from documentation or counts.
assert.equal(tools.serviceName('microsoft-teams'),'Microsoft Teams');
assert.equal(tools.serviceName('custom-jira-proxy'),'custom-jira-proxy','Unknown server IDs must not be assigned a guessed provider');
assert.equal(tools.toolName('read_channel_messages'),'Read channel messages');
const learned=html(tools.Lessons({lessons:[{guidance:'Use the channel ID, not its display name.',conditions:'When reading channel messages.',uncertainty:'Private channels were not tested.',evidence_ids:['ev-1','[truncated]'],confidence:0.8}],onEvidence(){}}));
assert(learned.includes('Use the channel ID, not its display name.'));
assert(learned.includes('Private channels were not tested.'));
assert(!learned.includes('Not recorded'),'Missing lesson fields do not add placeholder clutter');
assert(learned.includes('not measured success'));
let openedEvidence='';
tree=tools.Lessons({lessons:[{guidance:'Saved guidance',evidence_ids:['ev-1','[truncated]']}],onEvidence:id=>openedEvidence=id});
find(tree,n=>n.type==='button').props.onClick();assert.equal(openedEvidence,'ev-1');
assert.equal(all(tree).filter(n=>n.type==='button').length,1,'Truncated reference markers cannot open evidence');
for(const [profile,expected] of [
  [{lesson_count:2},'View 2 saved lessons'],
  [{lesson_count:0},'No learned guidance yet'],
  [{lesson_count:1,lessons:[{guidance:'Use the issue key.'}]},'Use the issue key.'],
]) assert(html(tools.LessonPreview({profile})).includes(expected));
const profile={id:'profile-1',server:'teams',tool:'read_channel_messages',scope:'',revision:2,lesson_count:1,updated_at:null,description:'Long tool documentation'};
h.reset(['',0,{key:'58?limit=25',attempt:0,data:{items:[{...profile,lessons:[{guidance:'Use the channel ID.'}]}],total:1,offset:0,limit:25,next_offset:null,configured_mode:'active',as_of:null}}]);
tree=tools.ToolLearningInspection({sapienId:'58'});
assert(html(tree).includes('Use the channel ID.'));assert(html(tree).includes('Microsoft Teams'));
find(tree,n=>n.type==='button'&&n.props.className?.includes('analyse-learning-row')).props.onClick({currentTarget:{focus(){}}});
assert.equal(h.params.get('profile'),'profile-1','Opening saved learning preserves the profile selection route');
h.reset(['lessons','',0,{key:'58/profile-1',attempt:0,data:{profile,evidence:[]}}]);
tree=tools.Detail({sapienId:'58',profileId:'profile-1',close(){}});
const detailHtml=html(tree);
assert(detailHtml.includes('Microsoft Teams'));assert(detailHtml.includes('Exact tool:'));
assert(detailHtml.includes('their text is not included'),'Unavailable lesson text must not be called no learning');
assert(detailHtml.indexOf('What it learned')<detailHtml.indexOf('Tool documentation'));
assert(all(tree).some(n=>n.type==='details'&&html(n).includes('Long tool documentation')),'Documentation is secondary to learning');

// The detail view keeps source evidence accessible, with an explicit return path.
const evidenceRecord={id:'ev-1',available:true,content:'Channel ID was required.',provenance:{server:'teams',tool:'read_channel_messages'}};
h.reset(['lessons','',0,{key:'58/profile-1',attempt:0,data:{profile:{...profile,lessons:[{guidance:'Use the channel ID.'}]},evidence:[evidenceRecord]}}]);
const renderToolDetail=()=>{h.begin();return tools.Detail({sapienId:'58',profileId:'profile-1',close(){}});};
tree=renderToolDetail();
find(tree,n=>n.type==='button'&&n.props.children==='Evidence').props.onClick();
assert(html(renderToolDetail()).includes('Channel ID was required.'));
tree=renderToolDetail();find(tree,n=>n.type==='button'&&n.props.children==='What it learned').props.onClick();
assert(html(renderToolDetail()).includes('Use the channel ID.'));
assert.equal(find(renderToolDetail(),n=>n.type==='button'&&n.props.children==='What it learned').props['aria-pressed'],true);
for(const [query,total,expected] of [
  ['',0,'No saved tool learning yet'],['q=missing',0,'No tools match these filters'],['offset=25',2,'No tools on this page'],
]) {
  const queryKey=query?query+'&limit=25':'limit=25';
  h.reset(['',0,{key:'58?'+queryKey,attempt:0,data:{items:[],total,offset:query.includes('offset')?25:0,limit:25,next_offset:null,configured_mode:'active',as_of:null}}]);
  h.params=new URLSearchParams(query);
  tree=tools.ToolLearningInspection({sapienId:'58'});
  assert(html(tree).includes(expected));
}
h.reset(['',0,{key:'58?limit=25',attempt:0,error:{status:503,message:'Unavailable'}}]);
assert(html(tools.ToolLearningInspection({sapienId:'58'})).includes('Stored-data inspection is unavailable'));

const usage=await load('components/workspace/LlmUsageDialog.tsx',hooks,'export {UsageKindSection};');
h.reset();
tree=usage.UsageKindSection({kind:'llm',sapienId:'58',sapienName:'Sapien 58',compactDetails:true,onRetry(){},state:{loading:false,errors:[],global:null,sapien:{today:'2026-10-26',today_total:4,today_by_tier:{},today_by_purpose:{conversation:4},history:[{date:'2026-10-26',total:4}]}}});
const usageHtml=html(tree);
assert(usageHtml.indexOf('Recent daily per-sapien usage')>usageHtml.indexOf('</details>'),'Daily history stays outside the collapsed purpose breakdown');
assert(usageHtml.includes('UTC date'));

const memory=await load('pages/AnalysePage.tsx',hooks+`
const useRememberedState=(_key,initial)=>h.useState(initial);
Dialog.Root=Dialog; Dialog.Portal=()=>null; Dialog.Overlay=()=>null; Dialog.Content=({children})=>children;
Dialog.Title=({children})=>children; Dialog.Description=({children})=>children; Dialog.Close=({children})=>children;
const Bar=()=>null,BarChart=()=>null,CartesianGrid=()=>null,ResponsiveContainer=()=>null,Tooltip=()=>null,XAxis=()=>null,YAxis=()=>null;
`, 'export {WorkingMemoryAnalysis};');
const snapshot={wm:{entries:[{id:'memory-1',content:'Team prefers morning reviews',memory_source:'memory_unit',activation:0.7,tags:['team'],references:[]}]},sources:[],tags:[{value:'team',count:1}],references:[],summary:{}};
h.reset([false,snapshot,false,'','', '',['team'],'all',[],'activation',null]);
tree=memory.WorkingMemoryAnalysis({sapienId:58,openEngram(){}});controls=find(tree,n=>n.type===Controls);
assert(primaryNames(controls).includes('Search returned memory records'));
assert(html(tree).includes('Team prefers morning reviews'));
assert(!html(tree).includes('Embedding cached'),'Embedding diagnostics do not occupy the list');
assert(!html(tree).includes('Snapshot statistics'),'Snapshot analysis is opened separately');
controls.props.filters[0].onRemove();assert.deepEqual(h.values[6],[],'Removing a visible tag clears its actual filter');

const inquiries=await load('components/analyse/InquiryInspection.tsx',hooks+'const InquiryContext=()=>null;','export {InquiryList};');
h.reset();tree=inquiries.InquiryList({sapienId:'58',kind:'curiosity',initialSource:''});
controls=find(tree,n=>n.type===Controls);
assert(all(controls.props.primary).some(n=>n.type==='select'),'Inquiry assessment filter remains immediately available');

// Closing a signal during a slow read must not reopen it when the reply arrives.
let resolveDetail;
globalThis.analyseTest.service={detail:()=>new Promise(resolve=>{resolveDetail=resolve;})};
globalThis.document={activeElement:null};globalThis.requestAnimationFrame=fn=>{fn();return 0;};
const bus=await load('pages/EngineBusPage.tsx',hooks+'const engineBusService=globalThis.analyseTest.service;');
h.reset([[{id:'signal-1',name:'Signal',producer:'awareness',status:'completed',occurred_at:new Date().toISOString()}],null,false,false,'',null,false,'',null,false,'']);
const renderBus=()=>{h.begin();return bus.EngineBusPage({embedded:true});};
tree=renderBus();
find(tree,n=>n.type==='button'&&n.props.className?.startsWith('group grid')).props.onClick();
tree=renderBus();find(tree,n=>n.props.className==='analyse-detail-back').props.onClick();
resolveDetail({signal:{id:'signal-1'},deliveries:[]});await new Promise(resolve=>setImmediate(resolve));
assert(!all(renderBus()).some(n=>n.props['aria-label']==='Signal detail'),'Late detail result is ignored after closing');
// Saved content stays visible even when it does not use the newest summary shape.
const {InquiryContext}=await load('components/analyse/InquiryContext.tsx');
for (const record of [
  {context:'Maya asked about the meeting.',outcome:'The meeting is on Friday.',source:'Maya asked',answer:'meeting is on Friday'},
  {context:{content:'Meeting question'},outcome:{assessment:{understanding:'Friday confirmed'}},source:'Meeting question',answer:'Friday confirmed'},
  {context:{legacy_source:'Old source'},outcome:{answer:'Old answer'},source:'Old source',answer:'Old answer'},
]) {
  const result=html(React.createElement(InquiryContext,record));
  assert(result.includes(record.source));assert(result.includes(record.answer));
  assert(!result.includes('No recorded outcome retained'));
}
for (const empty of [null,undefined,'   ',{},[]]) {
  const result=html(React.createElement(InquiryContext,{context:empty,outcome:empty}));
  assert(result.includes('No source context retained'));assert(result.includes('No recorded outcome retained'));
}
for (const value of [false,0]) assert(!html(React.createElement(InquiryContext,{context:null,outcome:value})).includes('No recorded outcome retained'));

// Exercise the real graph component's Legend handler through its state sequence.
const graph=await load('components/engram/EngramGraph.tsx',hooks+'const MECH_COLORS={},fmtId=id=>id;');
h.reset();
const renderGraph=()=>{h.begin();return graph.EngramGraph({sapienId:58});};
const legend=tree=>find(tree,n=>n.type==='button'&&n.props.children==='Legend');
legend(renderGraph()).props.onClick();assert.equal(legend(renderGraph()).props['aria-expanded'],true);
h.values[5]={id:'node-1',content:'Memory',memory_type:'episodic'};
legend(renderGraph()).props.onClick();assert.equal(legend(renderGraph()).props['aria-expanded'],true,'Legend opens from node details even if it was open earlier');
assert.equal(h.values[5],null);
legend(renderGraph()).props.onClick();assert.equal(legend(renderGraph()).props['aria-expanded'],false);

// Commit the real navigation hook's layout effects against replaced list nodes.
globalThis.analyseTest.layoutEffects=[];
const readers=await load('components/workspace/ContextReader.tsx',`
const {h}=globalThis.analyseTest;
const useRef=h.useRef,useState=h.useState,useEffect=()=>{};
const useLayoutEffect=effect=>globalThis.analyseTest.layoutEffects.push(effect);
`);
h.reset();let focused='',options;
const row={dataset:{recordId:'goal-2'},focus:value=>{focused='row';options=value;}};
const heading={focus:()=>{focused='heading';}},back={focus:()=>{focused='back';}};
const root={querySelector:selector=>selector==='[data-reader-back]'?back:heading};
const readerFor=(selection,scope=58)=>{h.begin();return readers.useListReaderNavigation(selection,scope);};
const commit=()=>{for(const effect of globalThis.analyseTest.layoutEffects.splice(0))effect();};
let reader=readerFor(null);reader.container.current=root;reader.list.current={scrollTop:420,querySelectorAll:()=>[row]};commit();
reader.remember('goal-2');reader=readerFor('goal-2');reader.list.current=null;commit();assert.equal(focused,'back');
reader=readerFor(null);reader.list.current={scrollTop:0,querySelectorAll:()=>[row]};commit();
assert.equal(focused,'row');assert.deepEqual(options,{preventScroll:true});assert.equal(reader.list.current.scrollTop,420);
reader.remember('goal-2');readerFor('goal-2');commit();reader=readerFor(null);reader.list.current={scrollTop:0,querySelectorAll:()=>[]};commit();assert.equal(focused,'heading','A removed or filtered-out goal falls back to the list heading');
reader.remember('goal-2');readerFor('goal-2');commit();reader=readerFor(null,59);reader.list.current={scrollTop:0,querySelectorAll:()=>[row]};commit();assert.equal(focused,'heading');assert.equal(reader.list.current.scrollTop,0,'A different Sapien never inherits the old list position');
// Analyse Goals has a separate presentation; workspace GoalsPanel is not used.
globalThis.analyseTest.goalReaders=readers;
globalThis.analyseTest.goalService={};
const goalPrelude=hooks+`
const useId=()=>"goal-request";
const {RecordText,recordDate,sourceName}=globalThis.analyseTest.goalReaders;
const useListReaderNavigation=()=>({container:{current:null},list:{current:null},remember:()=>{}});
const goalsService=globalThis.analyseTest.goalService;
`;
const goalsUI=await load('components/analyse/AnalyseGoals.tsx',goalPrelude,'export {GoalRecord, GoalRequest, planSummary, completion, useGoalRead};');
const goalRecord={id:'goal-1',description:'Prepare the release',state:'waiting',finished:false,retired:false,progress:null,motivation:'The team needs a release checklist.',source:'user',owner:'Levi',creator:'Maya',requested_by:'Maya',review_enabled:true,review_at:null,updated_at:'2026-10-27T10:00:00Z',metadata:{},evidence_refs:[]};
const planRecord={...goalRecord,id:'plan-1',description:'Confirm the release checks',tasks:[{id:'step-1',description:'Check the build',state:'failed',finished:true,result:'Build failed in CI.',evidence_refs:['build-42']},{id:'step-2',description:'Review tests',state:'waiting',finished:null,result:'',evidence_refs:[]}]};
assert.equal(goalsUI.planSummary(null),'No plan recorded');
assert.equal(goalsUI.planSummary({...planRecord,tasks:[]}),'Plan has no recorded steps');
assert.equal(goalsUI.planSummary(planRecord),'1 of 2 steps marked finished · 1 unknown');
assert.equal(goalsUI.completion({finished:null}),'Completion unknown');
const goalDetail={goal:goalRecord,current_plan:planRecord,context:null,plan_context:null,history:[],attention:{request_id:'new',resolved_id:'old',requested_at:'2026-10-27T10:01:00Z',resolved_at:'2026-10-27T10:00:00Z',outcome:{assessment:{understanding:'Build failed.',remaining:'Fix CI.'}}}};
h.reset();
let goalHtml=html(goalsUI.GoalRecord({detail:goalDetail,request:{sapienId:58,goalId:'goal-1',onAccepted(){}}}));
for(const expected of ['Prepare the release','Last retained assessment','A newer review was requested','Fix CI.','Build failed in CI.','Completion unknown'])assert(goalHtml.includes(expected),expected);
assert(!goalHtml.includes('line-through'));
assert(goalHtml.indexOf('Current plan')<goalHtml.indexOf('History &amp; record details'));
h.reset();goalHtml=html(goalsUI.GoalRecord({detail:{...goalDetail,current_plan:null},request:{sapienId:58,goalId:'goal-1',onAccepted(){}}}));
assert(!goalHtml.includes('0/0'));assert(goalHtml.includes('No plan has been recorded'));
h.reset([0,{key:'58/open',loading:false,data:{goals:[{...goalRecord,current_plan:planRecord}],count:1}}]);
tree=goalsUI.AnalyseGoals({sapienId:58});
assert(html(tree).includes('Up to 30 goals'));assert(html(tree).includes('Search and source filter this loaded set'));
find(tree,n=>n.props['data-record-id']==='goal-1').props.onClick();assert.equal(h.params.get('goal'),'goal-1');
h.begin();tree=goalsUI.AnalyseGoals({sapienId:58});
controls=find(tree,n=>n.type===Controls);
find(controls.props.primary,n=>n.type==='input').props.onChange({target:{value:'release'}});
assert.equal(h.params.get('goal'),'goal-1','Typing filters must not steal focus by closing the reader');
find(controls.props.primary,n=>n.type==='button'&&n.props.children==='Finished').props.onClick();
assert.equal(h.params.get('goalView'),'finished');assert.equal(h.params.has('goal'),false);
h.reset([0,{key:'58/open',loading:false,data:{goals:[goalRecord]}}]);
assert(!html(goalsUI.AnalyseGoals({sapienId:59})).includes('Prepare the release'),'Sapien switches never show old list data');

// Submit the real request handlers against a stub service; no production writes.
let writes=[],acceptedRequests=0;
globalThis.analyseTest.goalService.comment=async (...args)=>{writes.push(args);return {queued:true};};
globalThis.analyseTest.goalService.replan=async (...args)=>{writes.push(args);};
for(const scope of ['goal','plan','step','revise']) {
  h.reset([true,'  Review the failed build.  ',false,'','']);
  tree=goalsUI.GoalRequest({sapienId:58,goalId:'goal-1',scope,stepId:scope==='step'?'step-1':undefined,onAccepted:()=>acceptedRequests++});
  find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});
  find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(writes.length,1,'Rapid double submit is ignored');
  assert.deepEqual(writes[0],scope==='revise'?[58,'goal-1','Review the failed build.']:[58,'goal-1',{comment:'Review the failed build.',scope,...(scope==='step'?{step_id:'step-1'}:{})}]);
  assert.match(h.values[4],scope==='revise'?/not been confirmed/:/queued/);
  writes=[];
}
assert.equal(acceptedRequests,4);
globalThis.analyseTest.goalService.comment=async()=>{throw Error('Try again later');};
h.reset([true,'Keep my draft',false,'','']);
tree=goalsUI.GoalRequest({sapienId:58,goalId:'goal-1',scope:'goal',onAccepted:()=>{throw Error('Should not run');}});
find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
assert.equal(h.values[1],'Keep my draft');assert.equal(h.values[3],'Try again later');assert.equal(h.values[2],false);
for(const [query,data,error,expected] of [
  ['',{goals:[]},undefined,'No open goals returned'],
  ['goalSearch=unknown',{goals:[goalRecord]},undefined,'No goals match these filters'],
  ['',undefined,'Backend unavailable','Backend unavailable'],
]) {
  h.reset([0,{key:'58/open',loading:false,data,error}]);h.params=new URLSearchParams(query);
  assert(html(goalsUI.AnalyseGoals({sapienId:58})).includes(expected));
}
// Drive the real polling effect through a goal switch and a failed refresh.
globalThis.analyseTest.goalEffects=[];
const goalHooks=await load('components/analyse/AnalyseGoals.tsx',goalPrelude.replace('useEffect=()=>{}','useEffect=fn=>globalThis.analyseTest.goalEffects.push(fn)'),'export {useGoalRead};');
const originalDocument=globalThis.document,originalInterval=globalThis.setInterval,originalClearInterval=globalThis.clearInterval;
let intervals=new Map(),timerId=0,listeners=new Set();
globalThis.document={visibilityState:'visible',addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
globalThis.setInterval=fn=>{intervals.set(++timerId,fn);return timerId;};globalThis.clearInterval=id=>intervals.delete(id);
h.reset();let oldResolve;
goalHooks.useGoalRead('old',()=>new Promise(resolve=>oldResolve=resolve));
const oldCleanup=globalThis.analyseTest.goalEffects.pop()();oldCleanup();
h.begin();goalHooks.useGoalRead('new',async()=>({description:'New goal'}));
const newCleanup=globalThis.analyseTest.goalEffects.pop()();await new Promise(resolve=>setImmediate(resolve));
oldResolve({description:'Old goal'});await new Promise(resolve=>setImmediate(resolve));
assert.equal(h.values[1].data.description,'New goal');newCleanup();
h.begin();goalHooks.useGoalRead('new',async()=>{throw Error('Refresh failed');});
const failedCleanup=globalThis.analyseTest.goalEffects.pop()();await new Promise(resolve=>setImmediate(resolve));
assert.equal(h.values[1].data.description,'New goal');assert.equal(h.values[1].error,'Refresh failed');failedCleanup();
assert.equal(intervals.size,0);assert.equal(listeners.size,0);
globalThis.document=originalDocument;globalThis.setInterval=originalInterval;globalThis.clearInterval=originalClearInterval;
console.log('Analyse checks passed, including Goals URL navigation, completion distinctions, request scopes, duplicate-submit protection and existing regressions. No network or server used.');
