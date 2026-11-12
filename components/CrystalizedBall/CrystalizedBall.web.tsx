import React from 'react';
import CrystalizedBallNative from './CrystalizedBall.native';
import type { CrystalizedBallProps } from './presets';

export const CrystalizedBallWeb: React.FC<CrystalizedBallProps> = (props) => {
  return <CrystalizedBallNative {...props} />;
};

export default CrystalizedBallWeb;
