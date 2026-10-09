import identitySmall from '../../../assets/landing/identity-480.webp';
import identityLarge from '../../../assets/landing/identity-960.webp';

export function LandingIdentity() {
  return <div className="landing-hero-art">
    <div className="landing-art-aura" aria-hidden="true" />
    <img className="landing-sculpture" src={identityLarge} srcSet={`${identitySmall} 480w, ${identityLarge} 960w`}
      sizes="(max-width: 600px) 320px, (max-width: 1000px) 38vw, 420px"
      width="960" height="960" fetchPriority="high"
      alt="A sculpted violet AI identity, with translucent folds surrounding a luminous pearl-like core." />
  </div>;
}
