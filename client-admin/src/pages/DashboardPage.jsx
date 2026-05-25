// src/pages/DashboardPage.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Newspaper,
  CalendarDays,
  Users,
  Eye,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import StatCard from '@/components/ui/StatCard'
import { formatDateTime } from '@/lib/utils'
import { dashboardAPI } from '@/services/api'

const actionColors = {
  CREATE: 'bg-success-50 text-success-600',
  UPDATE: 'bg-primary-50 text-primary-600',
  DELETE: 'bg-danger-50 text-danger-600',
  LOGIN: 'bg-warning-50 text-warning-600',
}

const emptyStats = {
  totalJournals: 0,
  totalNews: 0,
  totalEvents: 0,
  totalSubscribers: 0,
  publishedJournals: 0,
  draftJournals: 0,
  publishedNews: 0,
  upcomingEvents: 0,
  activeSubscribers: 0,
  totalViews: 0,
}

const mapBackendStats = (data) => ({
  totalJournals: data?.journals?.total || 0,
  totalNews: data?.news?.total || 0,
  totalEvents: data?.events?.total || 0,
  totalSubscribers: data?.subscribers?.total || 0,
  publishedJournals: data?.journals?.published || 0,
  draftJournals: data?.journals?.draft || 0,
  publishedNews: data?.news?.published || 0,
  upcomingEvents: data?.events?.upcoming || 0,
  activeSubscribers: data?.subscribers?.active || 0,
  totalViews: data?.totalViews || 0,
})

const calculateTrend = (data, key) => {
  if (!data || data.length < 2) return '0%'

  const current = Number(data[data.length - 1]?.[key] || 0)
  const previous = Number(data[data.length - 2]?.[key] || 0)

  if (previous === 0 && current === 0) return '0%'
  if (previous === 0) return '+100%'

  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''

  return `${sign}${change.toFixed(1)}%`
}

export default function DashboardPage() {
  const [stats, setStats] = useState(emptyStats)
  const [recentActivity, setRecentActivity] = useState([])
  const [popularJournals, setPopularJournals] = useState([])
  const [analyticsData, setAnalyticsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError('')

      try {
        const [
          statsResponse,
          activityResponse,
          popularResponse,
          analyticsResponse,
        ] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity({ limit: 10 }),
          dashboardAPI.getPopularJournals(),
          dashboardAPI.getAnalytics({ months: 6 }),
        ])

        setStats(mapBackendStats(statsResponse?.data))
        setRecentActivity(activityResponse?.data || [])
        setPopularJournals((popularResponse?.data || []).slice(0, 5))
        setAnalyticsData(analyticsResponse?.data || [])
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load dashboard data. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const trends = useMemo(
    () => ({
      journals: calculateTrend(analyticsData, 'journals'),
      news: calculateTrend(analyticsData, 'news'),
      events: calculateTrend(analyticsData, 'events'),
      subscribers: calculateTrend(analyticsData, 'subscribers'),
      views: calculateTrend(analyticsData, 'views'),
    }),
    [analyticsData]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Welcome back! Here&apos;s what&apos;s happening with your platform.
        </p>

        {error && (
          <p className="mt-2 text-sm text-danger-600">
            {error}
          </p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Journals"
          value={loading ? '...' : stats.totalJournals}
          trend={trends.journals}
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="News Articles"
          value={loading ? '...' : stats.totalNews}
          trend={trends.news}
          icon={Newspaper}
          color="success"
        />
        <StatCard
          title="Events"
          value={loading ? '...' : stats.totalEvents}
          trend={trends.events}
          icon={CalendarDays}
          color="warning"
        />
        <StatCard
          title="Subscribers"
          value={
            loading
              ? '...'
              : Number(stats.totalSubscribers || 0).toLocaleString()
          }
          trend={trends.subscribers}
          icon={Users}
          color="danger"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Published Journals</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {loading ? '...' : stats.publishedJournals}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Draft Journals</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {loading ? '...' : stats.draftJournals}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Published News</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {loading ? '...' : stats.publishedNews}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Upcoming Events</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {loading ? '...' : stats.upcomingEvents}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Active Subscribers</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {loading ? '...' : stats.activeSubscribers}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Views Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Journal Views
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Monthly backend overview
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-success-600 bg-success-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              {trends.views}
            </div>
          </div>

          {analyticsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient
                    id="viewsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#a3a3a3' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#a3a3a3' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-neutral-400">
              No analytics data available.
            </div>
          )}
        </div>

        {/* Journals Published Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Content Published
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Monthly journals, news, and events
              </p>
            </div>
          </div>

          {analyticsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#a3a3a3' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#a3a3a3' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="journals" fill="#6366F1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="news" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="events" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-neutral-400">
              No publication data available.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-5">
            Recent Activity
          </h3>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 pb-4 border-b border-neutral-50 last:border-0 last:pb-0"
                >
                  <span
                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md flex-shrink-0 ${
                      actionColors[activity.action] ||
                      'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {activity.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 truncate">
                      {activity.details || 'Activity recorded'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {activity.userId?.name || 'System'} ·{' '}
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No recent activity available.
            </p>
          )}
        </div>

        {/* Popular Journals */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-5">
            Popular Journals
          </h3>

          {popularJournals.length > 0 ? (
            <div className="space-y-4">
              {popularJournals.map((journal, idx) => (
                <div key={journal._id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-neutral-100 rounded-md flex items-center justify-center text-xs font-bold text-neutral-500">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 font-medium truncate">
                      {journal.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Eye className="w-3 h-3 text-neutral-400" />
                      <span className="text-xs text-neutral-400">
                        {(journal.viewCount || 0).toLocaleString()} views
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No popular journals available.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}