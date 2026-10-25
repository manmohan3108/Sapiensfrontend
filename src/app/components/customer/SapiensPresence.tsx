import identity from '../../../assets/landing/identity-480.webp';
import { useLandingMotion } from './useLandingMotion';
import '../../../styles/sapiens-presence.css';

type PresenceProps = { size?: number; animated?: boolean; className?: string; tone?: 'original' | 'orange' };

// Decorative identity artwork; the nearby name remains the accessible label.
export function SapiensPresence({ size = 40, animated = false, className = '', tone = 'original' }: PresenceProps) {
  if (animated) return <MovingPresence size={size} className={className} tone={tone} />;
  return <div className={`sapiens-presence ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <img src={tone === 'orange' ? '/concepts/sapiens-core-orange.png' : identity} width="480" height="480" alt="" />
  </div>;
}

function MovingPresence({ size, className, tone }: PresenceProps) {
  const motionRef = useLandingMotion();
  return <div ref={motionRef}>
    <div className={`sapiens-presence ${className}`} style={{ width: size, height: size }} data-motion-scene aria-hidden="true">
      <img src={tone === 'orange' ? '/concepts/sapiens-core-orange.png' : identity} width="480" height="480" alt="" />
    </div>
  </div>;
}
