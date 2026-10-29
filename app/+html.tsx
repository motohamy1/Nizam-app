import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Google Fonts: Archivo Black */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                font-family: 'Archivo Black', sans-serif !important;
              }
              html, body, #root, div, span, p, h1, h2, h3, h4, h5, h6, input, textarea, button, select {
                font-family: 'Archivo Black', sans-serif !important;
              }
              input::placeholder, textarea::placeholder {
                font-family: 'Archivo Black', sans-serif !important;
              }
            `,
          }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
