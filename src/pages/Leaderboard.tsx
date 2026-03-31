import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaderboard } from '@/lib/supabase-service';
import { getTestById } from '@/lib/supabase-service';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Trophy, ArrowLeft, TrendingUp, Medal, Loader2 } from 'lucide-react';

interface LeaderboardEntry {
  test_id: string;
  test_name: string;
  name?: string;
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
  const [testName, setTestName] = useState<string>("");

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        if (!testId) {
          setError('Test ID is required');
          setLoading(false);
          return;
        }

        // Get test name from Supabase
        const test = await getTestById(testId);
        if (test) {
          setTestName(test.name);
        }

        // Get leaderboard from Supabase
        const data = await getLeaderboard(testId, 100);
        
        if (data && data.length > 0) {
          setEntries(data as LeaderboardEntry[]);
        } else {
          setError('No attempts found for this test');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [testId]);
      }
    }

    fetchLeaderboard();
  }, [testId]);

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-amber-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-muted to-muted';
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) {
      return <Medal className={`w-5 h-5 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-500'}`} />;
    }
    return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  if (!testId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <p className="text-destructive mb-4">Invalid test ID</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
                {testName && <p className="text-sm text-muted-foreground">{testName}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass border-destructive/30 rounded-xl p-6 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Attempts Yet</p>
            <p className="text-muted-foreground">Be the first to take this test!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 mb-6">
                {/* 2nd Place */}
                <div className="glass rounded-xl p-4 text-center order-1">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">2</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm truncate">{entries[1]?.name || entries[1]?.telegram_username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{entries[1]?.telegram_username}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{entries[1]?.score}/{entries[1]?.total_questions}</p>
                </div>
                
                {/* 1st Place */}
                <div className="glass rounded-xl p-4 text-center order-2 -mt-4 border-yellow-500/30">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-foreground truncate">{entries[0]?.name || entries[0]?.telegram_username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{entries[0]?.telegram_username}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{entries[0]?.score}/{entries[0]?.total_questions}</p>
                  <p className="text-xs text-success">{entries[0]?.percentage.toFixed(1)}%</p>
                </div>
                
                {/* 3rd Place */}
                <div className="glass rounded-xl p-4 text-center order-3">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">3</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm truncate">{entries[2]?.name || entries[2]?.telegram_username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{entries[2]?.telegram_username}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{entries[2]?.score}/{entries[2]?.total_questions}</p>
                </div>
              </div>
            )}

            {/* Full List */}
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={`${entry.telegram_username}_${entry.submitted_at}`}
                  className={`glass rounded-xl p-4 transition-all hover:bg-secondary/50 ${
                    entry.rank <= 3 ? 'border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Rank */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(entry.rank)} flex items-center justify-center`}>
                        {getMedalIcon(entry.rank)}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {entry.name || entry.telegram_username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{entry.telegram_username}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xl font-bold text-foreground">
                        {entry.score}/{entry.total_questions}
                      </p>
                      <p className="text-sm text-muted-foreground">{entry.percentage.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mt-3 bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        entry.percentage >= 70 ? 'bg-success' : entry.percentage >= 40 ? 'bg-warning' : 'bg-destructive'
                      }`}
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(entry.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
