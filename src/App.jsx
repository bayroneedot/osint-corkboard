import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// Utility functions
const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const CANVAS_BOUNDS = { width: 4000, height: 3000 };
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

function App() {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const canvasRef = useRef(null);
  const isPanning = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('osint-board-state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setNodes(data.nodes || []);
        setConnections(data.connections || []);
      } catch (e) {
        console.error('Failed to load saved state');
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const state = { nodes, connections };
    localStorage.setItem('osint-board-state', JSON.stringify(state));
  }, [nodes, connections]);

  // Add to history for undo/redo
  const addToHistory = useCallback(() => {
    const newState = { nodes: [...nodes], connections: [...connections] };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, connections, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setConnections(prevState.connections);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const addNode = (type, x, y) => {
    // Check bounds
    if (x < 0 || x > CANVAS_BOUNDS.width || y < 0 || y > CANVAS_BOUNDS.height) {
      setShowUpgradeModal(true);
      return;
    }

    const newNode = {
      id: generateId(),
      type,
      x,
      y,
      width: 200,
      height: 150,
      data: { title: `New ${type}`, content: '' }
    };
    
    setNodes([...nodes, newNode]);
    addToHistory();
  };

  const updateNode = (id, updates) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
    addToHistory();
  };

  const addConnection = (from, to) => {
    if (from === to) return;
    const exists = connections.find(c => 
      (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    if (!exists) {
      setConnections([...connections, { 
        id: generateId(), 
        from, 
        to, 
        label: '' 
      }]);
      addToHistory();
    }
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedNodes([]);
      setConnectingFrom(null);
      setContextMenu(null);
    }
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    setContextMenu({ x: e.clientX, y: e.clientY, canvasX: x, canvasY: y });
  };

  const handleNodeClick = (id, e) => {
    e.stopPropagation();
    
    if (connectingFrom) {
      addConnection(connectingFrom, id);
      setConnectingFrom(null);
    } else {
      setSelectedNodes([id]);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * delta));
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (e.target === canvasRef.current && e.button === 0) {
      isPanning.current = true;
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning.current) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newNode = {
            id: generateId(),
            type: 'image',
            x,
            y,
            width: 200,
            height: 200,
            data: { title: file.name, imageUrl: event.target.result }
          };
          setNodes([...nodes, newNode]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🔍 OSINT Detective Board</h1>
        <div className="header-controls">
          <button onClick={undo} disabled={historyIndex <= 0}>↶ Undo</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1}>↷ Redo</button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
        </div>
      </header>

      {/* Ad Placeholder Top Left */}
      <div className="ad-container ad-top-left">
        <div className="ad-placeholder">Ad Space 728x90</div>
      </div>

      {/* Main Canvas */}
      <div 
        className="canvas-wrapper"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div
          ref={canvasRef}
          className="canvas"
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasContextMenu}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: CANVAS_BOUNDS.width,
            height: CANVAS_BOUNDS.height
          }}
        >
          {/* Canvas boundary indicator */}
          <div className="canvas-boundary"></div>

          {/* Render Connections */}
          <svg className="connections-layer" style={{ width: CANVAS_BOUNDS.width, height: CANVAS_BOUNDS.height }}>
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + fromNode.width / 2;
              const y1 = fromNode.y + fromNode.height / 2;
              const x2 = toNode.x + toNode.width / 2;
              const y2 = toNode.y + toNode.height / 2;

              return (
                <g key={conn.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className="connection-line"
                  />
                  {conn.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2}
                      className="connection-label"
                      textAnchor="middle"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render Nodes */}
          {nodes.map(node => (
            <Node
              key={node.id}
              node={node}
              isSelected={selectedNodes.includes(node.id)}
              onClick={(e) => handleNodeClick(node.id, e)}
              onUpdate={(updates) => updateNode(node.id, updates)}
              onDelete={() => deleteNode(node.id)}
              onConnect={() => setConnectingFrom(node.id)}
              zoom={zoom}
            />
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div onClick={() => { addNode('note', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }}>
            📝 Add Note
          </div>
          <div onClick={() => { addNode('link', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }}>
            🔗 Add Link
          </div>
          <div onClick={() => { addNode('image', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }}>
            🖼️ Add Image
          </div>
          <div onClick={() => { addNode('person', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }}>
            👤 Add Person
          </div>
          <div onClick={() => { addNode('location', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }}>
            📍 Add Location
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🚀 Upgrade to Expand Your Board</h2>
            <p>You've reached the free plan boundary. Upgrade to unlock unlimited canvas space!</p>
            <button onClick={() => setShowUpgradeModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Ad Placeholder Bottom Right */}
      <div className="ad-container ad-bottom-right">
        <div className="ad-placeholder">Ad Space 300x250</div>
      </div>

      {/* Minimap */}
      <Minimap nodes={nodes} pan={pan} zoom={zoom} bounds={CANVAS_BOUNDS} />
    </div>
  );
}

// Node Component
function Node({ node, isSelected, onClick, onUpdate, onDelete, onConnect, zoom }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.button === 0 && !isEditing) {
      setIsDragging(true);
      const rect = nodeRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX / zoom) - node.x,
        y: (e.clientY / zoom) - node.y
      });
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = (e.clientX / zoom) - dragOffset.x;
      const newY = (e.clientY / zoom) - dragOffset.y;
      onUpdate({ x: newX, y: newY });
    }
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

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={nodeRef}
      className={`node node-${node.type} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div className="node-pin"></div>
      
      <div className="node-header">
        <input
          type="text"
          value={node.data.title}
          onChange={(e) => onUpdate({ data: { ...node.data, title: e.target.value }})}
          className="node-title"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="node-actions">
          <button onClick={(e) => { e.stopPropagation(); onConnect(); }} title="Connect">🔗</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">×</button>
        </div>
      </div>

      <div className="node-content">
        {node.type === 'note' && (
          <textarea
            value={node.data.content || ''}
            onChange={(e) => onUpdate({ data: { ...node.data, content: e.target.value }})}
            placeholder="Type your notes here..."
            onClick={(e) => e.stopPropagation()}
          />
        )}
        
        {node.type === 'link' && (
          <div>
            <input
              type="url"
              value={node.data.url || ''}
              onChange={(e) => onUpdate({ data: { ...node.data, url: e.target.value }})}
              placeholder="https://..."
              onClick={(e) => e.stopPropagation()}
            />
            {node.data.url && (
              <a href={node.data.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                🔗 Visit Link
              </a>
            )}
          </div>
        )}
        
        {node.type === 'image' && (
          <div>
            {node.data.imageUrl ? (
              <img src={node.data.imageUrl} alt={node.data.title} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      onUpdate({ data: { ...node.data, imageUrl: event.target.result }});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}
        
        {node.type === 'person' && (
          <div>
            <input
              type="text"
              value={node.data.aliases || ''}
              onChange={(e) => onUpdate({ data: { ...node.data, aliases: e.target.value }})}
              placeholder="Aliases..."
              onClick={(e) => e.stopPropagation()}
            />
            <textarea
              value={node.data.description || ''}
              onChange={(e) => onUpdate({ data: { ...node.data, description: e.target.value }})}
              placeholder="Description..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        
        {node.type === 'location' && (
          <div>
            <input
              type="text"
              value={node.data.location || ''}
              onChange={(e) => onUpdate({ data: { ...node.data, location: e.target.value }})}
              placeholder="Location name..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Minimap Component
function Minimap({ nodes, pan, zoom, bounds }) {
  const minimapWidth = 200;
  const minimapHeight = 150;
  const scale = minimapWidth / bounds.width;

  return (
    <div className="minimap" style={{ width: minimapWidth, height: minimapHeight }}>
      <div className="minimap-viewport">
        {nodes.map(node => (
          <div
            key={node.id}
            className="minimap-node"
            style={{
              left: node.x * scale,
              top: node.y * scale,
              width: node.width * scale,
              height: node.height * scale
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
