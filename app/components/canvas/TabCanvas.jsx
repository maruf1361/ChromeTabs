// components/canvas/TabCanvas.jsx
"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { PanZoom } from 'react-easy-panzoom';
import { Card } from '../ui/card';
import { Input } from "@/components/ui/input";
import { Globe, Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingTabs, setMatchingTabs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
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

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setMatchingTabs([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const matches = tabs.filter(tab => 
      tab.title?.toLowerCase().includes(query.toLowerCase()) ||
      tab.url?.toLowerCase().includes(query.toLowerCase())
    );
    setMatchingTabs(matches);
  }, [tabs]);

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
    const COLS = 5;
    const SPACING_X = 300;
    const SPACING_Y = 150;
    const START_X = canvasSize.width * 0.2;
    const START_Y = canvasSize.height * 0.2;
    
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    
    return {
      x: START_X + (col * SPACING_X),
      y: START_Y + (row * SPACING_Y)
    };
  }, [positions, canvasSize]);

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
              y: startPos.y + 40
            },
            end: {
              x: endPos.x,
              y: endPos.y - 40
            }
          });
        }
      }
    });
    return result;
  }, [tabs, getTabPosition]);

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
      {/* Search Card */}
      <Card className="fixed top-6 left-6 z-50 bg-gray-800/90 backdrop-blur-sm border-gray-700 w-80 p-4">
        <div className="space-y-4">
          {/* App Title and Tagline */}
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-gray-100">
              TabMap
            </h1>
            <p className="text-sm text-gray-400">
              Visualize and manage your browser tabs effortlessly
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search tabs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-900/50 text-gray-200 pl-10 pr-10 
                        border-gray-700 focus:ring-blue-500 focus:border-blue-500
                        placeholder-gray-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2
                          hover:text-gray-300 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="bg-gray-900/50 rounded-md border border-gray-700
                          max-h-60 overflow-y-auto mt-2">
              {matchingTabs.length > 0 ? (
                matchingTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      focusTab(tab.id, tab.windowId);
                      handleSearch('');
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-800/50
                              border-b border-gray-700/50 last:border-0"
                  >
                    {tab.favicon ? (
                      <img src={tab.favicon} alt="" className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4 text-gray-400" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-sm text-gray-200 truncate">
                        {tab.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {tab.url}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-center text-sm">
                  No matching tabs found
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

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
            const isMatching = searchQuery && (
              tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              tab.url?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            return (
              <TabNode
                key={tab.id}
                data={tab}
                initialPosition={position}
                onClick={() => !isDragging && focusTab(tab.id, tab.windowId)}
                onDragStart={handleDragStart}
                onDragEnd={(newPosition) => handleDragEnd(tab.id, newPosition)}
                hasChildren={tabs.some(t => t.parentId === tab.id)}
                isChild={tab.parentId !== undefined}
                isHighlighted={isMatching}
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
