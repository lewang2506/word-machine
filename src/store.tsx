import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  seedClasses,
  seedHomework,
  seedLibraries,
  type Homework,
  type SchoolClass,
  type WordEntry,
  type WordLibrary,
} from './data';

const STORAGE_KEY = 'wordmachine-demo-v7';

interface Persisted {
  libraries: WordLibrary[];
  homework: Homework[];
}

interface StoreValue extends Persisted {
  classes: SchoolClass[];
  /** 教师端内部导航：assign | homework | libraries */
  teacherView: string;
  setTeacherView: (v: string) => void;
  /** 作业详情当前选中作业 */
  activeHomeworkId: string | null;
  openHomework: (id: string | null) => void;
  importEntries: (libraryId: string, entries: WordEntry[], addedCount: number) => void;
  updateEntry: (libraryId: string, entry: WordEntry) => void;
  deleteEntry: (libraryId: string, entryId: string) => void;
  addLibrary: (lib: WordLibrary) => void;
  updateLibrary: (id: string, patch: Partial<WordLibrary>) => void;
  deleteLibrary: (id: string) => void;
  addHomework: (hw: Homework) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      if (Array.isArray(parsed.libraries) && Array.isArray(parsed.homework)) {
        return parsed;
      }
    }
  } catch {
    // 损坏则回退到种子数据
  }
  return {libraries: seedLibraries(), homework: seedHomework(seedClasses())};
}

export function StoreProvider({children}: {children: ReactNode}) {
  const [persisted, setPersisted] = useState<Persisted>(loadPersisted);
  const [teacherView, setTeacherView] = useState('assign');
  const [activeHomeworkId, setActiveHomeworkId] = useState<string | null>(null);
  const classes = useMemo(() => seedClasses(), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [persisted]);

  const importEntries = useCallback(
    (libraryId: string, entries: WordEntry[], addedCount: number) => {
      setPersisted((p) => ({
        ...p,
        libraries: p.libraries.map((lib) =>
          lib.id === libraryId
            ? {
                ...lib,
                entries: [...entries.reverse(), ...lib.entries],
                wordCount: lib.wordCount + addedCount,
                lastImportAt: new Date().toLocaleString('zh-CN', {hour12: false}),
              }
            : lib,
        ),
      }));
    },
    [],
  );

  const updateEntry = useCallback((libraryId: string, entry: WordEntry) => {
    setPersisted((p) => ({
      ...p,
      libraries: p.libraries.map((lib) =>
        lib.id === libraryId
          ? {...lib, entries: lib.entries.map((e) => (e.id === entry.id ? entry : e))}
          : lib,
      ),
    }));
  }, []);

  const deleteEntry = useCallback((libraryId: string, entryId: string) => {
    setPersisted((p) => ({
      ...p,
      libraries: p.libraries.map((lib) =>
        lib.id === libraryId
          ? {
              ...lib,
              entries: lib.entries.filter((e) => e.id !== entryId),
              wordCount: Math.max(0, lib.wordCount - 1),
            }
          : lib,
      ),
    }));
  }, []);

  const addHomework = useCallback((hw: Homework) => {
    setPersisted((p) => ({...p, homework: [hw, ...p.homework]}));
  }, []);

  const addLibrary = useCallback((lib: WordLibrary) => {
    setPersisted((p) => ({...p, libraries: [lib, ...p.libraries]}));
  }, []);

  const updateLibrary = useCallback((id: string, patch: Partial<WordLibrary>) => {
    setPersisted((p) => ({
      ...p,
      libraries: p.libraries.map((l) => (l.id === id ? {...l, ...patch} : l)),
    }));
  }, []);

  const deleteLibrary = useCallback((id: string) => {
    setPersisted((p) => ({...p, libraries: p.libraries.filter((l) => l.id !== id)}));
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPersisted({libraries: seedLibraries(), homework: seedHomework(seedClasses())});
    setTeacherView('assign');
    setActiveHomeworkId(null);
  }, []);

  const value: StoreValue = {
    ...persisted,
    classes,
    teacherView,
    setTeacherView,
    activeHomeworkId,
    openHomework: setActiveHomeworkId,
    importEntries,
    updateEntry,
    deleteEntry,
    addLibrary,
    updateLibrary,
    deleteLibrary,
    addHomework,
    resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
