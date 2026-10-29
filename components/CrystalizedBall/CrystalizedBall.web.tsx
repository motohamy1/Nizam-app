import React, { useState, useEffect } from 'react';
import CrystalizedBallWebComponent from './CrystalizedBall';
import CrystalizedBallNative from './CrystalizedBall.native';
import { BALL_PRESETS } from './presets';
import type { CrystalizedBallProps } from './presets';

export const CrystalizedBallWeb: React.FC<CrystalizedBallProps> = ({
  size = 54,
  timerLabel,
  isRunning = true,
  onPress,
  style,
  preset = 'ember',
  color,
  ...rest
}) => {
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebGlAvailable(false);
      }
    } catch {
      setWebGlAvailable(false);
    }
  }, []);

  return (
    <div
      onClick={onPress}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: size / 2,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden',
        ...style,
      }}
    >
      {webGlAvailable ? (
        <CrystalizedBallWebComponent
          preset={preset}
          color={color}
          size={0.82}
          paused={!isRunning}
          intro={false}
          {...rest}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <CrystalizedBallNative
          size={size}
          preset={preset}
          color={color}
          isRunning={isRunning}
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Foreground Time & Play/Pause (CLEAN: NO EXTRA BACKGROUND) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
          backgroundColor: 'transparent', // STRICTLY NO EXTRA BACKGROUND
        }}
      >
        {Boolean(timerLabel) && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 900,
              color: '#0B0F19',
              letterSpacing: -0.4,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.85)',
              marginBottom: 1,
            }}
          >
            {timerLabel}
          </span>
        )}
        <span
          style={{
            fontSize: Boolean(timerLabel) ? 8.5 : 12,
            color: '#0B0F19',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.85)',
          }}
        >
          {isRunning ? '❚❚' : '▶'}
        </span>
      </div>
    </div>
  );
};

export default CrystalizedBallWeb;
