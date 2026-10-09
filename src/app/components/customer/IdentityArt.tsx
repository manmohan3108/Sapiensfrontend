import { useId } from 'react';

// A recurring illustrative identity, never a visualization of customer data.
export function IdentityArt({ stage = 3, className = '' }: { stage?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 520 480" fill="none" aria-hidden="true" className={`identity-art ${className}`}>
    <defs>
      <radialGradient id={`${id}-glow`}><stop stopColor="#a78bfa" stopOpacity=".3" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
      <linearGradient id={`${id}-ink`} x1="150" y1="130" x2="380" y2="370" gradientUnits="userSpaceOnUse"><stop stopColor="#c4b5fd" /><stop offset=".48" stopColor="#8b5cf6" /><stop offset="1" stopColor="#6d28d9" /></linearGradient>
    </defs>
    <circle cx="260" cy="240" r="220" fill={`url(#${id}-glow)`} />
    <ellipse cx="260" cy="245" rx="207" ry="168" stroke="currentColor" strokeOpacity=".12" strokeDasharray="2 9" transform="rotate(-25 260 245)" />
    <path d="M68 338C119 400 260 431 371 350S489 164 408 110" stroke="currentColor" strokeOpacity=".2" />
    <g className="identity-core">
      {Array.from({ length: 13 }, (_, i) => <path key={i} d="M258 112C327 94 393 151 389 224C387 279 351 347 285 363C214 381 141 333 133 268C123 204 186 131 258 112Z" stroke={`url(#${id}-ink)`} strokeWidth={i === 0 ? 2 : 1.25} opacity={.85 - i * .035} transform={`translate(260 240) rotate(${i * 7}) scale(${1 - i * .037}) translate(-260 -240)`} />)}
      <circle cx="260" cy="238" r="13" fill={`url(#${id}-ink)`} />
      <circle cx="260" cy="238" r="25" stroke="#a78bfa" strokeOpacity=".5" />
    </g>
    {stage >= 1 && <g><circle cx="101" cy="188" r="7" fill="#b49bd9" /><circle cx="402" cy="326" r="5" fill="#b49bd9" /><circle cx="198" cy="400" r="4" fill="#c5a277" /><circle cx="393" cy="99" r="9" stroke="#a78bfa" strokeWidth="2" /></g>}
    {stage >= 2 && <g stroke="#a78bfa" strokeOpacity=".6"><path d="M101 188L183 157M349 290L402 326L393 99" /><circle cx="183" cy="157" r="4" fill="#a78bfa" /><path d="M198 400L228 354" strokeDasharray="3 5" /></g>}
    {stage >= 3 && <g><path d="M65 337L104 375L166 374" stroke="#b69b78" /><circle cx="65" cy="337" r="5" fill="#b69b78" /><circle cx="104" cy="375" r="3" fill="#b69b78" /><circle cx="442" cy="214" r="3" fill="#a78bfa" /><path d="M393 99L442 214L402 326" stroke="#a78bfa" strokeOpacity=".3" strokeDasharray="4 6" /></g>}
  </svg>;
}
