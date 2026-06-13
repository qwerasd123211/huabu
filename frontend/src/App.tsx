import AppHeader from './components/layout/AppHeader'
import AppLayout from './components/layout/AppLayout'
import DrawingCanvas from './components/canvas/DrawingCanvas'
import VoiceControl from './components/voice/VoiceControl'
import RecognizedText from './components/voice/RecognizedText'
import CommandHistory from './components/sidebar/CommandHistory'
import ObjectInspector from './components/sidebar/ObjectInspector'

function App() {
  const sidebar = (
    <>
      <div style={{
        color: 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.04em',
        marginBottom: 8,
        fontFamily: 'var(--font-body)',
      }}>
        语音控制
      </div>
      <VoiceControl />
      <RecognizedText />
      <div style={{
        color: 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.04em',
        marginBottom: 8,
        marginTop: 4,
        fontFamily: 'var(--font-body)',
      }}>
        指令历史
      </div>
      <CommandHistory />
      <div style={{ marginTop: 14 }}>
        <ObjectInspector />
      </div>
    </>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <AppLayout
        canvas={<DrawingCanvas />}
        sidebar={sidebar}
      />
    </div>
  )
}

export default App
