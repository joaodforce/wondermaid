import { cn } from '@/lib/utils';
import { weaponName } from '@/modules/calculator/data';
import type { ScenarioSummary } from '@/modules/leaderboard/types';
import { EnkaIcon } from './build/enka-icon';

const RARITY_BACKGROUNDS = {
  4: 'bg-gradient-to-b from-[#5e5789] to-[#9c75b7]',
  5: 'bg-gradient-to-b from-[#945c2c] to-[#b27330]',
};

/** The party a board simulates, with constellations and the weapon every Noelle is evaluated with */
export function TeamComposition({ scenario }: { scenario: ScenarioSummary }) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-white/10 px-4 py-4 sm:px-5">
      <ul className="flex gap-2 sm:gap-3" aria-label="Team">
        {scenario.members.map((member, index) =>
          member.kind === 'flex' ? (
            <li
              key={`flex-${index}`}
              title="Flex slot: doesn't change the calculation"
              className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-white/15 text-xs font-medium text-stone-500 sm:h-20 sm:w-20"
            >
              Flex
            </li>
          ) : (
            <li
              key={member.name}
              title={`${member.name} C${member.constellation}`}
              className={cn(
                'relative h-16 w-16 overflow-visible rounded-xl border-2 border-amber-200/70 sm:h-20 sm:w-20',
                RARITY_BACKGROUNDS[member.rarity],
              )}
            >
              <EnkaIcon icon={member.icon} size={80} alt={member.name} className="h-full w-full rounded-[10px] object-cover" />
              {member.constellation > 0 && (
                <span className="absolute top-0.5 right-1.5 text-lg font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">
                  {member.constellation}
                </span>
              )}
              {index === 0 && scenario.weapon.icon && (
                <span
                  title={`${weaponName(scenario.weapon.id)} R${scenario.weapon.refinement}`}
                  className="absolute -bottom-2 -left-2 h-8 w-8 overflow-hidden rounded-lg border-2 border-amber-200/70 bg-[#b27330] sm:h-9 sm:w-9"
                >
                  <EnkaIcon icon={scenario.weapon.icon} size={36} alt="" className="h-full w-full" />
                </span>
              )}
            </li>
          ),
        )}
      </ul>
      <p className="text-xs text-stone-400">
        Every build uses{' '}
        <span className="font-medium text-stone-200">
          {weaponName(scenario.weapon.id)} R{scenario.weapon.refinement}
        </span>
        , so only artifacts decide the ranking.
      </p>
    </div>
  );
}
