import { Composition } from "remotion";
import { PlatformOverview } from "./compositions/PlatformOverview";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PlatformOverview"
        component={PlatformOverview}
        durationInFrames={1350} // 45 секунд при 30 FPS
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
