// src/controllers/dashboard.controller.js
import Journal from '../models/Journal.js'
import News from '../models/News.js'
import Event from '../models/Event.js'
import Topic from '../models/Topic.js'
import Subscriber from '../models/Subscriber.js'
import ActivityLog from '../models/ActivityLog.js'
import { catchAsync } from '../utils/catchAsync.js'
import { cacheGet, cacheSet } from '../config/redis.js'

export const getStats = catchAsync(async (req, res) => {
  const cached = await cacheGet('dashboard:stats')
  if (cached) return res.status(200).json(cached)

  const [
    totalJournals,
    publishedJournals,
    draftJournals,
    totalNews,
    publishedNews,
    totalEvents,
    upcomingEvents,
    totalTopics,
    totalSubscribers,
    activeSubscribers,
    totalViews,
  ] = await Promise.all([
    Journal.countDocuments(),
    Journal.countDocuments({ status: 'published' }),
    Journal.countDocuments({ status: 'draft' }),
    News.countDocuments(),
    News.countDocuments({ isPublished: true }),
    Event.countDocuments(),
    Event.countDocuments({ eventDate: { $gte: new Date() } }),
    Topic.countDocuments(),
    Subscriber.countDocuments(),
    Subscriber.countDocuments({ status: 'active', isVerified: true }),
    Journal.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
  ])

  const response = {
    status: 'success',
    data: {
      journals: { total: totalJournals, published: publishedJournals, draft: draftJournals },
      news: { total: totalNews, published: publishedNews },
      events: { total: totalEvents, upcoming: upcomingEvents },
      topics: { total: totalTopics },
      subscribers: { total: totalSubscribers, active: activeSubscribers },
      totalViews: totalViews[0]?.total || 0,
    },
  }

  await cacheSet('dashboard:stats', response, 60)
  res.status(200).json(response)
})

export const getRecentActivity = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20

  const activities = await ActivityLog.find()
    .populate('userId', 'name avatar')
    .sort('-createdAt')
    .limit(limit)

  res.status(200).json({ status: 'success', data: activities })
})

export const getPopularJournals = catchAsync(async (req, res) => {
  const journals = await Journal.find({ status: 'published' })
    .populate('topic', 'name slug color')
    .sort('-viewCount')
    .limit(10)
    .select('title slug viewCount coverImage publicationDate topic')

  res.status(200).json({ status: 'success', data: journals })
})

export const getJournalsByTopic = catchAsync(async (req, res) => {
  const topicStats = await Journal.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    {
      $lookup: {
        from: 'topics',
        localField: '_id',
        foreignField: '_id',
        as: 'topic',
      },
    },
    { $unwind: '$topic' },
    {
      $project: {
        _id: 0,
        topicId: '$_id',
        name: '$topic.name',
        color: '$topic.color',
        icon: '$topic.icon',
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ])

  res.status(200).json({ status: 'success', data: topicStats })
})


export const getAnalytics = catchAsync(async (req, res) => {
  const monthsBack = parseInt(req.query.months, 10) || 6
  const now = new Date()

  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1)

  const monthLabels = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleString('en-US', { month: 'short' })

    monthLabels.push({
      key,
      month: label,
      journals: 0,
      news: 0,
      events: 0,
      subscribers: 0,
      views: 0,
    })
  }

  const makeCountPipeline = () => [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]

  const journalViewsPipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        views: { $sum: '$viewCount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]

  const [
    journalsMonthly,
    newsMonthly,
    eventsMonthly,
    subscribersMonthly,
    viewsMonthly,
  ] = await Promise.all([
    Journal.aggregate(makeCountPipeline()),
    News.aggregate(makeCountPipeline()),
    Event.aggregate(makeCountPipeline()),
    Subscriber.aggregate(makeCountPipeline()),
    Journal.aggregate(journalViewsPipeline),
  ])

  const analyticsMap = new Map(monthLabels.map((item) => [item.key, item]))

  const applyCounts = (items, field) => {
    items.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
      if (analyticsMap.has(key)) {
        analyticsMap.get(key)[field] = item.count || 0
      }
    })
  }

  const applyViews = (items) => {
    items.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
      if (analyticsMap.has(key)) {
        analyticsMap.get(key).views = item.views || 0
      }
    })
  }

  applyCounts(journalsMonthly, 'journals')
  applyCounts(newsMonthly, 'news')
  applyCounts(eventsMonthly, 'events')
  applyCounts(subscribersMonthly, 'subscribers')
  applyViews(viewsMonthly)

  res.status(200).json({
    status: 'success',
    data: Array.from(analyticsMap.values()),
  })
})