import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DegreeProvider } from './stores/DegreeContext'
import { CoursesProvider, useCoursesStore } from './stores/CoursesStore'
import { allPages } from './urls'
import { TEST_IDS } from './testIds'

/**
 * Mock current-user roles. Talpix resolves these from the authenticated
 * session; here we grant the cadet role so the Scheduler page (allowed for
 * ['Cadet', ...]) renders. Role gating logic mirrors Talpix's router.
 */
const CURRENT_USER_ROLES = ['Cadet']

function hasAccess(allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  return allowedRoles.some(role => CURRENT_USER_ROLES.includes(role))
}

function AppRoutes() {
  const homePath = allPages[0]?.path ?? '/'
  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />
      {allPages.map(page => {
        const Component = page.component
        const element = hasAccess(page.allowedRoles)
          ? <Component {...page.pageProps} />
          : <Navigate to={homePath} replace />
        return <Route key={page.path} path={page.path} element={element} />
      })}
      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  )
}

function AppShell() {
  const { initialPlaced, isLoading } = useCoursesStore()

  if (isLoading) {
    return (
      <div
        data-testid={TEST_IDS.APP_LOADING}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--color-background)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
        }}
      >
        Loading scheduler…
      </div>
    )
  }

  return (
    <DegreeProvider initialPlaced={initialPlaced}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </DegreeProvider>
  )
}

export default function App() {
  return (
    <CoursesProvider>
      <AppShell />
    </CoursesProvider>
  )
}
