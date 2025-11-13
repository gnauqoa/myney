import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/redux";
import { TranscribeProvider } from "@/context/transcribe";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import App from "@/app";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <TranscribeProvider>
        <ThemeProvider>
          <Toaster />
          <App />
        </ThemeProvider>
      </TranscribeProvider>
    </Provider>
  </React.StrictMode>
);
