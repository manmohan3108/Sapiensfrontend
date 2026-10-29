/** Shared purpose statement for the simulation entry and inspection pages. */
export function SimulationPurpose({ sapienName }: { sapienName?: string | null }) {
  const name = sapienName?.trim();
  return (
    <p className="max-w-[48ch] break-words border-l-2 border-amber-600/60 pl-4 text-balance text-xl font-medium leading-snug text-foreground dark:border-amber-400/60 sm:text-2xl">
      See how {name ? `${name}, your Sapien,` : 'a Sapien'} <strong className="font-semibold text-amber-800 dark:text-amber-300">behaves at work</strong> in a simulated workplace.
    </p>
  );
}
