import identitySmall from '../../../assets/landing/identity-480.webp';
import identityLarge from '../../../assets/landing/identity-960.webp';

export function LandingIdentity() {
  return <div className="landing-hero-art">
    <div className="landing-art-aura" aria-hidden="true" />
    <svg className="landing-experience-trails" viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <path className="landing-trail landing-trail-in" pathLength="100" d="M20 125C60 55 100 108 185 190" />
      <path className="landing-trail landing-trail-out" pathLength="100" d="M215 215C300 290 350 290 380 210" />
      <circle className="landing-encounter" cx="48" cy="95" r="9" />
    </svg>
    <img className="landing-sculpture" src={identityLarge} srcSet={`${identitySmall} 480w, ${identityLarge} 960w`}
      sizes="(max-width: 600px) 320px, (max-width: 1000px) 38vw, 420px"
      width="960" height="960" fetchPriority="high"
      alt="A sculpted violet AI identity, with translucent folds surrounding a luminous pearl-like core." />
    <div className="landing-art-caption" aria-hidden="true"><span>Encounter</span><span>Connect</span><span>Respond</span></div>
  </div>;
}
