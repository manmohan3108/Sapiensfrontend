import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = name => readFile(new URL(`../src/app/${name}`, import.meta.url), 'utf8');
const load = async (text, filename) => {
  const { code } = await transformWithEsbuild(text, filename, { loader:filename.endsWith('tsx') ? 'tsx' : 'ts', jsx:'transform', jsxFactory:'React.createElement', jsxFragment:'React.Fragment' });
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
};
const model = await load(await source('core/navigation/appNavigation.ts'), 'appNavigation.ts');
assert.deepEqual(model.appDestinations(false, false).map(item => item.id), ['directory','workspace','connections']);
assert.deepEqual(model.appDestinations(true, true).map(item => item.id), ['directory','workspace','connections','analyse','simulations']);
assert.equal(model.appArea('/admin/analyse/working-memory'), 'analyse');
assert.equal(model.appArea('/admin/simulations/run-1/world/messages'), 'simulations');
assert.equal(model.destinationAfterSwitch('/admin/analyse/goals'), '/admin/analyse/goals');
assert.equal(model.destinationAfterSwitch('/connections'), '/connections');
assert.equal(model.destinationAfterSwitch('/workspace'), '/workspace');
assert.equal(model.destinationAfterSwitch('/admin/simulations'), '/admin/simulations');
assert.equal(model.destinationAfterSwitch('/admin/simulations/run-1/world/messages', '59', 'New Sapien'), '/admin/simulations?sapienId=59&sapienName=New+Sapien&returnTo=%2Fworkspace', 'A switch must never change a run’s binding');
const lab = new URL(model.simulationLabPath('58','Name & spaces','/admin/analyse/goals'), 'https://example.test');
assert.equal(lab.searchParams.get('sapienId'), '58');
assert.equal(lab.searchParams.get('sapienName'), 'Name & spaces');
assert.equal(lab.searchParams.get('returnTo'), '/admin/analyse/goals');

// Render the actual shared header. Only providers, network hooks and external
// UI primitives are substituted; page links, roles and labels are production code.
globalThis.navTest = { React, model, user:{user_id:'admin1',role:'admin',username:'Admin'}, selected:{id:'58',name:'Sapien 58'}, path:'/workspace', memory:{destinations:new Map(),views:new Map(),scroll:new Map()} };
const shellSource = (await source('components/navigation/AppNavigation.tsx')).replace(/^import .*;\r?\n/gm, '');
const shellPrelude = `
const React = globalThis.navTest.React;
const {useEffect,useRef,useState} = React;
const useAuth = () => ({user:globalThis.navTest.user,logout:()=>{}});
const canAnalyzeAndSimulate = user => user?.role === 'admin';
const useSapiensStore = select => select({currentSapiens:globalThis.navTest.selected});
const useLocation = () => ({pathname:globalThis.navTest.path,search:''});
const useNavigationMemory = () => globalThis.navTest.memory;
const useNavigationScroll = () => {};
const useSelectSapien = () => ({select:()=>{},busy:null,error:'',clearError:()=>{}});
const {appArea,appDestinations,destinationAfterSwitch,simulationLabPath} = globalThis.navTest.model;
const selectionStorage = {read:()=>null};
const Link = ({to,children,...props}) => React.createElement('a',{href:to,...props},children);
const Icon = () => React.createElement('svg');
const ChevronDown=Icon,LayoutGrid=Icon,Loader2=Icon,LogOut=Icon,Menu=Icon,Search=Icon,X=Icon,SapiensBrandMark=Icon,ThemeToggle=Icon;
const Dialog = new Proxy({}, {get:()=>()=>null});
`;
const { AppNavigationFrame } = await load(shellPrelude + shellSource, 'AppNavigation.tsx');
const render = () => renderToStaticMarkup(React.createElement(AppNavigationFrame, null, React.createElement('p',null,'Page content')));
let html = render();
for (const label of ['Your Sapiens','Workspace','Connections','Analyse','Simulations','Sapien 58','Page content']) assert(html.includes(label), label);
assert.match(html, /href="\/workspace" aria-current="page"/);
globalThis.navTest.memory.destinations.set('58:analyse', '/admin/analyse/goals');
assert(render().includes('href="/admin/analyse/goals"'), 'Return to the last Analyse section');
globalThis.navTest.user = {user_id:'customer1',role:'customer'};
html = render();
assert(!html.includes('href="/admin'), 'Customers never see admin destinations');
assert(html.includes('href="/home"'));
globalThis.navTest.selected = null;
assert(render().includes('Choose a Sapiens'), 'No-selection state offers a picker');
globalThis.navTest.user = {user_id:'admin1',role:'admin'};
globalThis.navTest.path = '/admin/simulations/run-1/world/messages';
assert(render().includes('App Sapien'), 'The app selection is distinguished from the bound simulation identity');

// Exercise the real selection hook, including response races, without changing data.
globalThis.selectTest = { version:1, current:{id:'58'}, selections:[], destinations:[], confirms:[], cleanups:[], list:async()=>[{id:'58'},{id:'59'}] };
const selectionSource = (await source('components/navigation/useSelectSapien.ts')).replace(/^import .*;\r?\n/gm, '');
const selectionPrelude = `
const t=globalThis.selectTest;
const useRef = value => ({current:value});
const useState = value => [value,()=>{}];
const useEffect = effect => {const cleanup=effect();if(cleanup)t.cleanups.push(cleanup);};
const useNavigate = () => path => t.destinations.push(path);
const resourceSession = {get version(){return t.version;}, confirm:id=>t.confirms.push(id)};
const sapiensService = {listSapiens:()=>t.list()};
const useSapiensStore = {getState:()=>({currentSapiens:t.current,setCurrentSapiens:(value,verified)=>{t.current=value;t.selections.push({value,verified});}})};
`;
const { useSelectSapien } = await load(selectionPrelude + selectionSource, 'useSelectSapien.ts');
const t=globalThis.selectTest;
assert.equal(await useSelectSapien().select('58','/workspace'), true);
assert.equal(t.selections.length,0,'Opening the current Sapien retains its conversation');
assert.deepEqual(t.confirms,['58']);
assert.equal(await useSelectSapien().select('59','/admin/analyse/goals'),true);
assert.equal(t.selections[0].verified,true,'Switch only after a fresh filtered directory check');
assert.equal(t.destinations.at(-1),'/admin/analyse/goals');
const count=t.destinations.length;
assert.equal(await useSelectSapien().select('missing','/workspace'),false);
assert.equal(t.destinations.length,count);
let resolveList;
t.list = () => new Promise(resolve=>{resolveList=resolve;});
const stale=useSelectSapien().select('58','/workspace'); t.version++;
resolveList([{id:'58'}]); assert.equal(await stale,false);
assert.equal(t.destinations.length,count,'A response from an earlier selection cannot navigate');
const hook=useSelectSapien();
const unmounted=hook.select('58','/workspace'); t.cleanups.at(-1)();
resolveList([{id:'58'}]); assert.equal(await unmounted,false);
assert.equal(t.destinations.length,count,'A response from an unmounted/account-changed picker cannot navigate');

t.list = async () => { throw new Error('Network unavailable'); };
const retry=useSelectSapien();
assert.equal(await retry.select('58','/workspace'),false);
t.list = async () => [{id:'58'}];
assert.equal(await retry.select('58','/workspace'),true,'A failed check must allow retry');

// Remembered controls retain stable initial values and stay scoped by Sapien/account.
globalThis.memoryTest = {views:new Map()};
const stateSource = (await source('components/navigation/NavigationState.tsx')).replace(/^import .*;\r?\n/gm, '');
const statePrelude = `
const createContext=()=>({});
const useContext=()=>globalThis.memoryTest;
const useState=()=>[null,()=>{}];
const useCallback=fn=>fn;
`;
const {useRememberedState}=await load(statePrelude+stateSource,'NavigationState.tsx');
const [initial,setTags]=useRememberedState('58:tags',[]);
assert.equal(useRememberedState('58:tags',[])[0],initial,'Array identity must remain stable to avoid repeated data effects');
setTags(tags=>[...tags,'work']);
assert.deepEqual(useRememberedState('58:tags',[])[0],['work']);
assert.deepEqual(useRememberedState('59:tags',[])[0],[],'Another Sapien starts with its own filters');
globalThis.memoryTest={views:new Map()};
assert.deepEqual(useRememberedState('58:tags',[])[0],[],'New account memory contains no previous filters');
delete globalThis.memoryTest;
delete globalThis.navTest; delete globalThis.selectTest;
console.log('App navigation passed: role menus, selected/empty/run states, remembered destinations, verified switching, retained conversations, and stale-response protection.');
