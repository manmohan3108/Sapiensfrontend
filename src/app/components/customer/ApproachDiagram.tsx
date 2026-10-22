/** Conceptual connections only; the adjacent copy describes their intended role. */
export function ApproachDiagram() {
  return <svg className="compact-system-diagram" viewBox="0 0 340 190" role="img" aria-labelledby="compact-system-title compact-system-description">
    <title id="compact-system-title">The four connected parts of the Sapiens concept</title>
    <desc id="compact-system-description">Attention and curiosity, understanding, memory and experience, and goals and reflection connect around Sapiens.</desc>
    <path className="system-link" d="M112 48L147 81M228 48L193 81M112 141L147 108M228 141L193 108"/>
    <path className="system-orbit" d="M65 22Q170-2 275 22M65 166Q170 190 275 166"/>
    <g className="system-node system-attention"><rect x="4" y="23" width="112" height="51" rx="12"/><text x="60" y="45"><tspan x="60">Attention &</tspan><tspan x="60" dy="17">curiosity</tspan></text></g>
    <g className="system-node system-understanding"><rect x="224" y="23" width="112" height="51" rx="12"/><text x="280" y="53">Understanding</text></g>
    <g className="system-node system-memory"><rect x="4" y="115" width="112" height="51" rx="12"/><text x="60" y="137"><tspan x="60">Memory &</tspan><tspan x="60" dy="17">experience</tspan></text></g>
    <g className="system-node system-goals"><rect x="224" y="115" width="112" height="51" rx="12"/><text x="280" y="137"><tspan x="280">Goals &</tspan><tspan x="280" dy="17">reflection</tspan></text></g>
    <circle className="system-core-ring" cx="170" cy="94" r="38"/><circle className="system-core" cx="170" cy="94" r="32"/><text className="system-core-label" x="170" y="100">Sapiens</text>
  </svg>;
}
