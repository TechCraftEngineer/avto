"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface DataStreamDelta {
  type: string;
  data: unknown;
}

interface DataStreamContextValue {
  dataStream: DataStreamDelta[];
  setDataStream: React.Dispatch<React.SetStateAction<DataStreamDelta[]>>;
  addDelta: (delta: DataStreamDelta) => void;
  clearStream: () => void;
}

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({ children }: { children: ReactNode }) {
  const [dataStream, setDataStream] = useState<DataStreamDelta[]>([]);

  const addDelta = useCallback((delta: DataStreamDelta) => {
    setDataStream((prev) => [...prev, delta]);
  }, []);

  const clearStream = useCallback(() => {
    setDataStream([]);
  }, []);

  const value = useMemo(
    () => ({
      dataStream,
      setDataStream,
      addDelta,
      clearStream,
    }),
    [dataStream, addDelta, clearStream],
  );

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within DataStreamProvider");
  }
  return context;
}
