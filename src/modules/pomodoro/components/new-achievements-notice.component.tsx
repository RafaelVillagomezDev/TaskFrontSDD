import { Link } from 'react-router';
import { Trophy } from 'lucide-react';

import { ROUTES } from '@shared/router/routes.constants';
import { Box } from '@shared/ui/box.component';
import { Button } from '@shared/ui/button.component';
import { Icon } from '@shared/ui/icon.component';
import { Text } from '@shared/ui/text.component';
import type { Achievement } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface NewAchievementsNoticeProps {
  achievements: Achievement[];
}

const { newAchievements: texts } = POMODORO_TEXTS;

// Aviso en el resultado con los logros conseguidos durante la sesión (RF-68), con acceso a «Logros». El texto va en
// un <output> (estado, S6819) y el enlace fuera de él. Sin logros nuevos no se muestra (RF-69)
export function NewAchievementsNotice({ achievements }: Readonly<NewAchievementsNoticeProps>) {
  if (achievements.length === 0) return null;
  return (
    <Box variant="subtle" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <output className="flex flex-1 items-start gap-3">
        <span className="text-primary-text">
          <Icon icon={Trophy} />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <Text as="span" variant="body" className="font-semibold">
            {texts.title(achievements.length)}
          </Text>
          <ul aria-label={texts.list} className="flex flex-col">
            {achievements.map((achievement) => (
              <li key={achievement.code}>
                <Text as="span" variant="body-sm" className="break-words">
                  {achievement.name}
                </Text>
              </li>
            ))}
          </ul>
        </span>
      </output>
      <Button as={Link} to={ROUTES.pomodoroAchievements} variant="secondary" size="sm" className="self-start sm:self-center">
        {texts.open}
      </Button>
    </Box>
  );
}
