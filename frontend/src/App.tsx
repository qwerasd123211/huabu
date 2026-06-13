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
      <VoiceControl />
      <RecognizedText />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
          指令历史
        </div>
        <CommandHistory />
      </div>
      <ObjectInspector />
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
