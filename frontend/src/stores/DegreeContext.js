import { createContext, useContext, useEffect, useReducer } from 'react'

// Credit bounds span the real dataset (0–20 cr); a narrower default would
// silently hide ~45 of 353 courses (0-credit seminars, 7–20-credit projects).
const DEFAULT_FILTERS = {
  minCredits: 0,
  maxCredits: 20,
  maxCollisions: 0,
  minExamSeparationDays: 3,
  ignorePrerequisites: false,
  faculties: new Set(['cs', 'math', 'physics', 'misc']),
  searchQuery: '',
}

const STORAGE_KEY = 'degree-planner-state'

// Read the user's saved board from localStorage (faculties array -> Set).
// Returns null when nothing is stored or the payload is unreadable.
function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    return {
      placed: s.placed ?? [],
      exemptions: s.exemptions ?? [],
      blockers: s.blockers ?? [],
      activeSemester: s.activeSemester ?? 1,
      filters: {
        ...DEFAULT_FILTERS,
        ...(s.filters ?? {}),
        faculties: new Set(s.filters?.faculties ?? ['cs', 'math', 'physics', 'misc']),
      },
    }
  } catch {
    return null
  }
}

// Persist immediately on every change (faculties Set -> array for JSON).
function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      placed: state.placed,
      exemptions: state.exemptions,
      blockers: state.blockers,
      activeSemester: state.activeSemester,
      filters: { ...state.filters, faculties: [...state.filters.faculties] },
    }))
  } catch {
    // storage unavailable (private mode / quota) — non-fatal
  }
}

function makeInitialState(initialPlaced) {
  // Prefer the user's saved board; fall back to the backend starter placement.
  return loadPersisted() ?? {
    placed: initialPlaced,
    exemptions: [],
    filters: DEFAULT_FILTERS,
    activeSemester: 1,
    blockers: [],
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_COURSE': {
      // Single instance: remove from any existing semester, and remove from exemptions
      const deduplicated = state.placed.filter(p => p.courseId !== action.payload.courseId)
      const exemptions = state.exemptions.filter(id => id !== action.payload.courseId)
      return { ...state, placed: [...deduplicated, action.payload], exemptions }
    }

    case 'REMOVE_COURSE':
      return {
        ...state,
        placed: state.placed.filter(
          p => !(p.courseId === action.courseId && p.semesterId === action.semesterId)
        ),
      }

    case 'MOVE_COURSE': {
      const withoutTarget = state.placed.filter(
        p => !(p.courseId === action.courseId && p.semesterId === action.toSem)
      )
      return {
        ...state,
        placed: withoutTarget.map(p =>
          p.courseId === action.courseId && p.semesterId === action.fromSem
            ? { ...p, semesterId: action.toSem }
            : p
        ),
      }
    }

    case 'TOGGLE_LOCK':
      return { ...state, placed: mapEntry(state.placed, action, p => ({ ...p, locked: !p.locked })) }

    case 'TOGGLE_MANDATORY':
      // User-controlled "must take" flag on a placed course (distinct from the
      // derived mandatoryAttendance metadata). Writable via the timetable UI.
      return { ...state, placed: mapEntry(state.placed, action, p => ({ ...p, mandatory: !p.mandatory })) }

    case 'SET_LECTURE_OPTION':
      return { ...state, placed: mapEntry(state.placed, action, p => ({ ...p, lectureOptionId: action.optionId })) }

    case 'SET_RECITATION_OPTION':
      return { ...state, placed: mapEntry(state.placed, action, p => ({ ...p, recitationOptionId: action.optionId })) }

    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } }

    case 'SET_ACTIVE_SEMESTER':
      return { ...state, activeSemester: action.semesterId }

    case 'ADD_BLOCKER':
      return { ...state, blockers: [...state.blockers, action.payload] }

    case 'REMOVE_BLOCKER':
      return { ...state, blockers: state.blockers.filter(b => b.id !== action.id) }

    case 'UPDATE_BLOCKER':
      return { ...state, blockers: state.blockers.map(b => b.id === action.id ? { ...b, ...action.updates } : b) }

    case 'ADD_EXEMPTION': {
      if (state.exemptions.includes(action.courseId)) return state
      // Remove from placed semesters, add to exemptions
      const placed = state.placed.filter(p => p.courseId !== action.courseId)
      return { ...state, placed, exemptions: [...state.exemptions, action.courseId] }
    }

    case 'REMOVE_EXEMPTION':
      return { ...state, exemptions: state.exemptions.filter(id => id !== action.courseId) }

    case 'LOAD_PLAN':
      return { ...state, placed: action.placed }

    default:
      return state
  }
}

// Apply `fn` to the placed entry matching action.courseId + action.semesterId.
function mapEntry(placed, action, fn) {
  return placed.map(p =>
    p.courseId === action.courseId && p.semesterId === action.semesterId ? fn(p) : p
  )
}

const DegreeContext = createContext(null)

export function DegreeProvider({ children, initialPlaced }) {
  const [state, dispatch] = useReducer(reducer, initialPlaced, makeInitialState)
  useEffect(() => { persist(state) }, [state])
  return <DegreeContext.Provider value={{ state, dispatch }}>{children}</DegreeContext.Provider>
}

export function useDegree() {
  const ctx = useContext(DegreeContext)
  if (!ctx) throw new Error('useDegree must be used within DegreeProvider')
  return ctx
}
