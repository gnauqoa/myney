import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getRecordings,
  saveRecording as saveToStorage,
  saveRecordingsToStorage,
} from "@/lib/record-storage";
import type { Recording } from "@/types/recording";
import mapKeys from "lodash/mapKeys";

interface RecordingsState {
  recordings: Recording[];
}

const initialState: RecordingsState = {
  recordings: getRecordings(),
};

// helper để sync transactions

const recordingsSlice = createSlice({
  name: "recordings",
  initialState,
  reducers: {
    addRecording: (state, action: PayloadAction<Recording>) => {
      state.recordings.unshift(action.payload);
      saveToStorage(action.payload);
    },

    removeRecording: (state, action: PayloadAction<string>) => {
      const index = state.recordings.findIndex((r) => r.id === action.payload);
      if (index !== -1) {
        state.recordings[index] = {
          ...state.recordings[index],
          audioDataBase64: undefined,
        };

        saveRecordingsToStorage(state.recordings);
        state.recordings = [
          ...state.recordings.slice(0, index),
          ...state.recordings.slice(index + 1),
        ];
      }
    },

    removeRecordings: (
      state,
      action: PayloadAction<string[] | Record<string, boolean>>
    ) => {
      if (Array.isArray(action.payload)) {
        action.payload = action.payload.reduce((acc, id) => {
          acc[id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }

      const { saveRecords, newRecords } = state.recordings.reduce(
        (acc, r) => {
          if (!Object.prototype.hasOwnProperty.call(action.payload, r.id)) {
            acc.saveRecords.push(r);
            acc.newRecords.push(r);
          } else {
            acc.saveRecords.push({ ...r, audioDataBase64: undefined });
          }
          return acc;
        },
        { saveRecords: [], newRecords: [] } as {
          saveRecords: Recording[];
          newRecords: Recording[];
        }
      );

      saveRecordingsToStorage(saveRecords);
      state.recordings = newRecords;
    },

    updateRecording: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Recording> }>
    ) => {
      const index = state.recordings.findIndex(
        (r) => r.id === action.payload.id
      );
      if (index !== -1) {
        state.recordings[index] = {
          ...state.recordings[index],
          ...action.payload.updates,
        };
        saveRecordingsToStorage(state.recordings);
      }
    },

    updateRecordings: (
      state,
      action: PayloadAction<
        ({
          id: string;
        } & Partial<Omit<Recording, "id">>)[]
      >
    ) => {
      const mappedResultsRecordings = mapKeys(action.payload, "id");

      state.recordings = state.recordings.map((r) =>
        mappedResultsRecordings[r.id]
          ? { ...r, ...mappedResultsRecordings[r.id] }
          : r
      );

      saveRecordingsToStorage(state.recordings);
    },

    loadRecordings: (state) => {
      const all = getRecordings();
      state.recordings = all.filter((t) => t.audioDataBase64);
    },

    clearRecordings: (state) => {
      state.recordings = [];
      saveRecordingsToStorage([]);
    },
  },
});

export const {
  addRecording,
  removeRecording,
  updateRecording,
  updateRecordings,
  loadRecordings,
  clearRecordings,
  removeRecordings,
} = recordingsSlice.actions;

export default recordingsSlice.reducer;
