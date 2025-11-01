import { useState, useCallback, useEffect } from 'react';
import { JournalEntry } from '../types';
import { MOCK_ENTRIES } from '../data/mockEntries';
import { useAuth } from './useAuth';

export const useJournal = () => {
  const { user } = useAuth();
  const STORAGE_KEY = user ? `sonder_journal_entries_${user.email}` : null;
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!STORAGE_KEY) {
      setEntries([]); // Clear entries on logout
      return;
    };
    try {
      const storedEntries = localStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        // If no entries are found for this user, populate with mock data
        setEntries(MOCK_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ENTRIES));
      }
    } catch (error) {
      console.error("Failed to load entries from localStorage", error);
    }
  }, [STORAGE_KEY]);

  const addEntry = useCallback((newEntry: JournalEntry) => {
    if (!STORAGE_KEY) return;
    setEntries(prevEntries => {
      const updatedEntries = [...prevEntries, newEntry];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      } catch (error) {
        console.error("Failed to save entry to localStorage", error);
      }
      return updatedEntries;
    });
  }, [STORAGE_KEY]);

  return { entries, addEntry };
};
