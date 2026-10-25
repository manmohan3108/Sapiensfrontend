import type { MouseEventHandler, Ref } from 'react';
import { Plus } from 'lucide-react';
import { SapiensBrandMark } from './SapiensBrandMark';
import { ScienceDetail } from './ScienceDetail';

export function SapiensEmptyState({ onCreate, headingRef, admin = false }: {
  onCreate: MouseEventHandler<HTMLButtonElement>;
  headingRef?: Ref<HTMLHeadingElement>;
  admin?: boolean;
}) {
  const Heading = admin ? 'h2' : 'h1';
  return <section className="home-empty" aria-labelledby="home-empty-title">
    <div className="home-empty-art"><ScienceDetail variant="surround" /><SapiensBrandMark /></div>
    <Heading id="home-empty-title" ref={headingRef} tabIndex={-1}>{admin ? 'No Sapiens yet' : 'Create your first Sapiens'}</Heading>
    <p>An AI individual shaped by experience. Give yours a name to begin.</p>
    <button className="home-open-button" onClick={onCreate}><Plus size={17} />Create a Sapiens</button>
  </section>;
}
