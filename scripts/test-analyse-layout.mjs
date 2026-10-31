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

const wmPresentation=await load('components/analyse/workingMemoryPresentation.ts',`const sourceName=value=>({awareness_thought:'Recorded understanding',teams:'Teams',jira:'Jira'}[value]||value||'Source not supplied');`);
globalThis.analyseTest.wmPresentation=wmPresentation;
const memory=await load('components/analyse/WorkingMemoryAnalysis.tsx',hooks+`
const {activationBuckets,activationLabel,matchesMemory,memoryDate,memoryKind,memoryOrigin,memoryTimes}=globalThis.analyseTest.wmPresentation;
const sourceName=value=>value;
const useRememberedState=(_key,initial)=>h.useState(initial);
Dialog.Root=Dialog; Dialog.Portal=()=>null; Dialog.Overlay=()=>null; Dialog.Content=({children})=>children;
Dialog.Title=({children})=>children; Dialog.Description=({children})=>children; Dialog.Close=({children})=>children;
const DiagnosticDisclosure=({title,children})=>React.createElement('details',null,React.createElement('summary',null,title),children);
`, 'export {MemoryDetails, SnapshotDetails};');
const snapshot={wm:{entries:[{id:'memory-1',content:'Team prefers morning reviews',memory_source:'memory_unit',activation:0.7,tags:['team'],references:[]}]},sources:[],tags:[{value:'team',count:1}],references:[],summary:{}};
const memoryKey=JSON.stringify([58,'',['team'],'all',[],'activation']);
h.reset([false,{key:memoryKey,data:snapshot,loading:false},'', '',['team'],'all',[],'activation',null]);
tree=memory.WorkingMemoryAnalysis({sapienId:58,openEngram(){}});controls=find(tree,n=>n.type===Controls);
assert(primaryNames(controls).includes('memorySearch'));
assert(html(tree).includes('Team prefers morning reviews'));
assert(!html(tree).includes('Embedding cached'),'Embedding diagnostics do not occupy the list');
assert(!html(tree).includes('Snapshot statistics'),'Snapshot analysis is opened separately');
controls.props.filters[0].onRemove();assert.deepEqual(h.values[4],[],'Removing a visible tag clears its actual filter');

// Recorded timestamps are independent of age_seconds and the browser clock.
const jiraMemory={id:'jira-memory',memory_source:'awareness_thought',content:'Ben says staging needs a deployed version.',activation:0.48,age_seconds:null,last_used_at:'2026-11-13T16:41:12+00:00',metadata:{origin:{type:'jira',actor_name:'Ben Carter',issue_key:'SD-4',simulation_run_id:'run-1'},created_at:'2026-11-13T16:37:28+00:00'},provenance:{}};
const teamsMemory={...jiraMemory,id:'teams-memory',metadata:{origin:{type:'teams',actor_name:'Ben Carter',name:'channel:project:message-298',channel_id:'project',thread_id:'message-298',actor_ref:'simulation:run-1:teams:ben'},created_at:'2026-11-14T01:32:04+00:00'}};
assert.equal(wmPresentation.memoryTimes(jiraMemory).created,jiraMemory.metadata.created_at);
assert.equal(wmPresentation.memoryTimes({...jiraMemory,created_at:'2026-11-12T01:00:00Z'}).created,'2026-11-12T01:00:00Z','Explicit created time takes precedence');
for(const age of [null,undefined,0,NaN,-1])assert.equal(wmPresentation.memoryTimes({...jiraMemory,age_seconds:age}).activated,jiraMemory.last_used_at);
assert.equal(wmPresentation.memoryTimes({last_used_at:'bad',age_seconds:null}).activated,undefined);
assert.equal(wmPresentation.memoryTimes({last_used_at:'2026-11-13T10:00:00'}).activated,undefined,'Timezone-less timestamps are not silently interpreted');
assert.equal(wmPresentation.memoryTimes({last_used:0}).activated,'1970-01-01T00:00:00.000Z');
assert.equal(wmPresentation.memoryDate(undefined),'Not recorded');
assert.equal(wmPresentation.activationLabel({activation:null,score:null}),'Not recorded');
assert.equal(wmPresentation.memoryOrigin(jiraMemory).place,'SD-4');
assert.equal(wmPresentation.memoryOrigin(teamsMemory).service,'Teams');
assert.equal(wmPresentation.memoryOrigin(teamsMemory).simulation,true);
assert.equal(wmPresentation.memoryOrigin({metadata:null,provenance:'legacy'}).person,undefined);
for(const query of ['Ben Carter','jira','SD-4','Recorded understanding'])assert(wmPresentation.matchesMemory(jiraMemory,query));
assert(wmPresentation.matchesMemory(teamsMemory,'message-298'));
assert(!wmPresentation.matchesMemory(jiraMemory,'unrelated'));
const bucketCounts=wmPresentation.activationBuckets([{}, {activation:null},{activation:0},{activation:0.1},{activation:1},{activation:1.1}]).map(x=>x.count);
assert.equal(bucketCounts.reduce((a,b)=>a+b,0),3,'Unknown/out-of-range activation is not counted as zero or double counted at boundaries');
const wmDetailHtml=html(memory.MemoryDetails({entry:jiraMemory,focused:true,openEngram(){}}));
assert(wmDetailHtml.indexOf('Ben Carter')<wmDetailHtml.indexOf('Activation and time'));
assert(wmDetailHtml.includes('Jira'));assert(wmDetailHtml.includes('SD-4'));assert(wmDetailHtml.includes('From record metadata'));
assert(wmDetailHtml.includes('not necessarily Sapiens'));assert(!wmDetailHtml.includes('0s ago'));assert(!wmDetailHtml.includes('Not applicable'));
const ordinaryHtml=html(memory.MemoryDetails({entry:{id:'missing',memory_source:'unknown'},focused:false,openEngram(){}}));
assert(ordinaryHtml.includes('Content was not supplied'));assert(ordinaryHtml.includes('Origin not supplied'));assert(ordinaryHtml.includes('Not recorded'));
let openedEngram=false;
find(memory.MemoryDetails({entry:snapshot.wm.entries[0],focused:false,openEngram(){openedEngram=true;}}),node=>node.type==='button').props.onClick();assert(openedEngram);
for(const [query,entries,expected] of [['nothing',[jiraMemory],'No matching memories'],['',[],'No Working Memory records returned']]) {
  h.reset([false,{key:JSON.stringify([62,'',[],'all',[],'activation']),data:{wm:{entries}},loading:false},query]);
  assert(html(memory.WorkingMemoryAnalysis({sapienId:62,openEngram(){}})).includes(expected));
}
h.reset([false,{key:memoryKey,data:snapshot,loading:false}]);
assert(!html(memory.WorkingMemoryAnalysis({sapienId:62,openEngram(){}})).includes('Team prefers morning reviews'),'A previous Sapien snapshot cannot leak while the new request starts');

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
// Working Memory ignores late reads on filter changes/unmount and keeps data
// during a failed refresh. Exercise the actual effect and service call options.
globalThis.analyseTest.wmEffects=[];
globalThis.analyseTest.wmService={getWorkingMemory:async()=>snapshot};
const memoryAsync=await load('components/analyse/WorkingMemoryAnalysis.tsx',hooks.replace('useEffect=()=>{}','useEffect=fn=>globalThis.analyseTest.wmEffects.push(fn)')+`
const {activationBuckets,activationLabel,matchesMemory,memoryDate,memoryKind,memoryOrigin,memoryTimes}=globalThis.analyseTest.wmPresentation;
const sourceName=value=>value;
const useRememberedState=(_key,initial)=>h.useState(initial);
const engramService=globalThis.analyseTest.wmService;
Dialog.Root=Dialog; Dialog.Portal=()=>null; Dialog.Overlay=()=>null; Dialog.Content=({children})=>children;
`);
h.reset();let resolveMemory;let memoryReadOptions;
globalThis.analyseTest.wmService.getWorkingMemory=(_id,options)=>{memoryReadOptions=options;return new Promise(resolve=>resolveMemory=resolve);};
memoryAsync.WorkingMemoryAnalysis({sapienId:62,openEngram(){}});
const cancelMemory=globalThis.analyseTest.wmEffects.pop()();cancelMemory();
assert.equal(memoryReadOptions.limit,100);assert.equal(memoryReadOptions.includeMetadata,true);assert.equal(memoryReadOptions.includeContent,true);
globalThis.analyseTest.wmService.getWorkingMemory=async()=>({wm:{entries:[jiraMemory]}});
h.begin();memoryAsync.WorkingMemoryAnalysis({sapienId:62,openEngram(){}});
const cleanMemory=globalThis.analyseTest.wmEffects.pop()();await new Promise(resolve=>setImmediate(resolve));
resolveMemory(snapshot);await new Promise(resolve=>setImmediate(resolve));
assert.equal(h.values[1].data.wm.entries[0].id,'jira-memory','Late previous response is ignored');
globalThis.analyseTest.wmService.getWorkingMemory=async()=>{throw Error('Snapshot refresh unavailable');};
h.begin();tree=memoryAsync.WorkingMemoryAnalysis({sapienId:62,openEngram(){}});
find(tree,n=>n.type===Controls).props.onRefresh();await new Promise(resolve=>setImmediate(resolve));
assert.equal(h.values[1].data.wm.entries[0].id,'jira-memory');assert.equal(h.values[1].error,'Snapshot refresh unavailable');
h.begin();assert(html(memoryAsync.WorkingMemoryAnalysis({sapienId:62,openEngram(){}})).includes('Showing the previous snapshot'));cleanMemory();
// Feedback: production render trees and read lifecycle; no server or writes.
const feedbackTypes=await load('types/feedbackTypes.ts');
globalThis.analyseTest.feedbackTypes=feedbackTypes;
const feedbackPresentation=await load('components/analyse/feedbackPresentation.ts','const {FEEDBACK_STATES}=globalThis.analyseTest.feedbackTypes;');
globalThis.analyseTest.feedbackPresentation=feedbackPresentation;
const feedbackEvidence=await load('components/analyse/feedbackEvidence.ts');
globalThis.analyseTest.feedbackEvidence=feedbackEvidence;
globalThis.analyseTest.diagnosticUI=await load('components/analyse/DiagnosticPrimitives.tsx','const {useState,useId}=React;');
const feedbackDetail=await load('components/analyse/FeedbackFindingDetail.tsx','const {DiagnosticBadge,DiagnosticDisclosure,DiagnosticText}=globalThis.analyseTest.diagnosticUI;\nconst {feedbackLabels,feedbackMode,feedbackTime}=globalThis.analyseTest.feedbackPresentation;\nconst {additionalEvidence,changedRequestFields,eventEvidence,evidenceNames}=globalThis.analyseTest.feedbackEvidence;');
globalThis.analyseTest.feedbackDetail=feedbackDetail;
globalThis.analyseTest.feedbackService={list:async()=>{throw Error('Unexpected request');}};
globalThis.analyseTest.feedbackNavigation={scroll:new Map()};
const feedbackPrelude=hooks+'\nconst useLocation=()=>({pathname:"/admin/analyse/feedback"});\nconst useNavigationMemory=()=>globalThis.analyseTest.feedbackNavigation;\nconst {FEEDBACK_STATES}=globalThis.analyseTest.feedbackTypes;\nconst {feedbackLabels,feedbackMode,feedbackOrigin,feedbackQuery,feedbackTime,updateFeedbackQuery}=globalThis.analyseTest.feedbackPresentation;\nconst {feedbackDetailTitle}=globalThis.analyseTest.feedbackEvidence;\nconst {FeedbackFindingDetail,FeedbackStateBadge}=globalThis.analyseTest.feedbackDetail;\nconst {DiagnosticDisclosure}=globalThis.analyseTest.diagnosticUI;\nconst feedbackService=globalThis.analyseTest.feedbackService;';
const feedbackUI=await load('components/analyse/FeedbackInspection.tsx',feedbackPrelude,'export {FeedbackView,FeedbackProcessing};');
const feedbackRecord={
  _id:'finding-1',sapien_id:65,state:'interpreted',meaning:'Mei clarified the intended recipient. No subsequent introduction is established.',
  confidence:0,created_at:'2026-11-04T00:55:35Z',updated_at:null,last_surfaced_at:null,acknowledged_at:null,
  activity:{id:'activity-1',source:'tool_activity',occurred_at:'2026-11-03T10:36:05Z',details:{
    available:true,content:'Full saved tool text',metadata:{arguments:{chat_id:'chat-1'},_truncated:true},
    observed_at:'2026-11-03T10:36:06Z',truncated:true,display:{kind:'tool',server:'teams',tool:'send-chat-message',actor:'',recipient:'',outcome:'Succeeded',text:'Who should receive the introduction?'},
  }},
  experience:{id:'experience-1',source:'conversation_message',occurred_at:'2026-11-03T10:43:31Z',details:{
    available:true,content:'Address the introduction to me.',metadata:{},observed_at:null,truncated:false,
    display:{kind:'message',actor:'Mei Chen',recipient:'',server:'',tool:'',outcome:null,text:'Address the introduction to me.'},
  }},
  supporting_experiences:[{id:'missing',source:'conversation_message',occurred_at:null,details:{available:false}}],
};
const feedbackPage={sapien_id:65,mode:'observe',count:2,total:2,has_more:false,findings:[feedbackRecord,{...feedbackRecord,_id:'finding-2',state:'ambiguous',meaning:'The relationship is uncertain.'}]};
assert.deepEqual(feedbackPresentation.feedbackOrigin(feedbackRecord.experience),{primary:'Mei Chen',secondary:'conversation message'});
assert.match(feedbackPresentation.feedbackOrigin(feedbackRecord.activity).primary,/Teams.*send chat message/);
assert.equal(feedbackPresentation.feedbackOrigin({source:'conversation_message',details:{available:true,content:'Alice said this in Jira',metadata:{}}}).primary,'conversation message','Never derive identities/services from prose');
assert.equal(feedbackPresentation.feedbackTime(null),'Not recorded');
assert.equal(feedbackPresentation.feedbackTime('bad-time'),'bad-time');
assert.match(feedbackPresentation.feedbackTime('2026-11-03T10:00:00'),/timezone not recorded/);
assert.match(feedbackPresentation.feedbackTime('2026-11-03T10:00:00Z'),/GMT|UTC|[A-Z]{2,}/);
assert.match(feedbackPresentation.feedbackMode('observe'),/not applied/);
assert.match(feedbackPresentation.feedbackMode('unexpected'),/not available/);
const savedQuery=new URLSearchParams('feedbackFor=65&feedbackState=interpreted&feedbackLimit=10&feedbackOffset=10&keep=existing');
let changedQuery=feedbackPresentation.updateFeedbackQuery(savedQuery,'65',{selectedId:'finding-1'});
assert.equal(changedQuery.get('keep'),'existing');
assert.equal(changedQuery.get('feedbackOffset'),'10');
assert.equal(feedbackPresentation.feedbackQuery(changedQuery,'66').selectedId,null);
assert.deepEqual(feedbackPresentation.feedbackQuery(changedQuery,'66').states,[]);
assert.equal(feedbackPresentation.feedbackQuery(new URLSearchParams('feedbackFor=65&feedbackOffset=-1&feedbackLimit=500&feedbackState=invalid'),'65').offset,0);
assert.equal(feedbackPresentation.feedbackQuery(new URLSearchParams('feedbackFor=65&feedbackLimit=500'),'65').limit,50);
let selectedFeedback;
const tableTree=feedbackUI.FeedbackTable({findings:feedbackPage.findings,selectedId:null,onSelect:(id,button)=>selectedFeedback={id,button}});
const tableMarkup=html(tableTree);
assert.equal((tableMarkup.match(/<th scope="col"/g)||[]).length,5);
assert(tableMarkup.includes('Mei Chen')&&tableMarkup.includes('Teams'));
assert(!tableMarkup.includes('Full saved tool text'),'Evidence stays out of the directory');
const openerNode={isConnected:true,focus:()=>{}};
find(tableTree,node=>node.props.className==='feedback-open').props.onClick({currentTarget:openerNode});
assert.equal(selectedFeedback.id,'finding-1');
const detailMarkup=html(React.createElement(feedbackDetail.FeedbackFindingDetail,{finding:feedbackRecord}));
for(const expected of ['Earlier event','Later event','Tool reported:','Who should receive','Address the introduction','What Sapiens concluded','Only part of the original record','The original event could not be loaded','More context used in this review','Full saved tool text','chat-1','not measured accuracy'])assert(detailMarkup.includes(expected),expected);
assert(detailMarkup.indexOf('Who should receive') < detailMarkup.indexOf('What Sapiens concluded'),'Evidence precedes the saved conclusion');
assert(detailMarkup.includes('>0<'),'Zero confidence is not treated as missing');
const safeMarkup=html(React.createElement(feedbackDetail.FeedbackFindingDetail,{finding:{...feedbackRecord,meaning:'<img src=x onerror=alert(1)>'}}));
assert(safeMarkup.includes('&lt;img'));assert(!safeMarkup.includes('<img src=x'));
// Sapien 66-shaped evidence: tool retry, conversations, progress, mixed and incomplete records.
function toolReference(id,args,result,options={}){
  const tool=options.tool||'create-chat',server=options.server||'teams',status=options.status||'succeeded';
  const content=`Tool activity ${server}.${tool} ${status}.\nArguments: ${JSON.stringify(args)}.\nResult: ${typeof result==='string'?result:JSON.stringify(result)}`;
  return {id,source:'tool_activity',occurred_at:'2026-11-02T14:22:54Z',details:{available:true,content,metadata:{server,tool,arguments:{body:{members:['[truncated]']}},is_error:status==='failed'},observed_at:null,truncated:true,display:{server,tool,outcome:status==='failed'?'Failed':'Succeeded',text:content}}};
}
const member=(id,roles)=>({'user@odata.bind':`https://graph.microsoft.com/v1.0/users('${id}')`,roles});
const beforeTool=toolReference('attempt-1',{body:{chatType:'oneOnOne',members:[member('self',['owner']),member('ben',[])]}},{error:{message:'Each member must have owner role and user binding'}},{status:'failed'});
const afterTool=toolReference('attempt-2',{body:{chatType:'oneOnOne',members:[member('ben',['owner']),member('self',['owner'])]}},{chatType:'oneOnOne',members:[{userId:'ben',displayName:'Ben Carter',roles:['owner']},{userId:'self',displayName:'Rashi',roles:['owner']}]});
const retryFinding={...feedbackRecord,sapien_id:66,activity:beforeTool,experience:afterTool,supporting_experiences:[afterTool,feedbackRecord.experience]};
const names=feedbackEvidence.evidenceNames([beforeTool,afterTool]);
assert.equal(names.get('ben'),'Ben Carter');
assert.deepEqual(feedbackEvidence.changedRequestFields(retryFinding,names),[{label:'Ben Carter — roles',earlier:'No role supplied',later:'owner'}],'Match members by exact user ID even when order changes');
assert.equal(feedbackEvidence.feedbackDetailTitle(retryFinding),'Teams · create chat');
assert.equal(feedbackEvidence.additionalEvidence(retryFinding).repeated,1);
assert.equal(feedbackEvidence.additionalEvidence(retryFinding).references.length,1);
assert.equal(feedbackEvidence.additionalEvidence({...retryFinding,supporting_experiences:[{...afterTool,details:{available:false}}]}).references.length,1,'Keep different saved snapshots of the same reference');
assert.equal(feedbackEvidence.additionalEvidence({...retryFinding,supporting_experiences:[{id:'',source:'unknown'},{id:'',source:'unknown'}]}).repeated,0,'Missing IDs cannot prove duplication');
const retryMarkup=html(React.createElement(feedbackDetail.FeedbackFindingDetail,{finding:retryFinding,mode:'observe'}));
for(const expected of ['What changed in the request','Ben Carter','No role supplied','Each member must have owner role','What Sapiens concluded','not applied to Sapiens','1 repeated reference'])assert(retryMarkup.includes(expected),expected);
assert(retryMarkup.indexOf('Each member must have owner role')<retryMarkup.indexOf('Original record'),'Error is visible before raw details');
assert(!retryMarkup.includes('not evidence that behavior changed'));
const messageTool=toolReference('message',{body:{body:{content:'Should I contact the internal team?'}}},{id:'saved-message'},{tool:'send-chat-message'});
const messageFinding={...feedbackRecord,sapien_id:66,activity:messageTool,experience:{...feedbackRecord.experience,details:{...feedbackRecord.experience.details,display:{actor:'Isha Desai',text:'Start with the internal project team.'},content:'Start with the internal project team.'}}};
assert.equal(feedbackEvidence.feedbackDetailTitle(messageFinding),'Messages and feedback');
const messageMarkup=html(React.createElement(feedbackDetail.FeedbackFindingDetail,{finding:messageFinding}));
assert(messageMarkup.includes('Should I contact the internal team?')&&messageMarkup.includes('Isha Desai'));
assert(messageMarkup.includes('Start with the internal project team.'));
const updateRef={id:'goal-event',source:'domain_lifecycle',occurred_at:null,details:{available:true,metadata:{domain:'goal',state:'pending'},content:'goal goal-1 changed to pending. Access was reported; kickoff remains unfinished.',display:{text:'goal goal-1 changed to pending. Access was reported; kickoff remains unfinished.'}}};
const progress=feedbackEvidence.eventEvidence(updateRef);
assert.equal(progress.body,'Access was reported; kickoff remains unfinished.');assert.equal(progress.state,'pending');
assert.equal(feedbackEvidence.eventEvidence({...updateRef,details:{...updateRef.details,metadata:{}}}).body,updateRef.details.content,'No guessing a progress state from prose');
assert.equal(feedbackEvidence.changedRequestFields({...retryFinding,experience:updateRef},names).length,0,'Mixed entries are not a tool retry');
const unnamedTool={source:'tool_activity',details:{available:true,metadata:{arguments:{query:'first'}}}};
assert.equal(feedbackEvidence.changedRequestFields({...retryFinding,activity:unnamedTool,experience:{...unnamedTool,details:{available:true,metadata:{arguments:{query:'second'}}}}},names).length,0,'Unknown tools cannot be assumed to be the same tool');
assert.equal(feedbackEvidence.feedbackDetailTitle({...retryFinding,experience:updateRef}),'Activity and follow-up');
const listTool=toolReference('list',{}, {value:[{displayName:'Recorded person',role:'Engineer'}]},{tool:'list-users'});
assert.equal(feedbackEvidence.eventEvidence(listTool).resultItems[0].fields[0].value,'Recorded person');
const uncertain=toolReference('uncertain',{},'Delivery not confirmed',{status:'has an uncertain result'});
assert.equal(feedbackEvidence.eventEvidence(uncertain).tool.outcome,'Uncertain','Canonical uncertainty overrides a legacy success display');
const broken={...afterTool,details:{...afterTool.details,content:afterTool.details.content.slice(0,-6)}};
assert.equal(feedbackEvidence.toolEvidence(broken).result,undefined,'Never repair incomplete JSON');
assert.equal(feedbackEvidence.changedRequestFields({...retryFinding,experience:{...broken,details:{...broken.details,content:'Shortened record',metadata:{arguments:{body:{members:['[truncated]']}}}}}},names).length,0,'Do not compare missing/truncated member roles');
const wrongEnvelope={...afterTool,details:{...afterTool.details,content:afterTool.details.content.replace('teams.create-chat','jira.create-chat')}};
assert.equal(feedbackEvidence.toolEvidence(wrongEnvelope).parsed,false,'Envelope must match explicit source fields');
const conflicting=toolReference('conflict',{}, {members:[{userId:'ben',displayName:'Another person'}]});
assert(!feedbackEvidence.evidenceNames([afterTool,conflicting]).has('ben'),'Conflicting identities are not resolved');
assert.equal(feedbackEvidence.eventEvidence({source:'unknown',details:{available:false}}).kind,'other');
assert.equal(feedbackEvidence.eventEvidence(toolReference('zero',{},0)).resultText,'0');
assert.equal(feedbackEvidence.eventEvidence(toolReference('false',{},false)).resultText,'false');
const feedbackKey=(params='',revision=0)=>{const query=feedbackPresentation.feedbackQuery(new URLSearchParams(params),'65');return JSON.stringify(['65',query.states,query.limit,query.offset,revision]);};
function setupFeedback(page=feedbackPage,params=''){
  h.reset([0,{key:feedbackKey(params),data:page}]);h.params=new URLSearchParams(params);
}
const renderFeedback=()=>{h.begin();return feedbackUI.FeedbackView({sapienId:'65'});};
setupFeedback();tree=renderFeedback();
assert(html(tree).includes('<table'));
assert(!html(tree).includes('What Sapiens concluded'),'No automatic first-record reader');
h.refs[2].current={closest:()=>({dataset:{navScroll:'analyse-content'},scrollTop:480})};
find(tree,node=>node.type===feedbackUI.FeedbackTable).props.onSelect('finding-1',openerNode);
assert.equal(globalThis.analyseTest.feedbackNavigation.scroll.get(`65:/admin/analyse/feedback?${h.params}:analyse-content`),480,'Opening a reader preserves the table scroll in the shared navigation memory');
tree=renderFeedback();assert(html(tree).includes('What Sapiens concluded'));
assert.equal(h.params.get('feedbackFor'),'65');
find(tree,node=>node.type==='button'&&node.props.children==='Next finding').props.onClick();
assert.equal(h.params.get('feedbackFinding'),'finding-2');
tree=renderFeedback();assert(find(tree,node=>node.type==='button'&&node.props.children==='Next finding').props.disabled);
find(tree,node=>node.type==='button'&&node.props.children==='Previous finding').props.onClick();
tree=renderFeedback();let focusRestored=false;
h.refs[0].current={isConnected:true,focus:options=>{focusRestored=options.preventScroll;}};
find(tree,node=>typeof node.props.onCloseAutoFocus==='function').props.onCloseAutoFocus({preventDefault(){}});
assert(focusRestored,'Close returns focus without scrolling the table');
find(tree,node=>node.type==='button'&&node.props.children==='Back to findings').props.onClick();
assert(!h.params.has('feedbackFinding'));
assert.equal(globalThis.analyseTest.feedbackNavigation.scroll.get(`65:/admin/analyse/feedback?${h.params}:analyse-content`),480,'Closing the reader preserves the same table position');
assert(!html(renderFeedback()).includes('What Sapiens concluded'));
setupFeedback(feedbackPage,'feedbackFor=65&feedbackFinding=missing');
assert(html(renderFeedback()).includes('not in the returned page'));
assert(!html(renderFeedback()).includes('What Sapiens concluded'),'Do not silently substitute a different record');
setupFeedback(feedbackPage,'feedbackFor=65&feedbackLimit=10&feedbackOffset=10&feedbackFinding=finding-1');
tree=renderFeedback();controls=find(tree,node=>node.type===Controls);
find(controls.props.primary,node=>node.type==='input'&&node.props.value==='ambiguous').props.onChange({target:{checked:true}});
assert.equal(h.params.get('feedbackOffset'),null);assert.equal(h.params.get('feedbackFinding'),null);
assert.equal(h.params.get('feedbackState'),'ambiguous');
assert(!html(renderFeedback()).includes(feedbackRecord.meaning),'Old data disappears before the replacement request resolves');
for(const [params,page,expected] of [
  ['',{...feedbackPage,findings:[],count:0,total:0},'No saved findings yet'],
  ['feedbackFor=65&feedbackState=ambiguous',{...feedbackPage,findings:[],count:0,total:0},'No findings match these states'],
  ['feedbackFor=65&feedbackOffset=50',{...feedbackPage,findings:[],count:0,total:2},'No findings on this page'],
]){setupFeedback(page,params);assert(html(renderFeedback()).includes(expected));}
setupFeedback({...feedbackPage,total:undefined,has_more:true});tree=renderFeedback();
assert(!find(tree,node=>node.type==='button'&&node.props.children==='Next page').props.disabled,'has_more works without total');
find(tree,node=>node.type==='button'&&node.props.children==='Next page').props.onClick();
assert.equal(h.params.get('feedbackOffset'),'50');
h.reset([0,{key:feedbackKey(),error:{status:503,message:'Storage unavailable'}}]);
assert(html(renderFeedback()).includes('Saved feedback temporarily unavailable'));
assert(!html(renderFeedback()).includes('No saved findings'));
h.reset();assert(html(renderFeedback()).includes('Loading feedback findings'));
setupFeedback();h.begin();assert(!html(feedbackUI.FeedbackView({sapienId:'66'})).includes(feedbackRecord.meaning),'Never display another Sapien’s response');
assert(html(React.createElement(feedbackUI.FeedbackProcessing,{processing:{available:true}})).includes('Not recorded'),'Missing diagnostics are not zero');
// Exercise production read effects through cancellation, scope mismatch and errors.
globalThis.analyseTest.feedbackEffects=[];
const feedbackAsync=await load('components/analyse/FeedbackInspection.tsx',feedbackPrelude.replace('useEffect=()=>{}','useEffect=fn=>globalThis.analyseTest.feedbackEffects.push(fn)'),'export {useFeedbackRead};');
const baseQuery=feedbackPresentation.feedbackQuery(new URLSearchParams(),'65');
let resolveOldFeedback;let oldFeedbackArgs;
globalThis.analyseTest.feedbackService.list=(...args)=>{oldFeedbackArgs=args;return new Promise(resolve=>resolveOldFeedback=resolve);};
h.reset();feedbackAsync.useFeedbackRead('65',baseQuery);
const cancelOldFeedback=globalThis.analyseTest.feedbackEffects.pop()();cancelOldFeedback();
assert.deepEqual(oldFeedbackArgs,['65',[],50,0]);
globalThis.analyseTest.feedbackService.list=async()=>({...feedbackPage,sapien_id:66,findings:[]});
h.begin();feedbackAsync.useFeedbackRead('66',baseQuery);
const stopNewFeedback=globalThis.analyseTest.feedbackEffects.pop()();
await new Promise(resolve=>setImmediate(resolve));
resolveOldFeedback(feedbackPage);await new Promise(resolve=>setImmediate(resolve));
assert.equal(h.values[1].data.sapien_id,66);stopNewFeedback();
h.reset();globalThis.analyseTest.feedbackService.list=async()=>feedbackPage;
feedbackAsync.useFeedbackRead('66',baseQuery);globalThis.analyseTest.feedbackEffects.pop()();
await new Promise(resolve=>setImmediate(resolve));
assert.match(h.values[1].error.message,/different Sapien/);assert(!h.values[1].data);
h.reset();globalThis.analyseTest.feedbackService.list=async()=>{throw {status:503,message:'Retry later'};};
feedbackAsync.useFeedbackRead('65',baseQuery);globalThis.analyseTest.feedbackEffects.pop()();
await new Promise(resolve=>setImmediate(resolve));assert.equal(h.values[1].error.status,503);
h.reset();globalThis.analyseTest.feedbackService.list=async()=>{throw null;};
feedbackAsync.useFeedbackRead('65',baseQuery);globalThis.analyseTest.feedbackEffects.pop()();
await new Promise(resolve=>setImmediate(resolve));assert.equal(h.values[1].error.message,'Could not load feedback findings.');
console.log('Feedback checks passed: table/detail selection, evidence, filters, pagination, focus return, missing data, escaping, timestamps and stale-response isolation.');
console.log('Analyse checks passed, including Feedback, Working Memory, Goals and existing Analyse checks. No network or server used.');
