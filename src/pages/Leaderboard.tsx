import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaderboard } from '@/lib/supabase-service';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  test_id: string;
  test_name: string;
  telegram_username: string;
  score: number;
  total_questions: number;
  percentage: number;
  submitted_at: string;
  rank: number;
}

export default function Leaderboard() {
  const { testId } = useParams<{ testId?: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        if (!testId) {
          setError('Test ID is required');
          setLoading(false);
          return;
        }

        const data = await getLeaderboard(testId, 50);
        setEntries(data as LeaderboardEntry[]);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [testId]);

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMedalSymbol = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}`;
    }
  };

  if (!testId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Invalid test ID</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No attempts yet. Be the first to take this test!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={`${entry.telegram_username}_${entry.submitted_at}`}
                className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all hover:bg-gradient-to-r hover:from-gray-900/70 hover:to-gray-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center font-bold text-lg ${getMedalColor(
                        entry.rank
                      )}`}
                    >
                      {getMedalSymbol(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-white">{entry.telegram_username}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(entry.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-white">
                      {entry.score}/{entry.total_questions}
                    </p>
                    <p className="text-sm text-gray-400">{entry.percentage.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="mt-3 bg-gray-800/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                    style={{ width: `${entry.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
