"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Minus, Plus, X } from "lucide-react";

const Minimap = ({ 
  tabs, 
  canvasSize, 
  viewportBounds, 
  onViewportChange,
  scale,
  onMinimize 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const minimapRef = useRef(null);
  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;

  const minimapScale = Math.min(
    MINIMAP_WIDTH / canvasSize.width,
    MINIMAP_HEIGHT / canvasSize.height
  );

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
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

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          className="bg-gray-800 text-gray-200 p-2 rounded-full hover:bg-gray-700"
          onClick={() => setIsMinimized(false)}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 bg-gray-800 border-gray-700">
      <div className="p-2 flex justify-between items-center border-b border-gray-700">
        <span className="text-xs text-gray-200">Minimap</span>
        <div className="flex gap-1">
          <button
            className="text-gray-400 hover:text-gray-200"
            onClick={() => setIsMinimized(true)}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            className="text-gray-400 hover:text-gray-200"
            onClick={onMinimize}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div 
        ref={minimapRef}
        className="relative overflow-hidden cursor-crosshair"
        style={{ 
          width: MINIMAP_WIDTH, 
          height: MINIMAP_HEIGHT 
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Background grid */}
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

        {/* Tab dots */}
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

        {/* Viewport rectangle */}
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

export default Minimap;