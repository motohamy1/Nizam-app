import React from 'react';
import { Platform } from 'react-native';

export const GLOBAL_FONT_FAMILY = Platform.select({
  ios: 'Archivo Black',
  android: 'ArchivoBlack_400Regular',
  web: 'Archivo Black',
  default: 'Archivo Black',
});

// 1. Client-side web DOM injection for web builds / browsers
if (typeof document !== 'undefined') {
  // Inject Google Fonts preconnect and stylesheet
  const fontLinkId = 'google-font-archivo-black';
  if (!document.getElementById(fontLinkId)) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.id = fontLinkId;
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap';
    document.head.appendChild(fontLink);
  }

  // Inject CSS rules to enforce Archivo Black globally across all elements
  const fontStyleId = 'global-style-archivo-black';
  if (!document.getElementById(fontStyleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = fontStyleId;
    styleEl.textContent = `
      * {
        font-family: 'Archivo Black', sans-serif !important;
      }
      html, body, #root, div, span, p, h1, h2, h3, h4, h5, h6, input, textarea, button, select {
        font-family: 'Archivo Black', sans-serif !important;
      }
      input::placeholder, textarea::placeholder {
        font-family: 'Archivo Black', sans-serif !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

// 2. React Native Web runtime patch
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnw = require('react-native-web');
  if (rnw?.Text && rnw.Text.render && !rnw.Text.__archivoPatched) {
    const origRender = rnw.Text.render;
    rnw.Text.render = function (props: any, ref: any) {
      const mergedProps = {
        ...props,
        style: [{ fontFamily: 'Archivo Black' }, props?.style],
      };
      return origRender.call(this, mergedProps, ref);
    };
    rnw.Text.__archivoPatched = true;
  }
  if (rnw?.TextInput && rnw.TextInput.render && !rnw.TextInput.__archivoPatched) {
    const origRender = rnw.TextInput.render;
    rnw.TextInput.render = function (props: any, ref: any) {
      const mergedProps = {
        ...props,
        style: [{ fontFamily: 'Archivo Black' }, props?.style],
      };
      return origRender.call(this, mergedProps, ref);
    };
    rnw.TextInput.__archivoPatched = true;
  }
} catch {
  // react-native-web not in use
}

// 3. React Native Native runtime patch (iOS / Android)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rn = require('react-native');

  if (rn?.Text && !rn.Text.__archivoPatched) {
    const OrigText = rn.Text;
    if (OrigText.render) {
      const origRender = OrigText.render;
      OrigText.render = function (props: any, ref: any) {
        const mergedProps = {
          ...props,
          style: [{ fontFamily: GLOBAL_FONT_FAMILY }, props?.style],
        };
        return origRender.call(this, mergedProps, ref);
      };
    } else if (typeof OrigText === 'function') {
      const PatchedText = React.forwardRef((props: any, ref: any) => {
        const mergedProps = {
          ...props,
          style: [{ fontFamily: GLOBAL_FONT_FAMILY }, props?.style],
        };
        return React.createElement(OrigText, { ...mergedProps, ref });
      });
      Object.assign(PatchedText, OrigText);
      try {
        Object.defineProperty(rn, 'Text', { value: PatchedText, configurable: true, writable: true });
      } catch {
        rn.Text = PatchedText;
      }
    }
    if ((rn.Text as any).defaultProps == null) {
      (rn.Text as any).defaultProps = {};
    }
    (rn.Text as any).defaultProps.style = [
      { fontFamily: GLOBAL_FONT_FAMILY },
      (rn.Text as any).defaultProps.style,
    ];
    rn.Text.__archivoPatched = true;
  }

  if (rn?.TextInput && !rn.TextInput.__archivoPatched) {
    const OrigTextInput = rn.TextInput;
    if (OrigTextInput.render) {
      const origRender = OrigTextInput.render;
      OrigTextInput.render = function (props: any, ref: any) {
        const mergedProps = {
          ...props,
          style: [{ fontFamily: GLOBAL_FONT_FAMILY }, props?.style],
        };
        return origRender.call(this, mergedProps, ref);
      };
    } else if (typeof OrigTextInput === 'function') {
      const PatchedTextInput = React.forwardRef((props: any, ref: any) => {
        const mergedProps = {
          ...props,
          style: [{ fontFamily: GLOBAL_FONT_FAMILY }, props?.style],
        };
        return React.createElement(OrigTextInput, { ...mergedProps, ref });
      });
      Object.assign(PatchedTextInput, OrigTextInput);
      try {
        Object.defineProperty(rn, 'TextInput', { value: PatchedTextInput, configurable: true, writable: true });
      } catch {
        rn.TextInput = PatchedTextInput;
      }
    }
    if ((rn.TextInput as any).defaultProps == null) {
      (rn.TextInput as any).defaultProps = {};
    }
    (rn.TextInput as any).defaultProps.style = [
      { fontFamily: GLOBAL_FONT_FAMILY },
      (rn.TextInput as any).defaultProps.style,
    ];
    rn.TextInput.__archivoPatched = true;
  }
} catch {
  // Not on native react-native
}
