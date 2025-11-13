import React, { useEffect } from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Microphone } from "@mozartec/capacitor-microphone";
import RecordBtn from "@/components/bottom-bar/record-button";
import BottomBar from "@/components/bottom-bar";
import HomePage from "@/pages/home";
/* Ionic core CSS */
import "@ionic/react/css/core.css";
// import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/palettes/dark.system.css";

import "./styles/app.css";
import "./styles/override.css";

setupIonicReact();

const checkPermissions = async () => {
  const permission = await Microphone.checkPermissions();
  if (permission.microphone !== "granted") {
    await Microphone.requestPermissions();
  }
};

const App: React.FC = () => {
  useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <IonApp className="bg-background">
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/home">
              <HomePage />
            </Route>
            <Redirect exact from="/" to="/home" />
          </IonRouterOutlet>
          <BottomBar />
        </IonTabs>
        <RecordBtn />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
