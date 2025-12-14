import { create } from 'zustand';
import { Team } from '@/types';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  userTeams: Team[];
  setTeams: (teams: Team[]) => void;
  setCurrentTeam: (team: Team | null) => void;
  setUserTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: number, teamData: Partial<Team>) => void;
  removeTeam: (teamId: number) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  currentTeam: null,
  userTeams: [],

  setTeams: (teams) => set({ teams }),

  setCurrentTeam: (team) => set({ currentTeam: team }),

  setUserTeams: (teams) => set({ userTeams: teams }),

  addTeam: (team) =>
    set((state) => ({
      teams: [...state.teams, team],
    })),

  updateTeam: (teamId, teamData) =>
    set((state) => ({
      teams: state.teams.map((team) =>
        team.id === teamId ? { ...team, ...teamData } : team
      ),
      currentTeam:
        state.currentTeam?.id === teamId
          ? { ...state.currentTeam, ...teamData }
          : state.currentTeam,
    })),

  removeTeam: (teamId) =>
    set((state) => ({
      teams: state.teams.filter((team) => team.id !== teamId),
      currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
    })),
}));
