
// // components/canvas/TabCanvas.jsx
// "use client";

// import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
// import { PanZoom } from 'react-easy-panzoom';
// import { Card } from "@/components/ui/card";
// import { Globe } from "lucide-react";
// import { useTabData } from '@/hooks/useTabData';
// import TabNode from './TabNode';

// const STORAGE_KEY = 'tab-positions';

// const savePositionsToStorage = (positions) => {
//   if (typeof window !== 'undefined') {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
//   }
// };

// const loadPositionsFromStorage = () => {
//   if (typeof window !== 'undefined') {
//     const saved = localStorage.getItem(STORAGE_KEY);
//     return saved ? JSON.parse(saved) : {};
//   }
//   return {};
// };

// const EdgeLine = ({ start, end }) => {
//   const controlPoint1 = {
//     x: start.x + (end.x - start.x) / 2,
//     y: start.y
//   };
//   const controlPoint2 = {
//     x: start.x + (end.x - start.x) / 2,
//     y: end.y
//   };

//   return (
//     <svg
//       className="absolute top-0 left-0 w-full h-full pointer-events-none"
//       style={{ zIndex: 0 }}
//     >
//       <path
//         d={`M ${start.x} ${start.y} 
//            C ${controlPoint1.x} ${controlPoint1.y},
//              ${controlPoint2.x} ${controlPoint2.y},
//              ${end.x} ${end.y}`}
//         fill="none"
//         stroke="rgba(255, 255, 255, 0.2)"
//         strokeWidth="2"
//         className="transition-all duration-300 ease-in-out"
//       >
//         <animate
//           attributeName="stroke-dasharray"
//           from="0,1000"
//           to="1000,0"
//           dur="0.5s"
//           fill="freeze"
//         />
//       </path>
//     </svg>
//   );
// };

// const Minimap = ({ tabs, canvasSize, viewportBounds, onViewportChange, scale }) => {
//   const [isDragging, setIsDragging] = useState(false);
//   const minimapRef = useRef(null);
//   const MINIMAP_WIDTH = 200;
//   const MINIMAP_HEIGHT = 150;

//   const minimapScale = Math.min(
//     MINIMAP_WIDTH / canvasSize.width,
//     MINIMAP_HEIGHT / canvasSize.height
//   );

//   const handleMouseDown = (e) => {
//     if (e.button !== 0) return;
//     setIsDragging(true);
//     updateViewport(e);
//   };

//   const updateViewport = (e) => {
//     const rect = minimapRef.current.getBoundingClientRect();
//     const x = (e.clientX - rect.left) / minimapScale / scale;
//     const y = (e.clientY - rect.top) / minimapScale / scale;
//     onViewportChange(x, y);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDragging) return;
//     updateViewport(e);
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   useEffect(() => {
//     if (isDragging) {
//       window.addEventListener('mousemove', handleMouseMove);
//       window.addEventListener('mouseup', handleMouseUp);
//       return () => {
//         window.removeEventListener('mousemove', handleMouseMove);
//         window.removeEventListener('mouseup', handleMouseUp);
//       };
//     }
//   }, [isDragging]);

//   return (
//     <Card className="fixed bottom-4 right-4 z-50 bg-gray-800 border-gray-700">
//       <div 
//         ref={minimapRef}
//         className="relative overflow-hidden cursor-crosshair"
//         style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
//         onMouseDown={handleMouseDown}
//       >
//         <div 
//           className="absolute"
//           style={{
//             width: canvasSize.width * minimapScale,
//             height: canvasSize.height * minimapScale,
//             background: 'rgba(255, 255, 255, 0.05)'
//           }}
//         >
//           <svg width="100%" height="100%" className="opacity-20">
//             <pattern
//               id="minimap-grid"
//               width={40 * minimapScale}
//               height={40 * minimapScale}
//               patternUnits="userSpaceOnUse"
//             >
//               <path
//                 d={`M ${40 * minimapScale} 0 L 0 0 0 ${40 * minimapScale}`}
//                 fill="none"
//                 stroke="rgba(255,255,255,0.2)"
//                 strokeWidth="0.5"
//               />
//             </pattern>
//             <rect width="100%" height="100%" fill="url(#minimap-grid)" />
//           </svg>
//         </div>

//         {tabs.map(tab => {
//           const position = tab.position || { x: 0, y: 0 };
//           return (
//             <div
//               key={tab.id}
//               className="absolute w-1 h-1 bg-blue-500 rounded-full"
//               style={{
//                 left: position.x * minimapScale,
//                 top: position.y * minimapScale,
//                 transform: 'translate(-50%, -50%)'
//               }}
//             />
//           );
//         })}

//         <div
//           className="absolute border border-blue-500 bg-blue-500/10"
//           style={{
//             left: (viewportBounds.x) * minimapScale,
//             top: (viewportBounds.y) * minimapScale,
//             width: (viewportBounds.width / scale) * minimapScale,
//             height: (viewportBounds.height / scale) * minimapScale,
//             pointerEvents: 'none'
//           }}
//         />
//       </div>
//     </Card>
//   );
// };

// export default function TabCanvas() {
//   const { tabs, loading, error, focusTab } = useTabData();
//   const [positions, setPositions] = useState(() => loadPositionsFromStorage());
//   const [isDragging, setIsDragging] = useState(false);
//   const [canvasSize, setCanvasSize] = useState({
//     width: 5000,
//     height: 3000,
//     centerX: 2500,
//     centerY: 1500,
//   });
//   const [viewportBounds, setViewportBounds] = useState({
//     x: 0,
//     y: 0,
//     width: 0,
//     height: 0,
//     scale: 1
//   });
//   const panzoomRef = useRef();

//   useEffect(() => {
//     const updateCanvasSize = () => {
//       if (typeof window !== 'undefined') {
//         const width = Math.max(5000, window.innerWidth * 3);
//         const height = Math.max(3000, window.innerHeight * 3);
//         setCanvasSize({
//           width,
//           height,
//           centerX: width / 2,
//           centerY: height / 2,
//         });
//       }
//     };

//     updateCanvasSize();

//     if (typeof window !== 'undefined') {
//       window.addEventListener('resize', updateCanvasSize);
//       return () => window.removeEventListener('resize', updateCanvasSize);
//     }
//   }, []);

//   const handlePanZoomChange = useCallback((e) => {
//     setViewportBounds({
//       x: -e.x,
//       y: -e.y,
//       width: window.innerWidth,
//       height: window.innerHeight,
//       scale: e.scale
//     });
//   }, []);

//   const getTabPosition = useCallback((tab, index) => {
//     if (positions[tab.id]) {
//       return positions[tab.id];
//     }
    
//     // Grid layout settings
//     const COLS = 5; // Number of columns
//     const SPACING_X = 300; // Horizontal spacing between tabs
//     const SPACING_Y = 150; // Vertical spacing between tabs
//     const START_X = canvasSize.width * 0.2; // Start at 20% of canvas width
//     const START_Y = canvasSize.height * 0.2; // Start at 20% of canvas height
    
//     const row = Math.floor(index / COLS);
//     const col = index % COLS;
    
//     return {
//       x: START_X + (col * SPACING_X),
//       y: START_Y + (row * SPACING_Y)
//     };
//   }, [positions, canvasSize]);

//   const handleDragEnd = useCallback((tabId, finalPosition) => {
//     setPositions(prev => {
//       const newPositions = {
//         ...prev,
//         [tabId]: finalPosition
//       };
//       savePositionsToStorage(newPositions);
//       return newPositions;
//     });
//     setIsDragging(false);
//   }, []);

//   const handleDragStart = useCallback(() => {
//     setIsDragging(true);
//   }, []);

//   const handleViewportChange = useCallback((x, y) => {
//     if (panzoomRef.current) {
//       panzoomRef.current.setTransform(
//         -x * viewportBounds.scale,
//         -y * viewportBounds.scale,
//         viewportBounds.scale
//       );
//     }
//   }, [viewportBounds.scale]);

//   const closeTab = useCallback((tabId) => {
//     if (typeof chrome !== 'undefined' && chrome.tabs) {
//       chrome.tabs.remove(tabId);
//       // Remove position from localStorage
//       setPositions(prev => {
//         const newPositions = { ...prev };
//         delete newPositions[tabId];
//         savePositionsToStorage(newPositions);
//         return newPositions;
//       });
//     }
//   }, []);

//   const connections = useMemo(() => {
//     const result = [];
//     tabs.forEach(tab => {
//       if (tab.parentId) {
//         const parentTab = tabs.find(t => t.id === tab.parentId);
//         if (parentTab) {
//           const startPos = getTabPosition(parentTab, tabs.indexOf(parentTab));
//           const endPos = getTabPosition(tab, tabs.indexOf(tab));
//           result.push({
//             id: `${parentTab.id}-${tab.id}`,
//             start: {
//               x: startPos.x,
//               y: startPos.y + 40
//             },
//             end: {
//               x: endPos.x,
//               y: endPos.y - 40
//             }
//           });
//         }
//       }
//     });
//     return result;
//   }, [tabs, getTabPosition]);

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-900">
//         <div className="text-gray-200">Loading tabs...</div>
//         {error && <div className="text-red-400">{error}</div>}
//       </div>
//     );
//   }

//   return (
//     <div className="w-full h-screen overflow-hidden bg-gray-900">
//       <PanZoom 
//         ref={panzoomRef}
//         className="w-full h-full"
//         minZoom={0.001}
//         maxZoom={1000}
//         enableBoundingBox={false}
//         boundaryRatioVertical={0}
//         boundaryRatioHorizontal={0}
//         zoomSpeed={1}
//         disabled={isDragging}
//         style={{ 
//           cursor: isDragging ? 'grabbing' : 'grab',
//           outline: 'none'
//         }}
//         onPanStart={() => setIsDragging(true)}
//         onPanEnd={() => setIsDragging(false)}
//         onStateChange={handlePanZoomChange}
//         autoCenter
//       >
//         <div 
//           className="relative"
//           style={{ 
//             width: canvasSize.width,
//             height: canvasSize.height,
//           }}
//         >
//           <svg
//             width="100%"
//             height="100%"
//             xmlns="http://www.w3.org/2000/svg"
//             className="absolute top-0 left-0 pointer-events-none"
//           >
//             <defs>
//               <pattern
//                 id="grid"
//                 width="40"
//                 height="40"
//                 patternUnits="userSpaceOnUse"
//               >
//                 <path
//                   d="M 40 0 L 0 0 0 40"
//                   fill="none"
//                   stroke="rgba(255,255,255,0.1)"
//                   strokeWidth="0.5"
//                 />
//               </pattern>
//             </defs>
//             <rect width="100%" height="100%" fill="url(#grid)" />
//           </svg>

//           {connections.map(connection => (
//             <EdgeLine
//               key={connection.id}
//               start={connection.start}
//               end={connection.end}
//             />
//           ))}

//           {tabs.map((tab, index) => {
//             const position = getTabPosition(tab, index);
//             return (
//               <TabNode
//                 key={tab.id}
//                 data={tab}
//                 initialPosition={position}
//                 onClick={() => !isDragging && focusTab(tab.id, tab.windowId)}
//                 onDragStart={handleDragStart}
//                 onDragEnd={(newPosition) => handleDragEnd(tab.id, newPosition)}
//                 hasChildren={tabs.some(t => t.parentId === tab.id)}
//                 isChild={tab.parentId !== undefined}
//                 onClose={closeTab}
//               />
//             );
//           })}
//         </div>
//       </PanZoom>

//       <Minimap
//         tabs={tabs.map(tab => ({
//           ...tab,
//           position: getTabPosition(tab, tabs.indexOf(tab))
//         }))}
//         canvasSize={canvasSize}
//         viewportBounds={viewportBounds}
//         onViewportChange={handleViewportChange}
//         scale={viewportBounds.scale}
//       />
//     </div>
//   );
// }



// components/canvas/TabCanvas.jsx
"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { PanZoom } from 'react-easy-panzoom';
import { Card } from "@/components/ui/card";
import { Globe, LayoutGrid, Image } from "lucide-react";
import { useTabData } from '@/hooks/useTabData';
import TabNode from './TabNode';

const STORAGE_KEY = 'tab-positions';

const savePositionsToStorage = (positions) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }
};

const loadPositionsFromStorage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  }
  return {};
};

const EdgeLine = ({ start, end }) => {
  const controlPoint1 = {
    x: start.x + (end.x - start.x) / 2,
    y: start.y
  };
  const controlPoint2 = {
    x: start.x + (end.x - start.x) / 2,
    y: end.y
  };

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <path
        d={`M ${start.x} ${start.y} 
           C ${controlPoint1.x} ${controlPoint1.y},
             ${controlPoint2.x} ${controlPoint2.y},
             ${end.x} ${end.y}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        className="transition-all duration-300 ease-in-out"
      >
        <animate
          attributeName="stroke-dasharray"
          from="0,1000"
          to="1000,0"
          dur="0.5s"
          fill="freeze"
        />
      </path>
    </svg>
  );
};

const Minimap = ({ tabs, canvasSize, viewportBounds, onViewportChange, scale }) => {
  const [isDragging, setIsDragging] = useState(false);
  const minimapRef = useRef(null);
  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;

  const minimapScale = Math.min(
    MINIMAP_WIDTH / canvasSize.width,
    MINIMAP_HEIGHT / canvasSize.height
  );

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    updateViewport(e);
  };

  const updateViewport = (e) => {
    const rect = minimapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / minimapScale / scale;
    const y = (e.clientY - rect.top) / minimapScale / scale;
    onViewportChange(x, y);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateViewport(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <Card className="fixed bottom-4 right-4 z-50 bg-gray-800 border-gray-700">
      <div 
        ref={minimapRef}
        className="relative overflow-hidden cursor-crosshair"
        style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="absolute"
          style={{
            width: canvasSize.width * minimapScale,
            height: canvasSize.height * minimapScale,
            background: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <svg width="100%" height="100%" className="opacity-20">
            <pattern
              id="minimap-grid"
              width={40 * minimapScale}
              height={40 * minimapScale}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${40 * minimapScale} 0 L 0 0 0 ${40 * minimapScale}`}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#minimap-grid)" />
          </svg>
        </div>

        {tabs.map(tab => {
          const position = tab.position || { x: 0, y: 0 };
          return (
            <div
              key={tab.id}
              className="absolute w-1 h-1 bg-blue-500 rounded-full"
              style={{
                left: position.x * minimapScale,
                top: position.y * minimapScale,
                transform: 'translate(-50%, -50%)'
              }}
            />
          );
        })}

        <div
          className="absolute border border-blue-500 bg-blue-500/10"
          style={{
            left: (viewportBounds.x) * minimapScale,
            top: (viewportBounds.y) * minimapScale,
            width: (viewportBounds.width / scale) * minimapScale,
            height: (viewportBounds.height / scale) * minimapScale,
            pointerEvents: 'none'
          }}
        />
      </div>
    </Card>
  );
};

export default function TabCanvas() {
  const { tabs, loading, error, focusTab } = useTabData();
  const [positions, setPositions] = useState(() => loadPositionsFromStorage());
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'preview'
  const [canvasSize, setCanvasSize] = useState({
    width: 5000,
    height: 3000,
    centerX: 2500,
    centerY: 1500,
  });
  const [viewportBounds, setViewportBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scale: 1
  });
  const panzoomRef = useRef();

  useEffect(() => {
    const updateCanvasSize = () => {
      if (typeof window !== 'undefined') {
        const width = Math.max(5000, window.innerWidth * 3);
        const height = Math.max(3000, window.innerHeight * 3);
        setCanvasSize({
          width,
          height,
          centerX: width / 2,
          centerY: height / 2,
        });
      }
    };

    updateCanvasSize();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }
  }, []);

  const handlePanZoomChange = useCallback((e) => {
    setViewportBounds({
      x: -e.x,
      y: -e.y,
      width: window.innerWidth,
      height: window.innerHeight,
      scale: e.scale
    });
  }, []);

  const getTabPosition = useCallback((tab, index) => {
    if (positions[tab.id]) {
      return positions[tab.id];
    }
    
    // Grid layout settings
    const COLS = viewMode === 'preview' ? 4 : 5;
    const SPACING_X = viewMode === 'preview' ? 350 : 300;
    const SPACING_Y = viewMode === 'preview' ? 220 : 150;
    const START_X = canvasSize.width * 0.2;
    const START_Y = canvasSize.height * 0.2;
    
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    
    return {
      x: START_X + (col * SPACING_X),
      y: START_Y + (row * SPACING_Y)
    };
  }, [positions, canvasSize, viewMode]);

  const handleDragEnd = useCallback((tabId, finalPosition) => {
    setPositions(prev => {
      const newPositions = {
        ...prev,
        [tabId]: finalPosition
      };
      savePositionsToStorage(newPositions);
      return newPositions;
    });
    setIsDragging(false);
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleViewportChange = useCallback((x, y) => {
    if (panzoomRef.current) {
      panzoomRef.current.setTransform(
        -x * viewportBounds.scale,
        -y * viewportBounds.scale,
        viewportBounds.scale
      );
    }
  }, [viewportBounds.scale]);

  const connections = useMemo(() => {
    const result = [];
    tabs.forEach(tab => {
      if (tab.parentId) {
        const parentTab = tabs.find(t => t.id === tab.parentId);
        if (parentTab) {
          const startPos = getTabPosition(parentTab, tabs.indexOf(parentTab));
          const endPos = getTabPosition(tab, tabs.indexOf(tab));
          result.push({
            id: `${parentTab.id}-${tab.id}`,
            start: {
              x: startPos.x,
              y: startPos.y + (viewMode === 'preview' ? 100 : 40)
            },
            end: {
              x: endPos.x,
              y: endPos.y - (viewMode === 'preview' ? 100 : 40)
            }
          });
        }
      }
    });
    return result;
  }, [tabs, getTabPosition, viewMode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-900">
        <div className="text-gray-200">Loading tabs...</div>
        {error && <div className="text-red-400">{error}</div>}
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-900">
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <button
          className="bg-gray-800 text-gray-200 p-2 rounded-md hover:bg-gray-700 
                     transition-colors duration-200"
          onClick={() => setViewMode(prev => prev === 'card' ? 'preview' : 'card')}
        >
          {viewMode === 'card' ? 
            <Image className="w-4 h-4" /> : 
            <LayoutGrid className="w-4 h-4" />
          }
        </button>
      </div>

      <PanZoom 
        ref={panzoomRef}
        className="w-full h-full"
        minZoom={0.001}
        maxZoom={1000}
        enableBoundingBox={false}
        boundaryRatioVertical={0}
        boundaryRatioHorizontal={0}
        zoomSpeed={1}
        disabled={isDragging}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          outline: 'none'
        }}
        onPanStart={() => setIsDragging(true)}
        onPanEnd={() => setIsDragging(false)}
        onStateChange={handlePanZoomChange}
        autoCenter
      >
        <div 
          className="relative"
          style={{ 
            width: canvasSize.width,
            height: canvasSize.height,
          }}
        >
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-0 left-0 pointer-events-none"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {connections.map(connection => (
            <EdgeLine
              key={connection.id}
              start={connection.start}
              end={connection.end}
            />
          ))}

          {tabs.map((tab, index) => {
            const position = getTabPosition(tab, index);
            return (
              <TabNode
                key={tab.id}
                data={tab}
                viewMode={viewMode}
                initialPosition={position}
                onClick={() => !isDragging && focusTab(tab.id, tab.windowId)}
                onDragStart={handleDragStart}
                onDragEnd={(newPosition) => handleDragEnd(tab.id, newPosition)}
                hasChildren={tabs.some(t => t.parentId === tab.id)}
                isChild={tab.parentId !== undefined}
              />
            );
          })}
        </div>
      </PanZoom>

      <Minimap
        tabs={tabs.map(tab => ({
          ...tab,
          position: getTabPosition(tab, tabs.indexOf(tab))
        }))}
        canvasSize={canvasSize}
        viewportBounds={viewportBounds}
        onViewportChange={handleViewportChange}
        scale={viewportBounds.scale}
      />
    </div>
  );
}
