import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompetitions, joinCompetition } from '../api/competitions';
import { Competition, ApiError } from '../types/api';
import { CompetitionCard } from '../components/CompetitionCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { addJoinedCompetition, syncJoinedCompetitions, getJoinedCompetitions } from '../utils/joinedCompetitions';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [joinedFilter, setJoinedFilter] = useState<'all' | 'joined' | 'not_joined'>('all');

  const joinedCount = getJoinedCompetitions().size;
  const userBalance =
    (user?.walletBalance ?? 0) - (user?.exposure ?? 0);

  const fetchCompetitions = async () => {
   if (authLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await getCompetitions({
        page,
        limit: 12,
        search: search || undefined,
        sort: sort || undefined,
        joined:
          joinedFilter === 'all'
            ? undefined
            : joinedFilter === 'joined'
            ? true
            : false,
      });
      
       syncJoinedCompetitions(response.data);
      
      const joinedFromStorage = getJoinedCompetitions();
      
      const competitionsWithJoinedStatus = response.data.map((comp) => {
        const isJoined = comp.joined || joinedFromStorage.has(comp._id);
        return {
          ...comp,
          joined: isJoined,
        };
      });
      
      setCompetitions(competitionsWithJoinedStatus);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages || Math.ceil(response.meta.total / response.meta.limit));
    } catch (error: any) {
      const apiError = error.response?.data as ApiError;
      toast.error(apiError?.error || 'Failed to load competitions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchCompetitions();
    }
  }, [page, search, sort, joinedFilter, authLoading]);

  const handleJoin = async (id: string) => {
   if (authLoading) {
      return;
   }

    if (!isAuthenticated) {
      toast.info('Please login to join competitions');
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    const competition = competitions.find(c => c._id === id);
    if (competition?.joined) {
      toast.info('You have already joined this competition');
      return;
    }

     const entryFee = competition?.entryFee ?? 0;
    const exposure = user?.exposure ?? 0;
    const wallet = user?.walletBalance ?? 100;
    const balance = wallet - exposure;
    if (entryFee > balance) {
      toast.error('Insufficient balance to join this competition');
      return;
    }

    setIsJoining(id);
    try {
      await joinCompetition(id);
       addJoinedCompetition(id);
      
      toast.success('Successfully joined the competition! Good luck! 🚀');
     setCompetitions((prev) =>
        prev.map((comp) =>
          comp._id === id
            ? { ...comp, joined: true, participantCount: comp.participantCount + 1 }
            : comp
        )
      );
     checkAuth();
      
      setTimeout(() => {
        fetchCompetitions();
      }, 500);
    } catch (error: any) {
      const apiError = error.response?.data as ApiError;
      if (apiError?.code === 'INSUFFICIENT_BALANCE' || apiError?.error?.toLowerCase().includes('insufficient')) {
        toast.error('Insufficient balance to join this competition');
        throw error;
      } else
      if (apiError?.error?.includes('Already') || apiError?.code === 'ALREADY_JOINED') {
        addJoinedCompetition(id);
        setCompetitions((prev) =>
          prev.map((comp) =>
            comp._id === id ? { ...comp, joined: true } : comp
          )
        );
        fetchCompetitions();
        toast.info('You are already joined to this competition');
      } else if (apiError?.error?.includes('full') || apiError?.code === 'COMPETITION_FULL') {
        toast.error('This competition is full');
        throw error;
      } else if (apiError?.error?.includes('ended') || apiError?.code === 'COMPETITION_ENDED') {
        toast.error('This competition has ended');
        throw error;
      } else {
        toast.error(apiError?.error || 'Failed to join competition');
        throw error;
      }
    } finally {
      setIsJoining(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      <Header />
      <main className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/10 text-primary-300 border border-primary-500/20 text-sm mb-3">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                Live now — New competitions added daily
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-100 mb-3 leading-tight">
                Join Elite <span className="text-gradient">Trading Battles</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Test your strategy, climb the leaderboard, and win real prizes. Zero risk to your exchange funds.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setSort('created:desc');
                  setPage(1);
                }}
                className="btn-secondary"
              >
                Discover New
              </button>
              <button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                className="btn-primary shadow-glow"
              >
                {isAuthenticated ? 'My Competitions' : 'Create Free Account'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-dark-border bg-dark-card/70 p-4 backdrop-blur">
              <div className="text-sm text-gray-400">Active Competitions</div>
              <div className="mt-1 text-2xl font-bold text-gray-100">{total}</div>
              <div className="mt-1 text-xs text-gray-500">Updated in real-time</div>
            </div>
            <div className="rounded-xl border border-dark-border bg-dark-card/70 p-4 backdrop-blur">
              <div className="text-sm text-gray-400">Joined</div>
              <div className="mt-1 text-2xl font-bold text-gray-100">{joinedCount}</div>
              <div className="mt-1 text-xs text-gray-500">On this device</div>
            </div>
            <div className="rounded-xl border border-dark-border bg-dark-card/70 p-4 backdrop-blur">
              <div className="text-sm text-gray-400">Available Balance</div>
              <div className="mt-1 text-2xl font-bold text-gray-100">
                {isAuthenticated ? `$${userBalance.toLocaleString()}` : '—'}
              </div>
              <div className="mt-1 text-xs text-gray-500">{isAuthenticated ? 'Wallet - Exposure' : 'Login to view'}</div>
            </div>
          </div>
        </div>

         <div className="mb-8 space-y-4 animate-slide-up">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search competitions..."
                  className="input-field pl-12"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button type="submit" className="sr-only">Search</button>
            </form>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="input-field sm:w-64"
            >
              <option value="">Sort by...</option>
              <option value="prize:desc">Prize Pool (High to Low)</option>
              <option value="prize:asc">Prize Pool (Low to High)</option>
              <option value="fee:asc">Entry Fee (Low to High)</option>
              <option value="fee:desc">Entry Fee (High to Low)</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="created:desc">Newest First</option>
            </select>
            <button
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setSort('');
                setJoinedFilter('all');
                setPage(1);
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-gray-500">Quick filters:</span>
            <button
              onClick={() => handleSortChange('created:desc')}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                sort === 'created:desc'
                  ? 'bg-primary-600 text-white border-primary-500 shadow-glow'
                  : 'bg-dark-card text-gray-300 border-dark-border hover:bg-dark-hover'
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => handleSortChange('prize:desc')}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                sort === 'prize:desc'
                  ? 'bg-primary-600 text-white border-primary-500 shadow-glow'
                  : 'bg-dark-card text-gray-300 border-dark-border hover:bg-dark-hover'
              }`}
            >
              Top Prize
            </button>
            <button
              onClick={() => handleSortChange('fee:asc')}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                sort === 'fee:asc'
                  ? 'bg-primary-600 text-white border-primary-500 shadow-glow'
                  : 'bg-dark-card text-gray-300 border-dark-border hover:bg-dark-hover'
              }`}
            >
              Low Entry Fee
            </button>

            <div className="ml-auto flex items-center gap-1 rounded-full border border-dark-border bg-dark-card p-1">
              <button
                onClick={() => {
                  setJoinedFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  joinedFilter === 'all'
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-gray-300 hover:bg-dark-hover'
                }`}
              >
                All
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      setJoinedFilter('joined');
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      joinedFilter === 'joined'
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'text-gray-300 hover:bg-dark-hover'
                    }`}
                  >
                    Joined
                  </button>
                  <button
                    onClick={() => {
                      setJoinedFilter('not_joined');
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      joinedFilter === 'not_joined'
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'text-gray-300 hover:bg-dark-hover'
                    }`}
                  >
                    Not Joined
                  </button>
                </>
              )}
            </div>
          </div>

           {!isLoading && (
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>
                Showing {competitions.length} of {total} competitions
              </span>
              {totalPages > 1 && (
                <span>
                  Page {page} of {totalPages}
                </span>
              )}
            </div>
          )}
        </div>

         {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 bg-dark-card rounded-full flex items-center justify-center border border-dark-border shadow-lg">
              <svg
                className="w-12 h-12 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-2">No competitions found</p>
            <p className="text-gray-500 text-sm">
              {search ? 'Try adjusting your search filters' : 'Check back later for new competitions'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setSort('created:desc');
                  setPage(1);
                }}
                className="btn-primary"
              >
                Browse All Competitions
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary"
              >
                {isAuthenticated ? 'Refresh' : 'Login to Join'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map((competition, index) => (
                <div
                  key={competition._id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CompetitionCard
                    competition={competition}
                    onJoin={handleJoin}
                    isJoining={isJoining === competition._id}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-30"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          page === pageNum
                            ? 'bg-primary-600 text-white shadow-glow'
                            : 'bg-dark-card text-gray-300 hover:bg-dark-hover border border-dark-border'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary disabled:opacity-30"
                >
                  Next
                  <svg className="w-5 h-5 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
