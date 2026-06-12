import type { ReactNode } from 'react';

interface AppLayoutProps {
  canvas: ReactNode;
  sidebar: ReactNode;
  toolbar: ReactNode;
}

export default function AppLayout({ canvas, sidebar, toolbar }: AppLayoutProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gridTemplateRows: '1fr auto',
        gap: 16,
        padding: 16,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          gridRow: '1',
          gridColumn: '1',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {canvas}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 10,
          }}
        >
          {toolbar}
        </div>
      </div>

      <div
        style={{
          gridRow: '1',
          gridColumn: '2',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {sidebar}
      </div>
    </div>
  );
}
