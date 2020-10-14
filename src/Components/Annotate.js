
import React, { useEffect, useRef, useState } from 'react';
import { saveSvgAsPng } from 'save-svg-as-png'
import { v1, v4 } from 'uuid'

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  const updateMousePosition = ev => {
    setMousePosition({ x: ev.clientX, y: ev.clientY });
  };

  useEffect(() => {
    window.addEventListener("mousemove", updateMousePosition);

    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return mousePosition;
};

const useSvgMousePosition = (svgRef) => {
  const { x, y } = useMousePosition()
  const offsetVals = svgRef?.current ? { x: svgRef?.current?.getBoundingClientRect?.()?.left, y: svgRef?.current?.getBoundingClientRect?.()?.top } : { x: 0, y: 0 }

  return { x: x - offsetVals.x, y: y - offsetVals.y, pageX: x, pageY: y }
}


const handleStyles = {
  width: 10,
  height: 10,
  backgroundColor: 'white',
  border: '1px solid black',
  zIndex: 6,
  position: 'absolute',
}


const SelectionBox = ({
  activePath,
  x,
  y,
  adjustNW,
  adjustNE,
  adjustSW,
  adjustSE,
  adjustN,
  adjustE,
  adjustS,
  adjustW,
  move,
  hideHandles,
}) => {
  const [isDragging, setIsDragging] = useState('')
  const [dragRelationaryPositions, setDragRelationaryPositions] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  })

  const leftX = activePath.pageX1 < activePath.pageX2 ? activePath.pageX1 : activePath.pageX2
  const rightX = activePath.pageX1 > activePath.pageX2 ? activePath.pageX1 : activePath.pageX2

  const topY = activePath.pageY1 < activePath.pageY2 ? activePath.pageY1 : activePath.pageY2
  const bottomY = activePath.pageY1 > activePath.pageY2 ? activePath.pageY1 : activePath.pageY2


  const calculateDragRelationaryPositions = () => {
    const relationaryPos = {
      x1: activePath.x1 - x,
      y1: activePath.y1 - y,
      x2: activePath.x2 - x,
      y2: activePath.y2 - y,
    }
    setDragRelationaryPositions(relationaryPos)
  }

  const handleMouseDown = (e) => {
    calculateDragRelationaryPositions()
    setIsDragging(e.target.id)
  }

  const handleMouseUp = (e) => {
    setIsDragging('')
  }

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);

    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [])

  useEffect(() => {
    switch (isDragging) {
      case 'annotation-nw':
        adjustNW()
        break;

      case 'annotation-ne':
        adjustNE()
        break;

      case 'annotation-sw':
        adjustSW()
        break;

      case 'annotation-se':
        adjustSE()
        break;

      case 'annotation-n':
        adjustN()
        break;

      case 'annotation-e':
        adjustE()
        break;

      case 'annotation-s':
        adjustS()
        break;

      case 'annotation-w':
        adjustW()
        break;

      case 'selection-box':
        move(dragRelationaryPositions)
        break;
    
      default:
        break;
    }
  }, [x, y, isDragging])


  return (
    <div
      id='selection-box'
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        left: leftX,
        top: topY,
        width: rightX - leftX,
        height: bottomY - topY,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'move',
      }}
    >
      {
        !hideHandles
          ? (
            <>
              <div id='annotation-nw' className='resize-handle' style={{ ...handleStyles, top: '-5px', left: '-5px', cursor: 'nwse-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
              <div id='annotation-n' className='resize-handle' style={{ ...handleStyles, top: '-5px', cursor: 'ns-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
              <div id='annotation-ne' className='resize-handle' style={{ ...handleStyles, top: '-5px', right: '-5px', cursor: 'nesw-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
        
              <div id='annotation-w' className='resize-handle' style={{ ...handleStyles, left: '-5px', cursor: 'ew-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
              <div id='annotation-e' className='resize-handle' style={{ ...handleStyles, right: '-5px', cursor: 'ew-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
        
              <div id='annotation-sw' className='resize-handle' style={{ ...handleStyles, bottom: '-5px', left: '-5px', cursor: 'nesw-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
              <div id='annotation-s' className='resize-handle' style={{ ...handleStyles, bottom: '-5px', cursor: 'ns-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
              <div id='annotation-se' className='resize-handle' style={{ ...handleStyles, bottom: '-5px', right: '-5px', cursor: 'nwse-resize' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
            </>
          )
          : null
      }
    </div>
  )
}


const Annotate = ({ children, imgSrc, imgStyles }) => {
  const svgRef = useRef()
  const imgRef = useRef()
  const { x, y, pageX, pageY } = useSvgMousePosition(svgRef)
  
  const [activePathId, setActivePathId] = useState(null)
  const [activityState, setActivityState] = useState('create')
  const [paths, setPaths] = useState({ pathOrder: [] })
  const [activeTextId, setActiveTextId] = useState(false)

  // active path stuff
  const [activeColor, setActiveColor] = useState('red')
  const [activeType, setActiveType] = useState('rect')
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(2)
  const [activeFontSize, setActiveFontSize] = useState(20)


  // this is just for text, other path dragging is inside of SelectionBox
  const [textDragRelationaryPositions, setTextDragRelationaryPositions] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  })
  const [isDraggingText, setIsDragginText] = useState(false)


  const handleMouseDown = (e) => {
    const targetName = e.target.attributes?.name?.value
    const mouseDownOnPath = targetName && paths.hasOwnProperty(targetName)

    setActivePathId(null)
    setActivityState('create')

    if (activityState === 'create' && !mouseDownOnPath) {
      const id = v1()

      setActivityState('drag')
      setActivePathId(id)
      setPaths({
        ...paths,
        pathOrder: [...paths.pathOrder, id],
        [id]: {
          type: activeType,
          color: activeColor,
          strokeWidth: activeStrokeWidth,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
          pageX1: pageX,
          pageY1: pageY,
          pageX2: pageX,
          pageY2: pageY,
          id,
          textContent: 'default text',
          fontSize: activeFontSize,
        }
      })
    } else if (activityState === 'create' && mouseDownOnPath) {
      e.preventDefault()
      setActivePathId(targetName)
      setActivityState('selected')
    } else if (activityState === 'selected') {
      setActivityState('create')
    }
  }

  const editText = (textPathId) => {
    setActiveTextId(textPathId)
  }

  const handleMouseUp = () => {
    if (activityState === 'drag') {
      setActivityState('selected')
      setEndXYForCurrentPath()

      if (paths && activePathId && paths[activePathId] && paths[activePathId].type === 'text') {
        editText(activePathId)
      }
    }
  }

  useEffect(() => {
    const deactiveatePaths = (e) => {
      // console.log(e.target.attributes.class.value)
      if (!svgRef.current.contains(e.target) && e.target.id !== 'selection-box' && e.target.attributes?.class?.value !== 'resize-handle') {
        setActivityState('create')
      }
    }
    window.addEventListener('mousedown', deactiveatePaths);

    return () => window.removeEventListener('mousedown', deactiveatePaths);
  }, [])

  const setEndXYForCurrentPath = () => {
    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        x2: x,
        y2: y,
        pageX2: pageX,
        pageY2: pageY,
      }
    }

    setPaths(newPaths)
  }


  useEffect(() => {
    if(activityState === 'drag') {
      setEndXYForCurrentPath()
    }
  }, [x, y, activityState])


  const undo = () => {
    const lastPathId = paths.pathOrder[paths.pathOrder.length - 1]

    const newPathOrder = paths.pathOrder.filter(pathId => pathId !== lastPathId)

    const newPaths = {
      ...paths,
      pathOrder: newPathOrder,
    }

    delete newPaths[lastPathId]

    setPaths(newPaths)
  }

  const deletePath = (deletionPathId) => {
    setActivePathId(null)
    setActivityState('create')

    const newPathOrder = paths.pathOrder.filter(pathId => pathId !== deletionPathId)

    const newPaths = { ...paths, pathOrder: newPathOrder }

    delete newPaths[deletionPathId]

    setPaths(newPaths)
  }

  const save = () => {
    // will need to re-write this
    saveSvgAsPng(document.querySelector('#svg-board'), `${v4()}.png`)
  }

  const handleEditText = (e) => {
    const newPaths = {
      ...paths,
      [activeTextId]: {
        ...paths[activeTextId],
        textContent: e.target.value,
      }
    }

    setPaths(newPaths)
  }


  useEffect(() => {
    if (activePathId && activityState === 'selected') {
      const newPaths = {
        ...paths,
        [activePathId]: {
          ...paths[activePathId],
          color: activeColor,
          strokeWidth: activeStrokeWidth,
          fontSize: activeFontSize,
        }
      }
      setPaths(newPaths)
    }
  }, [activeColor, activeStrokeWidth, activeFontSize, activePathId, activityState])



  // selected handles logic!

  const adjustNW = () => {
    const activePath = paths[activePathId]

    const leftXs = activePath.x1 < activePath.x2 ? ['x1', 'pageX1'] : ['x2', 'pageX2']
    const topYs = activePath.y1 < activePath.y2 ? ['y1', 'pageY1'] : ['y2', 'pageY2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [leftXs[0]]: x,
        [topYs[0]]: y,
        [leftXs[1]]: pageX,
        [topYs[1]]: pageY,
      }
    }

    setPaths(newPaths)
  }

  const adjustN = () => {
    const activePath = paths[activePathId]

    const topYs = activePath.y1 < activePath.y2 ? ['y1', 'pageY1'] : ['y2', 'pageY2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [topYs[0]]: y,
        [topYs[1]]: pageY,
      }
    }

    setPaths(newPaths)
  }

  const adjustNE = () => {
    const activePath = paths[activePathId]

    const rigthXs = activePath.x1 > activePath.x2 ? ['x1', 'pageX1'] : ['x2', 'pageX2']
    const topYs = activePath.y1 < activePath.y2 ? ['y1', 'pageY1'] : ['y2', 'pageY2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [rigthXs[0]]: x,
        [topYs[0]]: y,
        [rigthXs[1]]: pageX,
        [topYs[1]]: pageY,
      }
    }

    setPaths(newPaths)
  }

  const adjustW = () => {
    const activePath = paths[activePathId]

    const leftXs = activePath.x1 < activePath.x2 ? ['x1', 'pageX1'] : ['x2', 'pageX2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [leftXs[0]]: x,
        [leftXs[1]]: pageX,
      }
    }

    setPaths(newPaths)
  }

  const adjustE = () => {
    const activePath = paths[activePathId]

    const rigthXs = activePath.x1 > activePath.x2 ? ['x1', 'pageX1'] : ['x2', 'pageX2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [rigthXs[0]]: x,
        [rigthXs[1]]: pageX,
      }
    }

    setPaths(newPaths)
  }

  const adjustSW = () => {
    const activePath = paths[activePathId]

    const leftXs = activePath.x1 < activePath.x2 ? ['x1', 'pageX1'] : ['x2', 'pageX2']
    const bottomYs = activePath.y1 > activePath.y2 ? ['y1', 'pageY1'] : ['y2', 'pageY2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [leftXs[0]]: x,
        [bottomYs[0]]: y,
        [leftXs[1]]: pageX,
        [bottomYs[1]]: pageY,
      }
    }

    setPaths(newPaths)
  }

  const adjustS = () => {
    const activePath = paths[activePathId]

    const bottomYs = activePath.y1 > activePath.y2 ? ['y1', 'pageY1'] : ['y2', 'pageY2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [bottomYs[0]]: y,
        [bottomYs[1]]: pageY,
      }
    }

    setPaths(newPaths)
  }

  const adjustSE = () => {
    const activePath = paths[activePathId]

    const rigthXs = activePath.x1 > activePath.x2 ? ['x1', 'pageX1'] : ['x2', 'pageX2']
    const bottomYs = activePath.y1 > activePath.y2 ? ['y1', 'pageY1'] : ['y2', 'pageY2']

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        [rigthXs[0]]: x,
        [bottomYs[0]]: y,
        [rigthXs[1]]: pageX,
        [bottomYs[1]]: pageY,
      }
    }

    setPaths(newPaths)
  }

  const moveSelection = (dragRelationaryPositions) => {

    const newPaths = {
      ...paths,
      [activePathId]: {
        ...paths[activePathId],
        x1: x + dragRelationaryPositions.x1,
        y1: y + dragRelationaryPositions.y1,
        x2: x + dragRelationaryPositions.x2,
        y2: y + dragRelationaryPositions.y2,
        pageX1: pageX + dragRelationaryPositions.x1,
        pageY1: pageY + dragRelationaryPositions.y1,
        pageX2: pageX + dragRelationaryPositions.x2,
        pageY2: pageY + dragRelationaryPositions.y2,
      }
    }

    setPaths(newPaths)
  }


  const handleTextMouseDown = () => {
    const activePath = paths[activePathId]

    const relationaryPos = {
      x1: activePath.x1 - x,
      y1: activePath.y1 - y,
      x2: activePath.x2 - x,
      y2: activePath.y2 - y,
    }
    setTextDragRelationaryPositions(relationaryPos)
    setIsDragginText(true)
  }

  const handleTextMouseUp = () => {
    setIsDragginText(false)
  }

  useEffect(() => {
    if (isDraggingText) {
      moveSelection(textDragRelationaryPositions)
    }
  }, [x, y, isDraggingText])

  return (
    <>
      <svg
        id='svg-board'
        ref={svgRef}
        style={{
          display: 'flex',
          height: imgRef?.current?.getBoundingClientRect?.()?.height,
          width: imgRef?.current?.getBoundingClientRect?.()?.width,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <image ref={imgRef} xlinkHref={imgSrc} style={{ ...imgStyles }} />
        {Object.keys(paths).map((pathId) => {
          const path = paths[pathId]

          let pathElement


          if (path.type === 'ellipse') {
            const avgX = (path.x2 + path.x1)/2
            const avgY = (path.y2 + path.y1)/2
    
            const width = Math.abs(path.x2 - path.x1)
            const height = Math.abs(path.y2 - path.y1)
    
            pathElement = (
              <ellipse cx={`${avgX}`} cy={`${avgY}`} rx={width - (width/2)} ry={height - (height/2)} key={pathId} name={pathId} fill='transparent' stroke={path.color} strokeWidth={`${path.strokeWidth}px`} />
            )
          }

          if (path.type === 'rect') {
            const left = path.x1 < path.x2 ? path.x1 : path.x2
            const top = path.y1 < path.y2 ? path.y1 : path.y2
    
            const width = Math.abs(path.x2 - path.x1)
            const height = Math.abs(path.y2 - path.y1)
    
            pathElement = (
              <rect x={left} y={top} width={width} height={height} key={pathId} name={pathId} fill='transparent' stroke={path.color} strokeWidth={`${path.strokeWidth}px`} />
            )
          }

          if (path.type === 'line') {
            pathElement = (
              <line x1={path.x1} y1={path.y1} x2={path.x2} y2={path.y2} key={pathId} name={pathId} fill='transparent' stroke={path.color} strokeWidth={`${path.strokeWidth}px`} />
            )
          }

          if (path.type === 'text') {
            pathElement = (
              <text x={path.x1} y={path.y1} fill={path.color} key={pathId} name={pathId} style={{ fontSize: path.fontSize, cursor: activePathId === pathId ? 'move' : 'text' }} onMouseDown={handleTextMouseDown} onMouseUp={handleTextMouseUp}>{path.textContent}</text>
            )
          }

          return (
            <>
              {pathElement}
            </>
          )
        })}
      </svg>
      {
        children?.({
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
          activePathId,
        })
      }
      {
        activityState === 'selected' && paths[activePathId].type === 'text'
          ? (
            <textarea
              style={{ position: 'absolute', left: paths[activeTextId].pageX1, top: paths[activeTextId].pageY1 + 20 }}
              value={paths[activeTextId].textContent}
              onChange={handleEditText}
            />
          )
          : null
      }
      {
        activityState === 'selected'
          ? (
            <SelectionBox
              activePath={paths[activePathId]}
              x={x}
              y={y}
              adjustNW={adjustNW}
              adjustNE={adjustNE}
              adjustSE={adjustSE}
              adjustSW={adjustSW}
              adjustN={adjustN}
              adjustE={adjustE}
              adjustS={adjustS}
              adjustW={adjustW}
              move={moveSelection}
              hideHandles={paths[activePathId].type === 'text'}
            />
          )
          : null
      }
    </>
  )
}

export default Annotate