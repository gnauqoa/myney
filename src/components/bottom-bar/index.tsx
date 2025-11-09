import { IonLabel } from "@ionic/react";
import { IonIcon, IonTabBar, IonTabButton } from "@ionic/react";
import { home, statsChart } from "ionicons/icons";

const BottomBar = () => {
  return (
    <IonTabBar slot="bottom" className="app-bar-bottom">
      <IonTabButton tab="home" href="/home" className="tab-btn">
        <IonIcon icon={home} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>

      <IonTabButton tab="statistics" href="/statistics" className="tab-btn">
        <IonIcon icon={statsChart} />
        <IonLabel>Stats</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default BottomBar;
