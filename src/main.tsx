import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux";
import App from "./app";
import { TranscribeProvider } from "./context/transcribe";
import { Toaster } from "./components/ui/sonner";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <TranscribeProvider>
        <Toaster />
        <App />
      </TranscribeProvider>
    </Provider>
  </React.StrictMode>
);
