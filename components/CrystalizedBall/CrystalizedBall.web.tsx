import React from 'react';
import CrystalizedBallWebComponent from './CrystalizedBall';
import { BALL_PRESETS } from './presets';
import type { CrystalizedBallProps } from './presets';

export const CrystalizedBallWeb: React.FC<CrystalizedBallProps> = ({
  size = 54,
  timerLabel,
  isRunning = true,
  onPress,
  style,
  ...rest
}) => {
  return (
    <div
      onClick={onPress}
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        ...style,
      }}
    >
      <CrystalizedBallWebComponent
        size={size}
        isRunning={isRunning}
        {...rest}
        style={{ width: '100%', height: '100%' }}
      />
      {timerLabel ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              padding: '2px 7px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 1.5px 3px rgba(0, 0, 0, 0.22)',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 900,
                color: '#050505',
                letterSpacing: -0.4,
              }}
            >
              {timerLabel}
            </span>
            <span style={{ fontSize: 9, color: '#050505', marginTop: 1 }}>
              {isRunning ? '❚❚' : '▶'}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CrystalizedBallWeb;
