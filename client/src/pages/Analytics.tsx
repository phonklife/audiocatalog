import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, TrendingUp, Music, Calendar, PieChart as PieChartIcon } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type TimePeriod = "day" | "week" | "month";

export default function Analytics() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

  // Listening patterns queries
  const { data: dayPatterns, isLoading: dayLoading } = trpc.history.listeningPatternsByDay.useQuery(
    { daysBack: 30 },
    { enabled: isAuthenticated && timePeriod === "day" }
  );

  const { data: weekPatterns, isLoading: weekLoading } = trpc.history.listeningPatternsByWeek.useQuery(
    { weeksBack: 12 },
    { enabled: isAuthenticated && timePeriod === "week" }
  );

  const { data: monthPatterns, isLoading: monthLoading } = trpc.history.listeningPatternsByMonth.useQuery(
    { monthsBack: 12 },
    { enabled: isAuthenticated && timePeriod === "month" }
  );

  // Genre preferences
  const { data: genrePrefs, isLoading: genreLoading } = trpc.history.genrePreferences.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  const { data: topGenresByPeriod, isLoading: topGenreLoading } = trpc.history.topGenresByPeriod.useQuery(
    { period: timePeriod },
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-blue-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-blue-900 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h1 className="text-3xl font-bold mb-2 text-foreground">Analytics</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your listening analytics</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const chartData = 
    timePeriod === "day" ? dayPatterns :
    timePeriod === "week" ? weekPatterns :
    monthPatterns;

  const isChartLoading = 
    timePeriod === "day" ? dayLoading :
    timePeriod === "week" ? weekLoading :
    monthLoading;

  const COLORS = ["#06b6d4", "#0ea5e9", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#84cc16"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-blue-900">
      {/* Header */}
      <div className="border-b border-border/20 backdrop-blur-md bg-background/10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation('/statistics')}
                className="p-2 hover:bg-border/30 rounded-lg transition-colors"
                aria-label="Back to statistics"
              >
                <ArrowLeft className="w-6 h-6 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground">Detailed listening insights</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
              {user?.name || "Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Time Period Selector */}
        <div className="flex gap-3 mb-8">
          <Button
            onClick={() => setTimePeriod("day")}
            variant={timePeriod === "day" ? "default" : "outline"}
            className={timePeriod === "day" ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Daily
          </Button>
          <Button
            onClick={() => setTimePeriod("week")}
            variant={timePeriod === "week" ? "default" : "outline"}
            className={timePeriod === "week" ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Weekly
          </Button>
          <Button
            onClick={() => setTimePeriod("month")}
            variant={timePeriod === "month" ? "default" : "outline"}
            className={timePeriod === "month" ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Monthly
          </Button>
        </div>

        {/* Listening Patterns Chart */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Listening Patterns ({timePeriod === "day" ? "Daily" : timePeriod === "week" ? "Weekly" : "Monthly"})
          </h2>
          {isChartLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey={timePeriod === "day" ? "date" : timePeriod === "week" ? "week" : "month"}
                  stroke="rgba(255,255,255,0.5)"
                />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(20, 20, 30, 0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No data available for this period</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overall Genre Preferences */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-accent" />
              Genre Preferences
            </h2>
            {genreLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : genrePrefs && genrePrefs.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={genrePrefs}
                      dataKey="plays"
                      nameKey="genre"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {genrePrefs.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "rgba(20, 20, 30, 0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {genrePrefs.map((genre, index) => (
                    <div key={genre.genre} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {genre.genre || "Unknown"}
                      </span>
                      <span className="text-muted-foreground">{genre.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No genre data available</p>
              </div>
            )}
          </div>

          {/* Top Genres by Period */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-accent" />
              Top Genres ({timePeriod === "day" ? "Today" : timePeriod === "week" ? "This Week" : "This Month"})
            </h2>
            {topGenreLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : topGenresByPeriod && topGenresByPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topGenresByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="genre" 
                    stroke="rgba(255,255,255,0.5)"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(20, 20, 30, 0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="plays" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No genre data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
