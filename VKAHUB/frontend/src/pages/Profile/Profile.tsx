import { useEffect } from 'react';
import { Container, Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getLastProfileTab, clearLastProfileTab } from '../../utils/navigation';
import { GeneralInformation } from './tabs/GeneralInformation';
import { Certificates } from './tabs/Certificates';
import { RolesAndSkills } from './tabs/RolesAndSkills';
import { TeamsHistory } from './tabs/TeamsHistory';
import { MyTeam } from './tabs/MyTeam';
import { CompetitionParticipation } from './tabs/CompetitionParticipation';
import { ActivityHistory } from './tabs/ActivityHistory';
import {
  IconUser,
  IconCertificate,
  IconBriefcase,
  IconUsers,
  IconUserCircle,
  IconTrophy,
  IconHistory,
} from '@tabler/icons-react';

export function Profile() {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or restore from history
  const getActiveTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab;

    // If coming from another page, restore last tab
    const lastTab = getLastProfileTab();
    if (lastTab && lastTab !== 'general') {
      setSearchParams({ tab: lastTab });
      return lastTab;
    }

    return 'general';
  };

  const activeTab = getActiveTab();

  // Clear history when leaving profile
  useEffect(() => {
    return () => {
      clearLastProfileTab();
    };
  }, []);

  const handleTabChange = (value: string | null) => {
    if (value) {
      setSearchParams({ tab: value });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="pills"
        styles={{
          root: {
            marginTop: 20,
          },
          list: {
            background: 'rgba(10, 31, 68, 0.6)',
            backdropFilter: 'blur(20px)',
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(0, 217, 255, 0.2)',
            marginBottom: 32,
          },
          tab: {
            color: '#ffffff',
            '&:hover': {
              background: 'rgba(0, 217, 255, 0.2)',
            },
            '&[data-active="true"]': {
              background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
              color: 'var(--vtb-blue-dark)',
              fontWeight: 700,
            },
          },
        }}
      >
        <Tabs.List grow>
          <Tabs.Tab value="general" leftSection={<IconUser size={18} />}>
            Общая информация
          </Tabs.Tab>
          <Tabs.Tab value="certificates" leftSection={<IconCertificate size={18} />}>
            Сертификаты
          </Tabs.Tab>
          <Tabs.Tab value="roles" leftSection={<IconBriefcase size={18} />}>
            Роли и навыки
          </Tabs.Tab>
          <Tabs.Tab value="teams-history" leftSection={<IconUsers size={18} />}>
            История команд
          </Tabs.Tab>
          <Tabs.Tab value="my-team" leftSection={<IconUserCircle size={18} />}>
            Мои команды
          </Tabs.Tab>
          <Tabs.Tab value="competitions" leftSection={<IconTrophy size={18} />}>
            Соревнования
          </Tabs.Tab>
          <Tabs.Tab value="activity" leftSection={<IconHistory size={18} />}>
            Активность
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="xl">
          <GeneralInformation />
        </Tabs.Panel>

        <Tabs.Panel value="certificates" pt="xl">
          <Certificates />
        </Tabs.Panel>

        <Tabs.Panel value="roles" pt="xl">
          <RolesAndSkills />
        </Tabs.Panel>

        <Tabs.Panel value="teams-history" pt="xl">
          <TeamsHistory />
        </Tabs.Panel>

        <Tabs.Panel value="my-team" pt="xl">
          <MyTeam />
        </Tabs.Panel>

        <Tabs.Panel value="competitions" pt="xl">
          <CompetitionParticipation />
        </Tabs.Panel>

        <Tabs.Panel value="activity" pt="xl">
          <ActivityHistory />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
