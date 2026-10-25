import { ScienceScene } from './ScienceEnvironment';

export type WorldEnvironment = 'forest' | 'workshop' | 'science';

// Decorative scenery only: the live core, captions and controls remain HTML/SVG.
// Both planes reuse one cached image; existing scene scroll tracking drives depth.
export function WorldAtmosphere({ environment }: { environment: WorldEnvironment }) {
  // The forest now surrounds the entire page, rather than living in this scene.
  if (environment === 'forest') return null;
  if (environment === 'science') return <ScienceScene/>;
  const image = '/concepts/curiosity-workbench.webp';
  return <div className="world-atmosphere" aria-hidden="true">
    <img className="world-atmosphere-back" src={image} alt="" width="1536" height="1024" fetchPriority="high"/>
    <div className="world-atmosphere-light"/>
    <img className="world-atmosphere-front" src={image} alt="" width="1536" height="1024"/>
    <span className="world-atmosphere-speck world-atmosphere-speck-one"/>
    <span className="world-atmosphere-speck world-atmosphere-speck-two"/>
    <span className="world-atmosphere-speck world-atmosphere-speck-three"/>
  </div>;
}
