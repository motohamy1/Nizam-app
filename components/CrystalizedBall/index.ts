import { Platform } from 'react-native';
import { BALL_PRESETS } from './presets';
import type { CrystalizedBallProps, CrystalizedBallPreset } from './presets';
import CrystalizedBallNative from './CrystalizedBall.native';

let CrystalizedBall = CrystalizedBallNative;

if (Platform.OS === 'web') {
  try {
    // Dynamically load web implementation in web environment
    CrystalizedBall = require('./CrystalizedBall.web').default || CrystalizedBallNative;
  } catch {
    CrystalizedBall = CrystalizedBallNative;
  }
}

export { CrystalizedBall, BALL_PRESETS };
export type { CrystalizedBallProps, CrystalizedBallPreset } from './presets';
export default CrystalizedBall;
