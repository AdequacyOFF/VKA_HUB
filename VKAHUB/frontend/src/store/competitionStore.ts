import { create } from 'zustand';
import { Competition } from '@/types';

interface CompetitionState {
  competitions: Competition[];
  currentCompetition: Competition | null;
  setCompetitions: (competitions: Competition[]) => void;
  setCurrentCompetition: (competition: Competition | null) => void;
  addCompetition: (competition: Competition) => void;
  updateCompetition: (compId: number, compData: Partial<Competition>) => void;
  removeCompetition: (compId: number) => void;
}

export const useCompetitionStore = create<CompetitionState>((set) => ({
  competitions: [],
  currentCompetition: null,

  setCompetitions: (competitions) => set({ competitions }),

  setCurrentCompetition: (competition) => set({ currentCompetition: competition }),

  addCompetition: (competition) =>
    set((state) => ({
      competitions: [...state.competitions, competition],
    })),

  updateCompetition: (compId, compData) =>
    set((state) => ({
      competitions: state.competitions.map((comp) =>
        comp.id === compId ? { ...comp, ...compData } : comp
      ),
      currentCompetition:
        state.currentCompetition?.id === compId
          ? { ...state.currentCompetition, ...compData }
          : state.currentCompetition,
    })),

  removeCompetition: (compId) =>
    set((state) => ({
      competitions: state.competitions.filter((comp) => comp.id !== compId),
      currentCompetition:
        state.currentCompetition?.id === compId ? null : state.currentCompetition,
    })),
}));
