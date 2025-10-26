
import { useState, useCallback, useEffect } from 'react';
import { JournalEntry } from '../types';
import { MOCK_ENTRIES } from '../data/mockEntries';

const STORAGE_KEY = 'sonder_journal_entries';

export const useJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        // If no entries are found, populate with mock data
        setEntries(MOCK_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ENTRIES));
      }
    } catch (error) {
      console.error("Failed to load entries from localStorage", error);
    }
  }, []);

  const addEntry = useCallback((newEntry: JournalEntry) => {
    setEntries(prevEntries => {
      const updatedEntries = [...prevEntries, newEntry];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      } catch (error) {
        console.error("Failed to save entry to localStorage", error);
      }
      return updatedEntries;
    });
  }, []);

  return { entries, addEntry };
};
