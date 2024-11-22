// "use client";

// import { useState, useRef, useEffect, useCallback } from 'react';
// import { Card } from '../ui/card';
// import { Globe, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";

// export default function TabNode({ 
//   data, 
//   viewMode = 'card',
//   initialPosition, 
//   onClick, 
//   onDragStart, 
//   onDragEnd,
//   hasChildren,
//   isChild,
//   onClose
// }) {
//   const [position, setPosition] = useState(initialPosition);
//   const [isDragging, setIsDragging] = useState(false);
//   const [isClosing, setIsClosing] = useState(false);
//   const [previewError, setPreviewError] = useState(false);
//   const nodeRef = useRef(null);
//   const dragStartPos = useRef({ x: 0, y: 0 });

//   useEffect(() => {
//     setPosition(initialPosition);
//   }, [initialPosition]);

//   const handleMouseDown = useCallback((e) => {
//     if (e.button !== 0) return;

//     const rect = nodeRef.current.getBoundingClientRect();
//     dragStartPos.current = {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top
//     };

//     setIsDragging(true);
//     onDragStart?.();
//     e.stopPropagation();
//   }, [onDragStart]);

//   const handleMouseMove = useCallback((e) => {
//     if (!isDragging) return;

//     const parentRect = nodeRef.current.parentElement.getBoundingClientRect();
//     const scale = parentRect.width / nodeRef.current.parentElement.offsetWidth;

//     const newX = (e.clientX - parentRect.left - dragStartPos.current.x) / scale;
//     const newY = (e.clientY - parentRect.top - dragStartPos.current.y) / scale;

//     setPosition({ x: newX, y: newY });
//     e.preventDefault();
//     e.stopPropagation();
//   }, [isDragging]);

//   const handleMouseUp = useCallback((e) => {
//     if (!isDragging) return;

//     setIsDragging(false);
//     onDragEnd?.(position);

//     e.preventDefault();
//     e.stopPropagation();
//   }, [isDragging, onDragEnd, position]);

//   const handleClose = useCallback((e) => {
//     e.stopPropagation();
//     setIsClosing(true);

//     window.postMessage({
//       type: 'TO_EXTENSION',
//       data: {
//         action: 'closeTab',
//         tabId: data.id
//       }
//     }, '*');

//     setTimeout(() => {
//       setIsClosing(false);
//     }, 3000);
//   }, [data.id]);

//   useEffect(() => {
//     if (isDragging) {
//       window.addEventListener('mousemove', handleMouseMove);
//       window.addEventListener('mouseup', handleMouseUp);
//       return () => {
//         window.removeEventListener('mousemove', handleMouseMove);
//         window.removeEventListener('mouseup', handleMouseUp);
//       };
//     }
//   }, [isDragging, handleMouseMove, handleMouseUp]);

//   if (viewMode === 'preview') {
//     return (
//       <Card 
//         ref={nodeRef}
//         className={`absolute select-none group
//                    bg-gray-800 hover:bg-gray-750 border border-gray-700
//                    ${isDragging ? 'cursor-grabbing shadow-2xl z-50' : 'cursor-grab hover:shadow-lg'}
//                    ${hasChildren ? 'border-t-blue-500 border-t-2' : ''}
//                    ${isChild ? 'border-b-green-500 border-b-2' : ''}
//                    ${isClosing ? 'opacity-50' : ''}
//                    transition-all overflow-hidden`}
//         style={{ 
//           left: `${position.x}px`, 
//           top: `${position.y}px`,
//           width: '320px',
//           height: '200px',
//           transform: 'translate(-50%, -50%)',
//           willChange: 'transform, left, top',
//           borderRadius: '8px',
//           boxShadow: isDragging 
//             ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
//             : '0 4px 6px rgba(0, 0, 0, 0.3)',
//         }}
//         onMouseDown={handleMouseDown}
//         onClick={onClick}
//       >
//         <div className="w-full h-full relative">
//           {!previewError ? (
//             <iframe
//               src={data.url}
//               title={data.title}
//               className="w-full h-full transform scale-50 origin-top-left"
//               style={{ 
//                 width: '200%', 
//                 height: '200%',
//                 pointerEvents: 'none'
//               }}
//               onError={() => setPreviewError(true)}
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center bg-gray-850 text-gray-400">
//               <div className="text-center">
//                 <Globe className="w-8 h-8 mx-auto mb-2" />
//                 <div className="text-sm">Preview not available</div>
//               </div>
//             </div>
//           )}

//           {/* Overlay for dragging */}
//           <div className="absolute inset-0 bg-transparent group-hover:bg-black/5" />
          
//           {/* Close button */}
//           <button
//             className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
//                      transition-opacity p-1 hover:bg-gray-700 rounded-full
//                      disabled:opacity-50 disabled:cursor-not-allowed
//                      bg-gray-800 z-10"
//             onClick={handleClose}
//             disabled={isClosing}
//           >
//             <X className={`w-4 h-4 ${isClosing ? 'text-gray-500' : 'text-gray-400 hover:text-red-400'}`} />
//           </button>

//           {/* Title bar */}
//           <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-800/90
//                         opacity-0 group-hover:opacity-100 transition-opacity">
//             <div className="flex items-center gap-2">
//               {data.favicon && (
//                 <img src={data.favicon} alt="" className="w-4 h-4" />
//               )}
//               <div className="flex-1 truncate text-sm font-medium text-gray-200">
//                 {data.title || "New Tab"}
//               </div>
//               <div className="flex gap-1">
//                 {hasChildren && (
//                   <ArrowDownLeft className="w-4 h-4 text-blue-500" />
//                 )}
//                 {isChild && (
//                   <ArrowUpRight className="w-4 h-4 text-green-500" />
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </Card>
//     );
//   }

//   // Card view
//   return (
//     <Card 
//       ref={nodeRef}
//       className={`absolute p-4 select-none tab-content group
//                  bg-gray-800 hover:bg-gray-750 border border-gray-700
//                  ${isDragging ? 'cursor-grabbing shadow-2xl z-50' : 'cursor-grab hover:shadow-lg'}
//                  ${hasChildren ? 'border-t-blue-500 border-t-2' : ''}
//                  ${isChild ? 'border-b-green-500 border-b-2' : ''}
//                  ${isClosing ? 'opacity-50' : ''}
//                  transition-all`}
//       style={{ 
//         left: `${position.x}px`, 
//         top: `${position.y}px`,
//         width: '250px',
//         transform: 'translate(-50%, -50%)',
//         willChange: 'transform, left, top',
//         borderRadius: '8px',
//         boxShadow: isDragging 
//           ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
//           : '0 4px 6px rgba(0, 0, 0, 0.3)',
//       }}
//       onMouseDown={handleMouseDown}
//       onClick={onClick}
//     >
//       <button
//         className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
//                    transition-opacity p-1 hover:bg-gray-700 rounded-full
//                    disabled:opacity-50 disabled:cursor-not-allowed"
//         onClick={handleClose}
//         disabled={isClosing}
//       >
//         <X className={`w-4 h-4 ${isClosing ? 'text-gray-500' : 'text-gray-400 hover:text-red-400'}`} />
//       </button>
//       <div className="flex items-center gap-2">
//         {data.favicon ? (
//           <img src={data.favicon} alt="" className="w-4 h-4" />
//         ) : (
//           <Globe className="w-4 h-4 text-gray-400" />
//         )}
//         <div className="flex-1 truncate text-sm font-medium text-gray-200">
//           {data.title || "New Tab"}
//         </div>
//         <div className="flex gap-1">
//           {hasChildren && (
//             <ArrowDownLeft className="w-4 h-4 text-blue-500" />
//           )}
//           {isChild && (
//             <ArrowUpRight className="w-4 h-4 text-green-500" />
//           )}
//         </div>
//       </div>
//       <div className="text-xs text-gray-400 truncate mt-1">
//         {data.url}
//       </div>
//     </Card>
//   );
// }




// components/canvas/TabNode.jsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Globe, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";

export default function TabNode({ 
  data, 
  initialPosition, 
  onClick, 
  onDragStart, 
  onDragEnd,
  hasChildren,
  isChild,
  isHighlighted = false
}) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const nodeRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;

    const rect = nodeRef.current.getBoundingClientRect();
    dragStartPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setIsDragging(true);
    onDragStart?.();
    e.stopPropagation();
  }, [onDragStart]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const parentRect = nodeRef.current.parentElement.getBoundingClientRect();
    const scale = parentRect.width / nodeRef.current.parentElement.offsetWidth;

    const newX = (e.clientX - parentRect.left - dragStartPos.current.x) / scale;
    const newY = (e.clientY - parentRect.top - dragStartPos.current.y) / scale;

    setPosition({ x: newX, y: newY });
    e.preventDefault();
    e.stopPropagation();
  }, [isDragging]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging) return;

    setIsDragging(false);
    onDragEnd?.(position);

    e.preventDefault();
    e.stopPropagation();
  }, [isDragging, onDragEnd, position]);

  const handleClose = useCallback((e) => {
    e.stopPropagation();
    setIsClosing(true);

    window.postMessage({
      type: 'TO_EXTENSION',
      data: {
        action: 'closeTab',
        tabId: data.id
      }
    }, '*');

    setTimeout(() => {
      setIsClosing(false);
    }, 3000);
  }, [data.id]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Card 
      ref={nodeRef}
      className={`absolute p-4 select-none tab-content group
                 bg-gray-800 hover:bg-gray-750 border border-gray-700
                 ${isDragging ? 'cursor-grabbing shadow-2xl z-50' : 'cursor-grab hover:shadow-lg'}
                 ${hasChildren ? 'border-t-blue-500 border-t-2' : ''}
                 ${isChild ? 'border-b-green-500 border-b-2' : ''}
                 ${isClosing ? 'opacity-50' : ''}
                 ${isHighlighted ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 z-10' : ''}
                 transition-all`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: '250px',
        transform: 'translate(-50%, -50%)',
        willChange: 'transform, left, top',
        borderRadius: '8px',
        boxShadow: isDragging 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          : isHighlighted
          ? '0 4px 20px rgba(59, 130, 246, 0.3)'
          : '0 4px 6px rgba(0, 0, 0, 0.3)',
      }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                   transition-opacity p-1 hover:bg-gray-700 rounded-full
                   disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleClose}
        disabled={isClosing}
      >
        <X className={`w-4 h-4 ${isClosing ? 'text-gray-500' : 'text-gray-400 hover:text-red-400'}`} />
      </button>
      <div className="flex items-center gap-2">
        {data.favicon ? (
          <img src={data.favicon} alt="" className="w-4 h-4" />
        ) : (
          <Globe className="w-4 h-4 text-gray-400" />
        )}
        <div className="flex-1 truncate text-sm font-medium text-gray-200">
          {data.title || "New Tab"}
        </div>
        <div className="flex gap-1">
          {hasChildren && (
            <ArrowDownLeft className="w-4 h-4 text-blue-500" />
          )}
          {isChild && (
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>
      <div className="text-xs text-gray-400 truncate mt-1">
        {data.url}
      </div>

      {/* Highlight glow effect */}
      {isHighlighted && (
        <div 
          className="absolute inset-0 bg-blue-500/5 rounded-lg pointer-events-none
                     animate-pulse"
          style={{ zIndex: -1 }}
        />
      )}
    </Card>
  );
}