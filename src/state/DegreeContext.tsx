import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { DegreeState, PlacedCourse, SemesterId, CatalogueFilters, Faculty, Blocker } from '../types'
import { INITIAL_PLACED } from '../data/courses'

const DEFAULT_FILTERS: CatalogueFilters = {
  minCredits: 1,
  maxCredits: 6,
  maxCollisions: 0,
  minExamSeparationDays: 3,
  ignorePrerequisites: false,
  faculties: new Set(['cs', 'math', 'physics', 'misc'] as Faculty[]),
  searchQuery: '',
}

const INITIAL_STATE: DegreeState = {
  placed: INITIAL_PLACED,
  exemptions: [],
  filters: DEFAULT_FILTERS,
  activeSemester: 1,
  blockers: [],
}

type Action =
  | { type: 'ADD_COURSE'; payload: PlacedCourse }
  | { type: 'REMOVE_COURSE'; courseId: string; semesterId: SemesterId }
  | { type: 'MOVE_COURSE'; courseId: string; fromSem: SemesterId; toSem: SemesterId }
  | { type: 'TOGGLE_LOCK'; courseId: string; semesterId: SemesterId }
  | { type: 'SET_LECTURE_OPTION'; courseId: string; semesterId: SemesterId; optionId: string }
  | { type: 'SET_RECITATION_OPTION'; courseId: string; semesterId: SemesterId; optionId: string }
  | { type: 'SET_FILTERS'; filters: Partial<CatalogueFilters> }
  | { type: 'SET_ACTIVE_SEMESTER'; semesterId: SemesterId }
  | { type: 'ADD_BLOCKER'; payload: Blocker }
  | { type: 'REMOVE_BLOCKER'; id: string }
  | { type: 'UPDATE_BLOCKER'; id: string; updates: Partial<Omit<Blocker, 'id'>> }
  | { type: 'ADD_EXEMPTION'; courseId: string }
  | { type: 'REMOVE_EXEMPTION'; courseId: string }
  | { type: 'LOAD_PLAN'; placed: PlacedCourse[] }

function reducer(state: DegreeState, action: Action): DegreeState {
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
      return {
        ...state,
        placed: state.placed.map(p =>
          p.courseId === action.courseId && p.semesterId === action.semesterId
            ? { ...p, locked: !p.locked }
            : p
        ),
      }

    case 'SET_LECTURE_OPTION':
      return {
        ...state,
        placed: state.placed.map(p =>
          p.courseId === action.courseId && p.semesterId === action.semesterId
            ? { ...p, lectureOptionId: action.optionId }
            : p
        ),
      }

    case 'SET_RECITATION_OPTION':
      return {
        ...state,
        placed: state.placed.map(p =>
          p.courseId === action.courseId && p.semesterId === action.semesterId
            ? { ...p, recitationOptionId: action.optionId }
            : p
        ),
      }

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

interface ContextValue {
  state: DegreeState
  dispatch: React.Dispatch<Action>
}

const DegreeContext = createContext<ContextValue | null>(null)

export function DegreeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  return <DegreeContext.Provider value={{ state, dispatch }}>{children}</DegreeContext.Provider>
}

export function useDegree() {
  const ctx = useContext(DegreeContext)
  if (!ctx) throw new Error('useDegree must be used within DegreeProvider')
  return ctx
}
