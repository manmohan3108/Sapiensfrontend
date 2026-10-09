import { CircleHelp, ClipboardCheck, FileText, Users } from 'lucide-react';

// The same organic identity anchors the hero and every experience scene.
export function LandingIdentityCore() {
  return <g className="landing-core-motion">
    {Array.from({ length: 7 }, (_, index) => <path key={index}
      d="M-2-29C16-35 33-19 31 0C30 18 15 32-3 30C-24 29-34 12-29-7C-25-20-14-27-2-29Z"
      transform={`rotate(${index * 12}) scale(${1 - index * .075})`}
      opacity={.9 - index * .075} />)}
    <circle r="5" fill="currentColor" stroke="none" />
  </g>;
}

export function LandingIdentity() {
  return <svg className="landing-hero-art" viewBox="0 0 320 280" role="img"
    aria-label="One Sapiens identity connected with information, a question, another person and an outcome."
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse className="cycle-art-halo" cx="160" cy="140" rx="96" ry="88" stroke="none" />
    <path d="M77 67L126 111M244 65L192 111M76 211L126 169M245 209L194 169" strokeDasharray="3 5" opacity=".6" />
    <g className="landing-hero-signals" aria-hidden="true" strokeWidth="3">
      <path className="landing-signal" pathLength="100" d="M77 67L126 111" />
      <path className="landing-signal" pathLength="100" d="M192 111L244 65" />
      <path className="landing-signal" pathLength="100" d="M126 169L76 211" />
      <path className="landing-signal" pathLength="100" d="M245 209L194 169" />
    </g>
    <g transform="translate(160 140) scale(1.5)"><LandingIdentityCore /></g>
    <FileText x="44" y="33" width="32" height="32" />
    <CircleHelp x="244" y="33" width="32" height="32" />
    <Users x="44" y="204" width="32" height="32" />
    <ClipboardCheck x="244" y="204" width="32" height="32" />
    <g className="landing-art-label" stroke="none" fill="currentColor" textAnchor="middle">
      <text x="60" y="85">Information</text><text x="260" y="85">Questions</text>
      <text x="60" y="256">People</text><text x="260" y="256">Outcomes</text>
    </g>
  </svg>;
}
