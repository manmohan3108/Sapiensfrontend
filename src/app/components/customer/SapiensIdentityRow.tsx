import type { ReactNode } from 'react';
import type { Sapiens } from '../../types/sapiensTypes';

export function SapiensIdentityRow({ individual, children, created }: { individual: Sapiens; children: ReactNode; created?: string }) {
  return <article className={`home-identity-row${created ? ' has-created-date' : ''}`}>
    <div className="home-identity-name"><span className="home-monogram" aria-hidden="true">{Array.from(individual.name)[0]?.toUpperCase()}</span><div><h3>{individual.name}</h3><span className="home-identity-id">ID {individual.id}</span></div></div>
    <p className="home-identity-focus">{individual.role || 'Generalist'}</p>
    {created && <p className="home-identity-date">Created {created}</p>}
    <div className="home-identity-action">{children}</div>
  </article>;
}
