import noticeSmall from '../../../assets/landing/notice-480.webp';
import noticeLarge from '../../../assets/landing/notice-720.webp';
import understandSmall from '../../../assets/landing/understand-480.webp';
import understandLarge from '../../../assets/landing/understand-720.webp';
import actSmall from '../../../assets/landing/act-480.webp';
import actLarge from '../../../assets/landing/act-720.webp';
import reflectSmall from '../../../assets/landing/reflect-480.webp';
import reflectLarge from '../../../assets/landing/reflect-720.webp';

const scenes = [
  { small: noticeSmall, large: noticeLarge, name: 'notice', description: 'The violet individual encounters incoming glass fragments, with one warm fragment drawing its attention.' },
  { small: understandSmall, large: understandLarge, name: 'understand', description: 'The same individual connects points of light across layered experience.' },
  { small: actSmall, large: actLarge, name: 'act', description: 'The individual reaches toward a separate person and a tool through two flowing connections.' },
  { small: reflectSmall, large: reflectLarge, name: 'reflect', description: 'An outcome settles beside the individual, with a returning ribbon connecting it to experience.' },
];

export function CycleIllustration({ stage }: { stage: number }) {
  const scene = scenes[stage];
  return <div className={`landing-cycle-art landing-scene-${scene.name}`}>
    <img className="landing-scene-image" src={scene.large} srcSet={`${scene.small} 480w, ${scene.large} 720w`}
      sizes="(max-width: 600px) calc(100vw - 80px), (max-width: 1000px) 480px, 280px"
      width="720" height="480" loading="lazy" decoding="async" alt={scene.description} />
    <span className="landing-scene-light" aria-hidden="true" />
  </div>;
}
