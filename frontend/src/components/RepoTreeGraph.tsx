"use client";

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { forceCollide } from 'd3-force';

// ForceGraph2D must be dynamically imported with ssr: false to avoid window is not defined errors
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface GraphNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  val: number; // size
  color: string;
  extension?: string;
}

interface GraphLink {
  source: string;
  target: string;
  color: string;
}

// Generate distinct colors based on directory name
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Preset colors for the root and top level dirs for better aesthetics
const palette = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

let colorIndex = 0;
const colorMap: Record<string, string> = {};

const getColorForDir = (dirId: string) => {
  if (!colorMap[dirId]) {
    colorMap[dirId] = palette[colorIndex % palette.length];
    colorIndex++;
  }
  return colorMap[dirId];
};

const typePalette: Record<string, string> = {
  '.ts': '#3178c6',
  '.tsx': '#3178c6',
  '.js': '#f7df1e',
  '.jsx': '#f7df1e',
  '.json': '#10b981',
  '.css': '#ec4899',
  '.html': '#e34c26',
  '.md': '#a1a1aa',
  'directory': '#ffffff',
  'default': '#8b5cf6'
};

const getExtension = (filename: string) => {
  const parts = filename.split('.');
  if (parts.length > 1) return '.' + parts.pop()?.toLowerCase();
  return 'default';
};

export default function RepoTreeGraph({ fileTree }: { fileTree: FileNode[] }) {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [colorMode, setColorMode] = useState<'folder' | 'type'>('folder');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Real file data state
  const [fileDetails, setFileDetails] = useState<{content: string, size: number, modified: number} | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Resize observer to keep canvas full width/height
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Root node
    const rootId = 'root';
    nodes.push({
      id: rootId,
      name: 'Repository Root',
      type: 'directory',
      val: 20, // larger size for root
      color: '#ffffff'
    });

    const traverse = (tree: FileNode[], parentId: string, parentFolderColor: string) => {
      tree.forEach((node) => {
        const id = `${parentId}/${node.name}`;
        const ext = node.type === 'file' ? getExtension(node.name) : 'directory';
        
        let folderColor = parentFolderColor;
        // Assign a new color if it's a top-level directory (children of root)
        if (parentId === rootId && node.type === 'directory') {
          folderColor = getColorForDir(id);
        }

        // Determine actual render color based on mode
        let renderColor = folderColor;
        if (colorMode === 'type') {
          renderColor = typePalette[ext] || typePalette['default'];
        }

        nodes.push({
          id,
          name: node.name,
          type: node.type,
          val: node.type === 'directory' ? 12 : 5,
          color: renderColor,
          extension: ext
        });

        links.push({
          source: parentId,
          target: id,
          color: renderColor
        });

        if (node.children) {
          traverse(node.children, id, folderColor);
        }
      });
    };

    traverse(fileTree, rootId, '#a1a1aa');

    return { nodes, links };
  }, [fileTree, colorMode]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // Check if node matches search query
    const isMatch = searchQuery ? node.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const isSelected = selectedNode?.id === node.id;
    
    // Dim non-matching nodes
    ctx.globalAlpha = isMatch ? 1 : 0.1;

    // Draw selection glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'; // cyan glow
      ctx.fill();
    }

    // Draw the circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Draw the label
    const label = node.name;
    const fontSize = Math.max(12 / globalScale, 2);
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // padding

    // Draw background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      node.x - bckgDimensions[0] / 2,
      node.y + node.val + 2,
      bckgDimensions[0],
      bckgDimensions[1]
    );

    // Draw text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, node.x, node.y + node.val + 2 + bckgDimensions[1] / 2);

    ctx.globalAlpha = 1; // Reset
  }, [searchQuery, selectedNode]);

  // Physics tuning and collision
  useEffect(() => {
    if (fgRef.current) {
      // Increase padding based on node size
      fgRef.current.d3Force('collide', forceCollide().radius((node: any) => node.val + 25).iterations(5));
      // Increase repulsion charge to push clusters apart
      fgRef.current.d3Force('charge').strength(-600);
      // Increase link distance so nodes aren't pulled too closely together
      fgRef.current.d3Force('link').distance(80);
      // Re-heat simulation to apply new forces
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  // Zoom to fit on load
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0 && !searchQuery && !selectedNode) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 50);
      }, 500);
    }
  }, [graphData]);

  // Removed auto-zoom effect on search query. Instead, handled by clicking search results.

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return graphData.nodes
      .filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10); // Limit to top 10 results
  }, [searchQuery, graphData]);

  const handleNodeClick = useCallback(async (node: any) => {
    setSelectedNode(node);
    setFileDetails(null);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(6, 1000);
    }

    if (node.type === 'file') {
      setIsLoadingDetails(true);
      try {
        const relativePath = node.id.replace(/^root\//, '');
        const res = await fetch(`http://localhost:8080/api/file/content?path=${encodeURIComponent(relativePath)}`);
        const data = await res.json();
        if (data.status === 'success') {
          setFileDetails({
            content: data.content,
            size: data.size,
            modified: data.modified
          });
        } else {
          setFileDetails({ content: 'Error loading file: ' + data.message, size: 0, modified: 0 });
        }
      } catch (err) {
        setFileDetails({ content: 'Failed to fetch file details.', size: 0, modified: 0 });
      } finally {
        setIsLoadingDetails(false);
      }
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#03010A] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
      
      {/* Top Bar (Search & Mode Toggle) */}
      <div className="absolute top-4 left-0 right-0 z-30 flex justify-between items-start px-6 pointer-events-none">
        
        {/* Empty left spacer */}
        <div className="w-[150px]"></div>

        {/* Search Bar */}
        <div className="pointer-events-auto">
          <div className="relative flex flex-col items-center">
            <div className="relative flex items-center w-full">
              <svg className="absolute left-4 w-4 h-4 text-cyan-400 z-10 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search file or folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2 w-[400px] bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all relative z-0"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] z-40">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      setSearchQuery(result.name);
                      handleNodeClick(result);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-b-0 transition-colors flex flex-col"
                  >
                    <span className="text-white font-medium">{result.name}</span>
                    <span className="text-gray-500 text-xs truncate w-full">{result.id}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] z-40 p-4 text-center text-sm text-gray-400">
                No matching files or folders found.
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 pointer-events-auto shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setColorMode('folder')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${colorMode === 'folder' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30' : 'text-gray-400 hover:text-white border border-transparent'}`}
          >
            By Folder
          </button>
          <button 
            onClick={() => setColorMode('type')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${colorMode === 'type' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30' : 'text-gray-400 hover:text-white border border-transparent'}`}
          >
            By File Type
          </button>
        </div>
      </div>

      {/* Legend (Only visible in 'type' mode) */}
      {colorMode === 'type' && (
        <div className="absolute bottom-6 left-6 z-30 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-4 text-xs shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
          <h4 className="text-white font-bold mb-3 border-b border-white/10 pb-2">File Types</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(typePalette).filter(([k]) => k !== 'default').map(([ext, color]) => (
              <div key={ext} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-gray-300">{ext}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel (Visible when a node is selected) */}
      <div className={`absolute top-0 right-0 h-full w-[350px] bg-black/80 backdrop-blur-xl border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 transition-transform duration-500 ease-in-out ${selectedNode ? 'translate-x-0' : 'translate-x-full'} pointer-events-auto flex flex-col`}>
        {selectedNode && (
          <>
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: selectedNode.color, color: selectedNode.color }}></div>
                  <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">{selectedNode.type}</span>
                </div>
                <h3 className="text-xl font-bold text-white break-all">{selectedNode.name}</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono break-all">{selectedNode.id}</p>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">AI Summary</h4>
                <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-3">
                  <p className="text-sm text-cyan-100/80 leading-relaxed">
                    {selectedNode.type === 'directory' 
                      ? `This directory acts as a structural module containing related logic and components for this segment of the codebase.`
                      : `This ${selectedNode.extension || 'file'} implements core logic for ${selectedNode.name}, exporting definitions and structures used elsewhere.`}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Metadata</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">Size</span>
                    <span>
                      {selectedNode.type === 'directory' 
                        ? 'N/A' 
                        : isLoadingDetails 
                          ? 'Loading...' 
                          : fileDetails 
                            ? `${(fileDetails.size / 1024).toFixed(1)} KB` 
                            : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">Last Modified</span>
                    <span>
                      {selectedNode.type === 'directory'
                        ? 'N/A'
                        : isLoadingDetails
                          ? 'Loading...'
                          : fileDetails
                            ? new Date(fileDetails.modified).toLocaleDateString()
                            : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedNode.type === 'file' && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preview</h4>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3 overflow-hidden">
                    {isLoadingDetails ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <pre className="text-[10px] text-gray-300 font-mono leading-relaxed opacity-90 overflow-x-auto whitespace-pre-wrap max-h-[300px] custom-scrollbar">
{fileDetails?.content || 'No preview available.'}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'after'}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val + 4, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        onNodeDragEnd={(node: any) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeClick={handleNodeClick}
        linkColor={(link: any) => link.color + '66'}
        linkWidth={1.5}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.008}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={100}
      />
    </div>
  );
}
