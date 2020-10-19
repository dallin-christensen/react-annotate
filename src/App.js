import React from 'react';
import './App.css';
import ReactAnnotate from './Components/Annotate';


const src = "https://cdn.vox-cdn.com/thumbor/g6TkjkFOTWfU8bb1IqMx0u0MQJo=/0x0:1904x1178/1200x800/filters:focal(759x442:1063x746)/cdn.vox-cdn.com/uploads/chorus_image/image/67622905/Screen_Shot_2020_10_13_at_8.50.09_AM.0.png"


function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#eee',
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: 800, height: 500, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        <ReactAnnotate imgSrc={src} imgStyles={{ height: 500 }} onSave={(uri) => console.log({ uri })}>
          {({
            activeColor,
            activeStrokeWidth,
            activeType,
            activeFontSize,
            setActiveColor,
            setActiveStrokeWidth,
            setActiveType,
            setActiveFontSize,
            undo,
            save,
            deletePath,
            activePathId
          }) => (
            <div style={{ marginTop: 10 }}>
              <label for="type">Type:</label>
              <select name='type' value={activeType} onChange={(e) => setActiveType(e.target.value)}>
                <option value='line'>line</option>
                <option value='arrow'>arrow</option>
                <option value='rect'>rect</option>
                <option value='ellipse'>ellipse</option>
                <option value='text'>text</option>
              </select>

              <label for="color">Color:</label>
              <select name='color' value={activeColor} onChange={(e) => setActiveColor(e.target.value)}>
                <option value='red'>red</option>
                <option value='green'>green</option>
                <option value='blue'>blue</option>
                <option value='orange'>orange</option>
              </select>

              <label for='stroke-width'>width</label>
              <input name='stroke-width' type='number' value={activeStrokeWidth} onChange={e => setActiveStrokeWidth(e.target.value)} />

              <label for='font-size'>font size</label>
              <input name='font-size' type='number' value={activeFontSize} onChange={e => setActiveFontSize(e.target.value)} />


              <button onClick={save}>save</button>
              <button onClick={undo}>undo</button>
              {
                activePathId
                  ? <button onClick={() => deletePath(activePathId)}>delete</button>
                  : null
              }
            </div>
          )}
        </ReactAnnotate>
      </div>
    </div>
  );
}

export default App;
