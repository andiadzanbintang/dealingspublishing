// src/data/mockData.js

export const mockSettings = {
  heroTitle: 'Advancing Research,\nTransforming Knowledge',
  heroSubtitle:
    'We publish cutting-edge research across multiple disciplines, connecting scholars worldwide and driving innovation forward.',
  heroImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
  aboutUsShort:
    'Founded in 2023, Dealings Publishing has been at the forefront of academic publishing, dedicated to disseminating high-quality research that addresses the most pressing challenges of our time.',
  mission:
    'To accelerate the pace of scientific discovery by providing an open, rigorous, and accessible platform for researchers worldwide.',
  vision:
    'A world where knowledge flows freely, empowering every researcher to make a meaningful impact.',
  contactEmail: 'info@dealingspublishing.com',
  contactPhone: '+62 812-3310-8282',
  address: 'Bandung, Indonesia',
  socialLinks: {
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
    researchGate: 'https://researchgate.net',
  },
}

export const mockTopics = [
  {
    _id: '1',
    name: 'Health Sciences',
    slug: 'health-sciences',
    description: 'Research in medical and health-related fields',
    icon: '🏥',
    color: '#10B981',
    journalCount: 24,
  },
  {
    _id: '2',
    name: 'Finance & Economics',
    slug: 'finance-economics',
    description: 'Economic research and financial studies',
    icon: '📊',
    color: '#F59E0B',
    journalCount: 18,
  }, 
  {
    _id: '3',
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description: 'Machine learning, deep learning, and AI applications',
    icon: '🤖',
    color: '#6366F1',
    journalCount: 31,
  },
  {
    _id: '4',
    name: 'Environmental Science',
    slug: 'environmental-science',
    description: 'Climate, ecology, and sustainability research',
    icon: '🌍',
    color: '#059669',
    journalCount: 15,
  },
  {
    _id: '5',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Civil, mechanical, electrical, and software engineering',
    icon: '⚙️',
    color: '#EF4444',
    journalCount: 22,
  },
  {
    _id: '6',
    name: 'Social Sciences',
    slug: 'social-sciences',
    description: 'Sociology, psychology, and political science',
    icon: '🧠',
    color: '#8B5CF6',
    journalCount: 12,
  },
]

export const mockJournals = [
  {
    _id: '1',
    title: 'Machine Learning Approaches in Early Disease Detection',
    slug: 'machine-learning-early-disease-detection',
    issn: '2589-0042',
    topic: { _id: '1', name: 'Health Sciences', color: '#10B981' },
    authors: ['Dr. Sarah Chen', 'Dr. James Wilson'],
    abstract:
      'This study explores the application of machine learning algorithms in the early detection of chronic diseases, demonstrating a 94% accuracy rate in predicting onset markers.',
    content:
      '<p>Full content of the journal goes here with rich text formatting...</p>',
    coverImage:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    publicationDate: '2025-01-15',
    volume: '12',
    issue: '3',
    pages: '145-162',
    doi: '10.1234/rh.2025.001',
    keywords: ['machine learning', 'disease detection', 'healthcare', 'AI'],
    isFeatured: true,
    viewCount: 1240,
  },
  {
    _id: '2',
    title: 'Sustainable Finance Models for Emerging Markets',
    slug: 'sustainable-finance-emerging-markets',
    issn: '2589-0043',
    topic: { _id: '2', name: 'Finance & Economics', color: '#F59E0B' },
    authors: ['Prof. Michael Torres', 'Dr. Aisha Rahman'],
    abstract:
      'An analysis of sustainable finance frameworks and their applicability to emerging market economies, with case studies from Southeast Asia and Sub-Saharan Africa.',
    coverImage:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    publicationDate: '2025-02-20',
    volume: '8',
    issue: '1',
    pages: '23-41',
    doi: '10.1234/rh.2025.002',
    keywords: ['sustainable finance', 'emerging markets', 'ESG'],
    isFeatured: true,
    viewCount: 890,
  },
  {
    _id: '3',
    title: 'Transformer Architectures for Scientific Text Analysis',
    slug: 'transformer-architectures-scientific-text',
    issn: '2589-0044',
    topic: { _id: '3', name: 'Artificial Intelligence', color: '#6366F1' },
    authors: ['Dr. Emily Park', 'Dr. Robert Liu'],
    abstract:
      'We present a novel transformer-based architecture optimized for scientific literature analysis, achieving state-of-the-art results in citation prediction and topic classification.',
    coverImage:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    publicationDate: '2025-03-10',
    volume: '15',
    issue: '2',
    pages: '78-95',
    doi: '10.1234/rh.2025.003',
    keywords: ['transformers', 'NLP', 'scientific text', 'deep learning'],
    isFeatured: true,
    viewCount: 2100,
  },
  {
    _id: '4',
    title: 'Ocean Acidification Impact on Coral Reef Ecosystems',
    slug: 'ocean-acidification-coral-reefs',
    issn: '2589-0045',
    topic: { _id: '4', name: 'Environmental Science', color: '#059669' },
    authors: ['Dr. Maria Santos', 'Prof. David Kim'],
    abstract:
      'A comprehensive study on the cascading effects of ocean acidification on coral reef biodiversity, with predictive models for ecosystem resilience under various climate scenarios.',
    coverImage:
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
    publicationDate: '2025-01-28',
    volume: '6',
    issue: '4',
    pages: '201-220',
    doi: '10.1234/rh.2025.004',
    keywords: ['ocean acidification', 'coral reefs', 'climate change', 'biodiversity'],
    isFeatured: true,
    viewCount: 670,
  },
  {
    _id: '5',
    title: 'Quantum Computing Applications in Cryptography',
    slug: 'quantum-computing-cryptography',
    issn: '2589-0046',
    topic: { _id: '5', name: 'Engineering', color: '#EF4444' },
    authors: ['Dr. Alan Foster', 'Dr. Nina Petrov'],
    abstract:
      'This paper examines post-quantum cryptographic algorithms and their readiness for deployment in critical infrastructure systems.',
    coverImage:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
    publicationDate: '2025-04-05',
    volume: '10',
    issue: '1',
    pages: '33-50',
    doi: '10.1234/rh.2025.005',
    keywords: ['quantum computing', 'cryptography', 'post-quantum', 'security'],
    isFeatured: true,
    viewCount: 1550,
  },
]

export const mockNews = [
  {
    _id: '1',
    title: 'ResearchHub Partners with MIT for Open Access Initiative',
    slug: 'researchhub-mit-open-access',
    excerpt:
      'A groundbreaking partnership to make 500+ research papers freely accessible to the global academic community.',
    coverImage:
      'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&q=80',
    category: 'Partnership',
    publishedAt: '2025-04-10',
    isFeatured: true,
    viewCount: 3200,
  },
  {
    _id: '2',
    title: '2025 Annual Research Excellence Awards — Winners Announced',
    slug: '2025-research-excellence-awards',
    excerpt:
      'Celebrating outstanding contributions to science and research across six disciplines.',
    coverImage:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    category: 'Awards',
    publishedAt: '2025-03-25',
    isFeatured: true,
    viewCount: 2800,
  },
  {
    _id: '3',
    title: 'New AI-Powered Research Assistant Now Available',
    slug: 'ai-research-assistant-launch',
    excerpt:
      'Our new AI tool helps researchers navigate and understand published journals with unprecedented ease.',
    coverImage:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
    category: 'Product',
    publishedAt: '2025-03-15',
    isFeatured: true,
    viewCount: 4100,
  },
  {
    _id: '4',
    title: 'Global Research Trends Report — Q1 2025',
    slug: 'global-research-trends-q1-2025',
    excerpt:
      'Key insights from our quarterly analysis of research publication trends worldwide.',
    coverImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    category: 'Report',
    publishedAt: '2025-04-01',
    isFeatured: false,
    viewCount: 1900,
  },
]

export const mockEvents = [
  {
    _id: '1',
    title: 'International Conference on AI in Healthcare 2025',
    slug: 'ai-healthcare-conference-2025',
    description:
      'A three-day conference bringing together leading researchers in AI-driven healthcare solutions.',
    coverImage:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    eventDate: '2025-03-15',
    endDate: '2025-03-17',
    location: 'Singapore',
    locationType: 'in-person',
    eventType: 'conference',
    isFeatured: true,
  },
  {
    _id: '2',
    title: 'Webinar: Open Access Publishing Best Practices',
    slug: 'open-access-publishing-webinar',
    description:
      'Learn about the latest trends and best practices in open access academic publishing.',
    coverImage:
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80',
    eventDate: '2025-02-20',
    location: 'Online',
    locationType: 'virtual',
    eventType: 'webinar',
    isFeatured: true,
  },
  {
    _id: '3',
    title: 'Research Methodology Workshop — Jakarta',
    slug: 'research-methodology-workshop-jakarta',
    description:
      'Hands-on workshop covering advanced quantitative and qualitative research methods.',
    coverImage:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
    eventDate: '2025-01-10',
    location: 'Jakarta, Indonesia',
    locationType: 'in-person',
    eventType: 'workshop',
    isFeatured: true,
  },
]