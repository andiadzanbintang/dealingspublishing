// src/data/mockData.js

export const mockUser = {
  _id: '1',
  name: 'Dr. Admin',
  email: 'admin@researchhub.com',
  role: 'superadmin',
  avatar: null,
  lastLogin: '2025-04-17T10:30:00Z',
}

export const mockDashboardStats = {
  totalJournals: 124,
  totalNews: 47,
  totalEvents: 23,
  totalSubscribers: 1243,
  journalsTrend: '+12%',
  newsTrend: '+5%',
  eventsTrend: '+2',
  subscribersTrend: '+89',
}

export const mockRecentActivity = [
  { _id: '1', action: 'CREATE', entity: 'journal', details: 'Created journal: ML in Healthcare', userId: { name: 'Dr. Admin' }, createdAt: '2025-04-17T10:30:00Z' },
  { _id: '2', action: 'UPDATE', entity: 'news', details: 'Updated news: MIT Partnership', userId: { name: 'Dr. Admin' }, createdAt: '2025-04-17T09:15:00Z' },
  { _id: '3', action: 'CREATE', entity: 'event', details: 'Created event: AI Conference 2025', userId: { name: 'Dr. Admin' }, createdAt: '2025-04-16T16:45:00Z' },
  { _id: '4', action: 'DELETE', entity: 'subscriber', details: 'Removed bounced email: test@old.com', userId: { name: 'Dr. Admin' }, createdAt: '2025-04-16T14:20:00Z' },
  { _id: '5', action: 'UPDATE', entity: 'settings', details: 'Updated hero section text', userId: { name: 'Dr. Admin' }, createdAt: '2025-04-16T11:00:00Z' },
]

export const mockChartData = [
  { month: 'Jan', journals: 8, views: 4200, subscribers: 120 },
  { month: 'Feb', journals: 12, views: 5100, subscribers: 145 },
  { month: 'Mar', journals: 10, views: 6300, subscribers: 190 },
  { month: 'Apr', journals: 15, views: 7800, subscribers: 230 },
  { month: 'May', journals: 9, views: 6900, subscribers: 210 },
  { month: 'Jun', journals: 14, views: 8500, subscribers: 280 },
]

export const mockTopics = [
  { _id: '1', name: 'Health Sciences', slug: 'health-sciences', icon: '🏥', color: '#10B981', journalCount: 24, isActive: true, sortOrder: 1 },
  { _id: '2', name: 'Finance & Economics', slug: 'finance-economics', icon: '📊', color: '#F59E0B', journalCount: 18, isActive: true, sortOrder: 2 },
  { _id: '3', name: 'Artificial Intelligence', slug: 'artificial-intelligence', icon: '🤖', color: '#6366F1', journalCount: 31, isActive: true, sortOrder: 3 },
  { _id: '4', name: 'Environmental Science', slug: 'environmental-science', icon: '🌍', color: '#059669', journalCount: 15, isActive: true, sortOrder: 4 },
  { _id: '5', name: 'Engineering', slug: 'engineering', icon: '⚙️', color: '#EF4444', journalCount: 22, isActive: true, sortOrder: 5 },
  { _id: '6', name: 'Social Sciences', slug: 'social-sciences', icon: '🧠', color: '#8B5CF6', journalCount: 12, isActive: false, sortOrder: 6 },
]

export const mockJournals = [
  {
    _id: '1', title: 'Machine Learning Approaches in Early Disease Detection', slug: 'machine-learning-early-disease-detection', issn: '2589-0042', topic: { _id: '1', name: 'Health Sciences', color: '#10B981' }, authors: ['Dr. Sarah Chen', 'Dr. James Wilson'], abstract: 'This study explores the application of machine learning algorithms in the early detection of chronic diseases.', coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80', publicationDate: '2025-01-15', volume: '12', issue: '3', pages: '145-162', doi: '10.1234/rh.2025.001', keywords: ['machine learning', 'disease detection'], isFeatured: true, status: 'published', viewCount: 1240, createdAt: '2025-01-10T08:00:00Z',
  },
  {
    _id: '2', title: 'Sustainable Finance Models for Emerging Markets', slug: 'sustainable-finance-emerging-markets', issn: '2589-0043', topic: { _id: '2', name: 'Finance & Economics', color: '#F59E0B' }, authors: ['Prof. Michael Torres'], abstract: 'An analysis of sustainable finance frameworks.', coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80', publicationDate: '2025-02-20', volume: '8', issue: '1', pages: '23-41', doi: '10.1234/rh.2025.002', keywords: ['finance', 'ESG'], isFeatured: false, status: 'published', viewCount: 890, createdAt: '2025-02-15T10:00:00Z',
  },
  {
    _id: '3', title: 'Transformer Architectures for Scientific Text', slug: 'transformer-architectures-scientific-text', issn: '2589-0044', topic: { _id: '3', name: 'Artificial Intelligence', color: '#6366F1' }, authors: ['Dr. Emily Park', 'Dr. Robert Liu'], abstract: 'Novel transformer-based architecture for scientific literature analysis.', coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80', publicationDate: '2025-03-10', volume: '15', issue: '2', pages: '78-95', doi: '10.1234/rh.2025.003', keywords: ['NLP', 'transformers'], isFeatured: true, status: 'draft', viewCount: 2100, createdAt: '2025-03-05T14:00:00Z',
  },
]

export const mockNews = [
  { _id: '1', title: 'ResearchHub Partners with MIT for Open Access', slug: 'researchhub-mit-open-access', excerpt: 'A groundbreaking partnership to make 500+ papers freely accessible.', coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&q=80', category: 'Partnership', isPublished: true, isFeatured: true, publishedAt: '2025-04-10', viewCount: 3200, createdAt: '2025-04-08T09:00:00Z' },
  { _id: '2', title: '2025 Research Excellence Awards', slug: '2025-research-excellence-awards', excerpt: 'Celebrating outstanding contributions to science.', coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80', category: 'Awards', isPublished: true, isFeatured: false, publishedAt: '2025-03-25', viewCount: 2800, createdAt: '2025-03-20T11:00:00Z' },
  { _id: '3', title: 'AI Research Assistant Launch', slug: 'ai-research-assistant-launch', excerpt: 'Our new AI tool helps researchers navigate journals.', coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80', category: 'Product', isPublished: false, isFeatured: false, publishedAt: null, viewCount: 0, createdAt: '2025-03-15T15:00:00Z' },
]

export const mockEvents = [
  { _id: '1', title: 'International Conference on AI in Healthcare', slug: 'ai-healthcare-conference-2025', description: 'Three-day conference on AI-driven healthcare solutions.', coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80', eventDate: '2025-03-15', endDate: '2025-03-17', location: 'Singapore', locationType: 'in-person', eventType: 'conference', isPublished: true, isFeatured: true, createdAt: '2025-02-01T08:00:00Z' },
  { _id: '2', title: 'Open Access Publishing Webinar', slug: 'open-access-publishing-webinar', description: 'Best practices in open access academic publishing.', coverImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&q=80', eventDate: '2025-02-20', location: 'Online', locationType: 'virtual', eventType: 'webinar', isPublished: true, isFeatured: true, createdAt: '2025-01-15T10:00:00Z' },
]

export const mockSubscribers = [
  { _id: '1', email: 'john@example.com', name: 'John Doe', isVerified: true, status: 'active', subscribedAt: '2025-01-15T08:00:00Z' },
  { _id: '2', email: 'jane@university.edu', name: 'Jane Smith', isVerified: true, status: 'active', subscribedAt: '2025-02-20T10:30:00Z' },
  { _id: '3', email: 'researcher@lab.org', name: 'Alex Johnson', isVerified: false, status: 'active', subscribedAt: '2025-03-10T14:00:00Z' },
  { _id: '4', email: 'old@email.com', name: null, isVerified: true, status: 'unsubscribed', subscribedAt: '2024-11-05T09:00:00Z' },
  { _id: '5', email: 'bounced@invalid.com', name: null, isVerified: false, status: 'bounced', subscribedAt: '2025-01-01T12:00:00Z' },
]