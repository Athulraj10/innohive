import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Participant } from '../types/api';
import { getCompetitionParticipants } from '../api/competitions';
import { useAuth } from '../hooks/useAuth';

interface ParticipantsSidebarProps {
  competitionId: string;
}

export const ParticipantsSidebar = ({ competitionId }: ParticipantsSidebarProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      // Only fetch if user is authenticated
      if (!isAuthenticated || authLoading) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await getCompetitionParticipants(competitionId, {
          limit: 50, // Show top 50 participants
        });
        // Sort by rank if available, otherwise by joinedAt
        const sorted = [...response.data].sort((a, b) => {
          if (a.rank && b.rank) {
            return a.rank - b.rank;
          }
          if (a.rank) return -1;
          if (b.rank) return 1;
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        });
        setParticipants(sorted);
      } catch (err: any) {
        console.error('Failed to fetch participants:', err);
        setError('Failed to load participants');
      } finally {
        setIsLoading(false);
      }
    };

    if (competitionId) {
      fetchParticipants();
    }
  }, [competitionId, isAuthenticated, authLoading]);

  const getRankBadgeColor = (rank: number | undefined, index: number) => {
    const displayRank = rank || index + 1;
    if (displayRank === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (displayRank === 2) return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    if (displayRank === 3) return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
    return 'bg-dark-surface text-gray-400 border-dark-border';
  };

  const topThree = participants.slice(0, 3);
  const currentUserEntry = user ? participants.find(p => p.userId?._id === user._id) : undefined;
  const currentUserRank = currentUserEntry ? (currentUserEntry.rank ?? (participants.findIndex(p => p._id === currentUserEntry._id) + 1)) : undefined;

  // Show login message if not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="bg-dark-card rounded-lg border border-dark-border p-6">
        <h3 className="text-xl font-bold text-gray-100 mb-4">Participants</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-dark-surface rounded-full flex items-center justify-center border border-dark-border">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Login to see participants
          </p>
          <button
            onClick={() => navigate('/login', { state: { from: window.location.pathname } })}
            className="btn-primary text-sm"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-6">
      <h3 className="text-xl font-bold text-gray-100 mb-4">Participants</h3>

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="mb-5">
          <div className="grid grid-cols-3 items-end gap-2">
            {topThree.map((p, idx) => {
              const place = (p.rank ?? idx + 1);
              const heightClass = place === 1 ? 'h-24' : place === 2 ? 'h-20' : 'h-16';
              const color = place === 1 ? 'from-yellow-500/30 to-yellow-600/10 border-yellow-500/30' : place === 2 ? 'from-gray-400/30 to-gray-500/10 border-gray-400/30' : 'from-orange-500/30 to-orange-600/10 border-orange-500/30';
              return (
                <div key={p._id} className="flex flex-col items-center">
                  <div className={`w-full ${heightClass} rounded-t-xl bg-gradient-to-t ${color} border-x border-t`} />
                  <div className="mt-2 text-center">
                    <div className="text-xl">{place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}</div>
                    <div className="text-xs text-gray-400 mt-1 truncate max-w-[80px]">
                      {p.userId?.name ?? 'User'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {authLoading || isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-surface rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-dark-surface rounded w-24 mb-2 animate-pulse" />
                <div className="h-3 bg-dark-surface rounded w-16 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No participants yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
          {/* Current user pin */}
          {currentUserEntry && (
            <div className="sticky top-0 z-10 -mt-1 pt-1">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary-600/15 border border-primary-500/30 backdrop-blur">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${getRankBadgeColor(currentUserEntry.rank, currentUserRank ? currentUserRank - 1 : 0)}`}>
                  {currentUserRank && currentUserRank <= 3 ? (
                    <span className="text-lg">{currentUserRank === 1 ? '🥇' : currentUserRank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    currentUserRank ?? '-'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-100 truncate">You</p>
                  {currentUserEntry.rank && (
                    <p className="text-xs text-gray-400">Rank: #{currentUserEntry.rank}</p>
                  )}
                </div>
                {typeof currentUserEntry.profitLoss === 'number' && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">PnL</p>
                    <p className={`text-sm font-semibold ${currentUserEntry.profitLoss >= 0 ? 'text-success-light' : 'text-danger-light'}`}>
                      {currentUserEntry.profitLoss >= 0 ? '+' : ''}{currentUserEntry.profitLoss.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {participants.map((participant, index) => {
            const displayRank = participant.rank || index + 1;
            const rankBadgeColor = getRankBadgeColor(participant.rank, index);
            
            return (
              <div
                key={participant._id}
                className="flex items-center space-x-3 p-3 rounded-lg bg-dark-surface border border-dark-border hover:border-primary-500/30 transition-colors"
              >
                {/* Rank Badge */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${rankBadgeColor}`}
                >
                  {displayRank <= 3 ? (
                    <span className="text-lg">
                      {displayRank === 1 ? '🥇' : displayRank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    displayRank
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {participant.userId.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        <span>
                          {participant.userId.name?.slice(0, 4)}
                        </span>
                        {participant.userId.name && participant.userId.name.length > 4 && (
                          <span className="filter blur-sm select-none">
                            {participant.userId.name.slice(4)}
                          </span>
                        )}
                      </p>
                      {participant.rank && (
                        <p className="text-xs text-gray-500">Rank: #{participant.rank}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Portfolio Value (if available) */}
                {participant.portfolioValue !== undefined && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-400">Portfolio</p>
                    <p className="text-sm font-semibold text-gray-200">
                      ${participant.portfolioValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {participant.profitLoss !== undefined && (
                      <p
                        className={`text-xs font-medium ${
                          participant.profitLoss >= 0
                            ? 'text-success-light'
                            : 'text-danger-light'
                        }`}
                      >
                        {participant.profitLoss >= 0 ? '+' : ''}
                        {participant.profitLoss.toFixed(2)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

