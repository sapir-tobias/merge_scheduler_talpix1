export type Priority = 'high' | 'medium' | 'low'
export type Status = 'todo' | 'in-progress' | 'review' | 'done'

export interface Member {
  id: string
  name: string
  initials: string
  color: string
  role: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  assignee: Member
  dueDate: string
  tags: string[]
  subtasks: { total: number; completed: number }
  comments: number
  attachments: number
}

export interface Project {
  id: string
  name: string
  emoji: string
  description: string
  color: string
  progress: number
  dueDate: string
  category: string
  members: Member[]
  tasks: Task[]
}

export const teamMembers: Member[] = [
  { id: 'm1', name: 'Alex Johnson', initials: 'AJ', color: '#8b5cf6', role: 'Product Manager' },
  { id: 'm2', name: 'Sarah Chen',   initials: 'SC', color: '#ec4899', role: 'UI Designer' },
  { id: 'm3', name: 'Mike Torres',  initials: 'MT', color: '#3b82f6', role: 'Frontend Dev' },
  { id: 'm4', name: 'Emma Wilson',  initials: 'EW', color: '#10b981', role: 'Backend Dev' },
  { id: 'm5', name: 'Jordan Lee',   initials: 'JL', color: '#f59e0b', role: 'Marketing Lead' },
]

const [aj, sc, mt, ew, jl] = teamMembers

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    emoji: '🌐',
    description: 'Complete overhaul of the company website with new branding and UX',
    color: '#6366f1',
    progress: 62,
    dueDate: 'Jun 30, 2026',
    category: 'Design',
    members: [aj, sc, mt],
    tasks: [
      { id: 't1-1', title: 'Design homepage hero section', description: 'Create wireframes and hi-fi mockups for the new hero with animated elements', priority: 'high', status: 'todo', assignee: sc, dueDate: 'May 28', tags: ['Design', 'UI'], subtasks: { total: 3, completed: 0 }, comments: 4, attachments: 2 },
      { id: 't1-2', title: 'Write About page copy', description: 'Draft compelling brand story, mission statement, and team bios', priority: 'medium', status: 'todo', assignee: aj, dueDate: 'Jun 5', tags: ['Content'], subtasks: { total: 2, completed: 0 }, comments: 1, attachments: 0 },
      { id: 't1-3', title: 'Set up analytics & tracking', description: 'Integrate GA4 and Segment with custom event taxonomy', priority: 'low', status: 'todo', assignee: mt, dueDate: 'Jun 12', tags: ['Dev', 'Analytics'], subtasks: { total: 4, completed: 0 }, comments: 2, attachments: 1 },
      { id: 't1-4', title: 'Accessibility audit (WCAG 2.1)', description: 'Run compliance checks on all pages and fix violations', priority: 'high', status: 'todo', assignee: sc, dueDate: 'Jun 15', tags: ['QA', 'A11y'], subtasks: { total: 6, completed: 0 }, comments: 3, attachments: 0 },
      { id: 't1-5', title: 'Build responsive navigation', description: 'Mega menu with animated dropdowns and mobile drawer', priority: 'high', status: 'in-progress', assignee: mt, dueDate: 'May 26', tags: ['Dev', 'UI'], subtasks: { total: 5, completed: 3 }, comments: 7, attachments: 3 },
      { id: 't1-6', title: 'Implement theme system', description: 'CSS custom properties for light/dark mode and brand theming', priority: 'medium', status: 'in-progress', assignee: mt, dueDate: 'May 30', tags: ['Dev', 'Styling'], subtasks: { total: 4, completed: 2 }, comments: 5, attachments: 1 },
      { id: 't1-7', title: 'Product showcase carousel', description: 'Interactive gallery with keyboard navigation and auto-play', priority: 'medium', status: 'in-progress', assignee: sc, dueDate: 'Jun 2', tags: ['UI', 'Design'], subtasks: { total: 3, completed: 1 }, comments: 3, attachments: 5 },
      { id: 't1-8', title: 'Landing page full layout', description: 'All sections positioned and responsive across breakpoints', priority: 'high', status: 'review', assignee: sc, dueDate: 'May 24', tags: ['Design', 'UI'], subtasks: { total: 6, completed: 6 }, comments: 12, attachments: 4 },
      { id: 't1-9', title: 'Contact form validation', description: 'Client and server-side validation with accessible error states', priority: 'medium', status: 'review', assignee: ew, dueDate: 'May 25', tags: ['Dev', 'Forms'], subtasks: { total: 4, completed: 4 }, comments: 6, attachments: 0 },
      { id: 't1-10', title: 'Brand color system & tokens', description: 'Complete design token system for colors, spacing, and typography', priority: 'high', status: 'done', assignee: sc, dueDate: 'May 10', tags: ['Design'], subtasks: { total: 4, completed: 4 }, comments: 8, attachments: 6 },
      { id: 't1-11', title: 'Logo refresh & asset export', description: 'Light, dark, and mono logo variants in SVG and PNG at 3x', priority: 'high', status: 'done', assignee: sc, dueDate: 'May 8', tags: ['Design', 'Branding'], subtasks: { total: 3, completed: 3 }, comments: 4, attachments: 8 },
      { id: 't1-12', title: 'Kickoff & project scoping', description: 'Define scope, milestones, and success metrics', priority: 'medium', status: 'done', assignee: aj, dueDate: 'May 1', tags: ['Planning'], subtasks: { total: 5, completed: 5 }, comments: 10, attachments: 2 },
      { id: 't1-13', title: 'Competitor UX analysis', description: 'Heuristic review of 12 competitor sites with findings doc', priority: 'low', status: 'done', assignee: aj, dueDate: 'May 5', tags: ['Research'], subtasks: { total: 2, completed: 2 }, comments: 3, attachments: 1 },
    ],
  },
  {
    id: 'p2',
    name: 'Mobile App v2.0',
    emoji: '📱',
    description: 'Feature-rich iOS & Android app with redesigned UX and offline support',
    color: '#3b82f6',
    progress: 38,
    dueDate: 'Jul 15, 2026',
    category: 'Engineering',
    members: [aj, mt, ew],
    tasks: [
      { id: 't2-1', title: 'Offline data sync engine', description: 'Conflict-free replicated data types for offline-first sync', priority: 'high', status: 'todo', assignee: ew, dueDate: 'Jun 20', tags: ['Dev', 'Infra'], subtasks: { total: 8, completed: 0 }, comments: 6, attachments: 2 },
      { id: 't2-2', title: 'Push notification system', description: 'FCM + APNs integration with preference management', priority: 'high', status: 'todo', assignee: ew, dueDate: 'Jun 25', tags: ['Dev'], subtasks: { total: 5, completed: 0 }, comments: 3, attachments: 0 },
      { id: 't2-3', title: 'App store screenshots', description: 'Design 10 marketing screenshots per platform with localization', priority: 'medium', status: 'todo', assignee: sc, dueDate: 'Jul 1', tags: ['Design', 'Marketing'], subtasks: { total: 3, completed: 0 }, comments: 2, attachments: 4 },
      { id: 't2-4', title: 'Biometric authentication', description: 'Face ID and fingerprint login with fallback PIN flow', priority: 'medium', status: 'in-progress', assignee: ew, dueDate: 'Jun 10', tags: ['Dev', 'Security'], subtasks: { total: 4, completed: 2 }, comments: 9, attachments: 1 },
      { id: 't2-5', title: 'Onboarding flow redesign', description: '5-screen onboarding with interactive tutorial and progress tracking', priority: 'high', status: 'in-progress', assignee: sc, dueDate: 'Jun 8', tags: ['Design', 'UX'], subtasks: { total: 6, completed: 3 }, comments: 11, attachments: 7 },
      { id: 't2-6', title: 'Performance profiling', description: 'Identify render bottlenecks, target < 16ms frame time', priority: 'medium', status: 'review', assignee: mt, dueDate: 'May 27', tags: ['Dev', 'Perf'], subtasks: { total: 5, completed: 5 }, comments: 8, attachments: 2 },
      { id: 't2-7', title: 'API client refactor', description: 'Migrate to React Query v5 with optimistic updates', priority: 'high', status: 'review', assignee: mt, dueDate: 'May 28', tags: ['Dev', 'Refactor'], subtasks: { total: 7, completed: 7 }, comments: 14, attachments: 0 },
      { id: 't2-8', title: 'Tech stack selection', description: 'Evaluated React Native 0.74 vs. Expo SDK 51', priority: 'low', status: 'done', assignee: aj, dueDate: 'Apr 15', tags: ['Planning'], subtasks: { total: 2, completed: 2 }, comments: 5, attachments: 3 },
      { id: 't2-9', title: 'v1 deprecation plan', description: 'Sunset strategy with migration guide and notification timeline', priority: 'medium', status: 'done', assignee: aj, dueDate: 'Apr 20', tags: ['Planning'], subtasks: { total: 3, completed: 3 }, comments: 4, attachments: 1 },
    ],
  },
  {
    id: 'p3',
    name: 'Q3 Campaign',
    emoji: '🚀',
    description: 'Multi-channel Q3 growth campaign targeting enterprise segment',
    color: '#ec4899',
    progress: 15,
    dueDate: 'Sep 1, 2026',
    category: 'Marketing',
    members: [aj, jl, sc],
    tasks: [
      { id: 't3-1', title: 'Campaign strategy & OKRs', description: 'Define quarterly goals, target segments, and success metrics', priority: 'high', status: 'todo', assignee: jl, dueDate: 'Jun 1', tags: ['Strategy'], subtasks: { total: 4, completed: 0 }, comments: 2, attachments: 1 },
      { id: 't3-2', title: 'Enterprise landing page', description: 'Dedicated landing page for enterprise with case studies', priority: 'high', status: 'todo', assignee: sc, dueDate: 'Jun 20', tags: ['Design', 'Dev'], subtasks: { total: 6, completed: 0 }, comments: 5, attachments: 3 },
      { id: 't3-3', title: 'LinkedIn ad creative set', description: '12 ad variations for A/B testing across job seniority segments', priority: 'medium', status: 'todo', assignee: sc, dueDate: 'Jul 5', tags: ['Design', 'Ads'], subtasks: { total: 3, completed: 0 }, comments: 1, attachments: 0 },
      { id: 't3-4', title: 'Email nurture sequence', description: '8-email drip campaign for trial-to-paid conversion', priority: 'medium', status: 'todo', assignee: jl, dueDate: 'Jul 10', tags: ['Email', 'Content'], subtasks: { total: 5, completed: 0 }, comments: 3, attachments: 2 },
      { id: 't3-5', title: 'Webinar series planning', description: 'Plan 3 enterprise webinars with speakers and promotion schedule', priority: 'low', status: 'in-progress', assignee: jl, dueDate: 'Jun 30', tags: ['Events'], subtasks: { total: 4, completed: 1 }, comments: 6, attachments: 1 },
      { id: 't3-6', title: 'Budget allocation plan', description: 'Distribute $180K budget across paid, events, and content channels', priority: 'high', status: 'review', assignee: aj, dueDate: 'May 30', tags: ['Finance'], subtasks: { total: 3, completed: 3 }, comments: 9, attachments: 2 },
      { id: 't3-7', title: 'ICP research & segmentation', description: 'Interview 20 enterprise customers to refine ideal customer profile', priority: 'high', status: 'done', assignee: jl, dueDate: 'May 15', tags: ['Research'], subtasks: { total: 5, completed: 5 }, comments: 7, attachments: 4 },
    ],
  },
  {
    id: 'p4',
    name: 'API Migration',
    emoji: '⚙️',
    description: 'Migrate monolith to microservices with zero-downtime deployment',
    color: '#10b981',
    progress: 80,
    dueDate: 'May 31, 2026',
    category: 'Engineering',
    members: [aj, ew, mt],
    tasks: [
      { id: 't4-1', title: 'Decommission legacy auth service', description: 'Migrate all clients to OAuth 2.0 and shut down old JWT issuer', priority: 'high', status: 'todo', assignee: ew, dueDate: 'May 28', tags: ['Dev', 'Security'], subtasks: { total: 4, completed: 0 }, comments: 5, attachments: 1 },
      { id: 't4-2', title: 'Rate limiting & throttling', description: 'Per-tenant rate limits with Redis sliding window algorithm', priority: 'medium', status: 'in-progress', assignee: ew, dueDate: 'May 25', tags: ['Dev', 'Infra'], subtasks: { total: 3, completed: 2 }, comments: 4, attachments: 0 },
      { id: 't4-3', title: 'API gateway config', description: 'Kong gateway rules, CORS, and auth middleware for all routes', priority: 'high', status: 'review', assignee: ew, dueDate: 'May 24', tags: ['Infra', 'Dev'], subtasks: { total: 5, completed: 5 }, comments: 10, attachments: 3 },
      { id: 't4-4', title: 'Load testing suite', description: 'k6 scripts targeting 10K RPS with < 200ms p95 latency', priority: 'high', status: 'review', assignee: mt, dueDate: 'May 22', tags: ['QA', 'Perf'], subtasks: { total: 4, completed: 4 }, comments: 8, attachments: 2 },
      { id: 't4-5', title: 'User service extraction', description: 'Extracted user domain from monolith with event-driven sync', priority: 'high', status: 'done', assignee: ew, dueDate: 'May 10', tags: ['Dev', 'Architecture'], subtasks: { total: 7, completed: 7 }, comments: 15, attachments: 5 },
      { id: 't4-6', title: 'Billing service extraction', description: 'Stripe integration moved to dedicated billing microservice', priority: 'high', status: 'done', assignee: ew, dueDate: 'May 12', tags: ['Dev', 'Billing'], subtasks: { total: 6, completed: 6 }, comments: 12, attachments: 3 },
      { id: 't4-7', title: 'Event bus (Kafka) setup', description: 'Kafka cluster on AWS MSK with schema registry', priority: 'medium', status: 'done', assignee: ew, dueDate: 'Apr 28', tags: ['Infra'], subtasks: { total: 5, completed: 5 }, comments: 9, attachments: 2 },
      { id: 't4-8', title: 'OpenAPI docs generation', description: 'Auto-generated docs from code with versioning and changelogs', priority: 'low', status: 'done', assignee: mt, dueDate: 'May 5', tags: ['Docs', 'Dev'], subtasks: { total: 3, completed: 3 }, comments: 4, attachments: 1 },
      { id: 't4-9', title: 'Architecture decision records', description: 'Documented all major architectural decisions for the migration', priority: 'low', status: 'done', assignee: aj, dueDate: 'Apr 15', tags: ['Docs'], subtasks: { total: 2, completed: 2 }, comments: 6, attachments: 3 },
      { id: 't4-10', title: 'CI/CD pipeline update', description: 'Multi-stage Docker builds with parallel test execution', priority: 'medium', status: 'done', assignee: mt, dueDate: 'Apr 22', tags: ['DevOps'], subtasks: { total: 4, completed: 4 }, comments: 7, attachments: 0 },
    ],
  },
]
