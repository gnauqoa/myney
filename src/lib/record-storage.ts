// Local storage utilities for recordings
import type { Recording } from "@/types/recording";
import { STORAGE_RECORDINGS_KEY } from "./constants";

// Get all recordings from local storage

export const updateRecording = (
  id: string,
  updates: Partial<Recording>
): void => {
  try {
    const recordings = getRecordings();
    const recording = recordings.find((r) => r.id === id);
    if (recording) {
      const updatedRecording = { ...recording, ...updates };
      saveRecordingsToStorage(
        recordings.map((r) => (r.id === id ? updatedRecording : r))
      );
    }
  } catch (error) {
    console.error("Error updating recording:", error);
  }
};

export const getRecordings = (): Recording[] => {
  try {
    const data = localStorage.getItem(STORAGE_RECORDINGS_KEY);
    if (!data) return [];
    const recordings = JSON.parse(data);

    // Remove duplicates by ID (keep the first occurrence)
    const seenIds = new Set<string>();
    const uniqueRecordings = recordings.filter((recording: Recording) => {
      if (seenIds.has(recording.id)) {
        console.warn(
          `Duplicate recording ID found: ${recording.id}, removing duplicate`
        );
        return false;
      }
      seenIds.add(recording.id);
      return true;
    });

    // If we found duplicates, save the cleaned version
    if (uniqueRecordings.length !== recordings.length) {
      saveRecordingsToStorage(uniqueRecordings);
    }

    return uniqueRecordings;
  } catch (error) {
    console.error("Error loading recordings:", error);
    return [];
  }
};

// Save recordings array to storage (used by Redux)
export const saveRecordingsToStorage = (recordings: Recording[]): void => {
  try {
    localStorage.setItem(STORAGE_RECORDINGS_KEY, JSON.stringify(recordings));
  } catch (error) {
    console.error("Error saving recordings:", error);
  }
};

// Save a new recording
export const saveRecording = (recording: Recording): void => {
  try {
    const recordings = getRecordings();
    recordings.unshift(recording);
    saveRecordingsToStorage(recordings);
  } catch (error) {
    console.error("Error saving recording:", error);
  }
};

// Delete a recording by ID
export const deleteRecording = (id: string): void => {
  try {
    const recordings = getRecordings();
    const filtered = recordings.filter((r) => r.id !== id);
    saveRecordingsToStorage(filtered);
  } catch (error) {
    console.error("Error deleting recording:", error);
  }
};
