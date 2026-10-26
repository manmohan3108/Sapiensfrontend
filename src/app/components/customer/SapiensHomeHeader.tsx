import type { MouseEventHandler } from 'react';
import { Plus } from 'lucide-react';

/** Directory actions; application navigation lives in the shared shell. */
export function SapiensHomeHeader({ onCreate }: { onCreate: MouseEventHandler<HTMLButtonElement> }) {
  return <header className="home-header"><div className="home-container home-nav" style={{justifyContent:'flex-end'}}>
    <div className="home-nav-actions"><button className="home-create-button" onClick={onCreate}><Plus size={17} /><span>Create a Sapiens</span></button></div>
  </div></header>;
}
