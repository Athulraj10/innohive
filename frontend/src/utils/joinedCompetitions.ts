const STORAGE_KEY = 'joined_competitions';

export interface JoinedCompetition {
  competitionId: string;
  joinedAt: string;
}

export const getJoinedCompetitions = (): Set<string> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return new Set();
    
    const competitions: JoinedCompetition[] = JSON.parse(data);
    return new Set(competitions.map(c => c.competitionId));
  } catch (error) {
    console.error('Error reading joined competitions from localStorage:', error);
    return new Set();
  }
};


export const isCompetitionJoined = (competitionId: string): boolean => {
  const joined = getJoinedCompetitions();
  return joined.has(competitionId);
};


export const addJoinedCompetition = (competitionId: string): void => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const competitions: JoinedCompetition[] = data ? JSON.parse(data) : [];
    
    if (competitions.some(c => c.competitionId === competitionId)) {
      return;
    }
    
    competitions.push({
      competitionId,
      joinedAt: new Date().toISOString(),
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(competitions));
  } catch (error) {
    console.error('Error saving joined competition to localStorage:', error);
  }
};


export const removeJoinedCompetition = (competitionId: string): void => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    
    const competitions: JoinedCompetition[] = JSON.parse(data);
    const filtered = competitions.filter(c => c.competitionId !== competitionId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing joined competition from localStorage:', error);
  }
};


export const syncJoinedCompetitions = (competitions: Array<{ _id: string; joined?: boolean }>): void => {
  try {
    const joinedIds = competitions
      .filter(c => c.joined === true)
      .map(c => c._id);

    if (joinedIds.length > 0) {
      const currentJoined = getJoinedCompetitions();
      joinedIds.forEach(id => {
        if (!currentJoined.has(id)) {
          addJoinedCompetition(id);
        }
      });
    }
  } catch (error) {
    console.error('Error syncing joined competitions:', error);
  }
};


export const clearJoinedCompetitions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing joined competitions:', error);
  }
};

