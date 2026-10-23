/** Orange version of the homepage core sculpture, for the layered preview. */
export function SapiensBrandMark({ className = '' }: { className?: string }) {
  return <span className={`sapiens-brand-mark ${className}`} aria-hidden="true"><img src="/concepts/sapiens-core-orange.png" alt="" width="140" height="140"/></span>;
}
