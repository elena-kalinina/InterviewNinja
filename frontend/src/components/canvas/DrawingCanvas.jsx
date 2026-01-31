import { useEffect, useRef, useState } from 'react';
import { 
  Square, 
  Circle, 
  ArrowRight, 
  Type, 
  MousePointer, 
  Trash2, 
  RotateCcw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const TOOLS = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text' },
];

const COLORS = [
  '#3b82f6', // Electric blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#64748b', // Slate
];

export default function DrawingCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [zoom, setZoom] = useState(1);

  // Get canvas dimensions
  const getCanvasSize = () => {
    if (containerRef.current) {
      return {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      };
    }
    return { width: 800, height: 600 };
  };

  // Draw all shapes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasSize();
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear and set background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    // Apply zoom
    ctx.save();
    ctx.scale(zoom, zoom);
    
    // Draw all shapes
    shapes.forEach((shape, index) => {
      drawShape(ctx, shape, index === selectedShape);
    });
    
    // Draw current shape being created
    if (currentShape) {
      drawShape(ctx, currentShape, false);
    }
    
    ctx.restore();
  }, [shapes, currentShape, selectedShape, zoom]);

  const drawShape = (ctx, shape, isSelected) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = 2;
    
    if (isSelected) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
    }

    switch (shape.type) {
      case 'rectangle':
        ctx.beginPath();
        ctx.roundRect(shape.x, shape.y, shape.width, shape.height, 8);
        ctx.stroke();
        if (shape.text) {
          ctx.fillStyle = shape.color;
          ctx.font = '14px Plus Jakarta Sans';
          ctx.textAlign = 'center';
          ctx.fillText(shape.text, shape.x + shape.width / 2, shape.y + shape.height / 2 + 5);
        }
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        ctx.stroke();
        if (shape.text) {
          ctx.fillStyle = shape.color;
          ctx.font = '14px Plus Jakarta Sans';
          ctx.textAlign = 'center';
          ctx.fillText(shape.text, shape.x, shape.y + 5);
        }
        break;
        
      case 'arrow':
        // Draw line
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
        const headLength = 15;
        ctx.beginPath();
        ctx.moveTo(shape.x2, shape.y2);
        ctx.lineTo(
          shape.x2 - headLength * Math.cos(angle - Math.PI / 6),
          shape.y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(shape.x2, shape.y2);
        ctx.lineTo(
          shape.x2 - headLength * Math.cos(angle + Math.PI / 6),
          shape.y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        
        // Draw label if exists
        if (shape.text) {
          const midX = (shape.x1 + shape.x2) / 2;
          const midY = (shape.y1 + shape.y2) / 2;
          ctx.fillStyle = shape.color;
          ctx.font = '12px Plus Jakarta Sans';
          ctx.textAlign = 'center';
          ctx.fillText(shape.text, midX, midY - 10);
        }
        break;
        
      case 'text':
        ctx.fillStyle = shape.color;
        ctx.font = '16px Plus Jakarta Sans';
        ctx.textAlign = 'left';
        ctx.fillText(shape.text || 'Text', shape.x, shape.y);
        break;
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (activeTool === 'select') {
      // Find clicked shape
      const clickedIndex = shapes.findIndex(shape => isPointInShape(pos, shape));
      setSelectedShape(clickedIndex >= 0 ? clickedIndex : null);
      return;
    }
    
    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setShapes([...shapes, {
          type: 'text',
          x: pos.x,
          y: pos.y,
          text,
          color: activeColor
        }]);
      }
      return;
    }
    
    setIsDrawing(true);
    setStartPoint(pos);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;
    
    const pos = getMousePos(e);
    
    if (activeTool === 'rectangle') {
      setCurrentShape({
        type: 'rectangle',
        x: Math.min(startPoint.x, pos.x),
        y: Math.min(startPoint.y, pos.y),
        width: Math.abs(pos.x - startPoint.x),
        height: Math.abs(pos.y - startPoint.y),
        color: activeColor
      });
    } else if (activeTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(pos.x - startPoint.x, 2) + Math.pow(pos.y - startPoint.y, 2)
      );
      setCurrentShape({
        type: 'circle',
        x: startPoint.x,
        y: startPoint.y,
        radius,
        color: activeColor
      });
    } else if (activeTool === 'arrow') {
      setCurrentShape({
        type: 'arrow',
        x1: startPoint.x,
        y1: startPoint.y,
        x2: pos.x,
        y2: pos.y,
        color: activeColor
      });
    }
  };

  const handleMouseUp = () => {
    if (currentShape) {
      setShapes([...shapes, currentShape]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
    setStartPoint(null);
  };

  const isPointInShape = (point, shape) => {
    switch (shape.type) {
      case 'rectangle':
        return point.x >= shape.x && point.x <= shape.x + shape.width &&
               point.y >= shape.y && point.y <= shape.y + shape.height;
      case 'circle':
        const dist = Math.sqrt(Math.pow(point.x - shape.x, 2) + Math.pow(point.y - shape.y, 2));
        return dist <= shape.radius;
      case 'text':
        return point.x >= shape.x && point.x <= shape.x + 100 &&
               point.y >= shape.y - 20 && point.y <= shape.y + 10;
      case 'arrow':
        // Simplified hit detection for arrows
        const midX = (shape.x1 + shape.x2) / 2;
        const midY = (shape.y1 + shape.y2) / 2;
        return Math.sqrt(Math.pow(point.x - midX, 2) + Math.pow(point.y - midY, 2)) < 20;
      default:
        return false;
    }
  };

  const handleDelete = () => {
    if (selectedShape !== null) {
      setShapes(shapes.filter((_, i) => i !== selectedShape));
      setSelectedShape(null);
    }
  };

  const handleClear = () => {
    setShapes([]);
    setSelectedShape(null);
  };

  const handleZoom = (direction) => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(newZoom, 0.5), 3);
    });
  };

  const handleDoubleClick = (e) => {
    if (selectedShape !== null) {
      const shape = shapes[selectedShape];
      const text = prompt('Enter text:', shape.text || '');
      if (text !== null) {
        const newShapes = [...shapes];
        newShapes[selectedShape] = { ...shape, text };
        setShapes(newShapes);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        {/* Tools */}
        <div className="flex gap-1 canvas-toolbar">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
                title={tool.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Colors */}
        <div className="flex gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                activeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <button
            onClick={() => handleZoom('out')}
            className="tool-button"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleZoom('in')}
            className="tool-button"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="tool-button"
            title="Delete Selected"
            disabled={selectedShape === null}
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="tool-button text-red-400 hover:text-red-300"
            title="Clear Canvas"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className="absolute inset-0"
        />
      </div>

      {/* Instructions */}
      <div className="px-4 py-2 text-xs text-gray-500 border-t border-white/10">
        {activeTool === 'select' && 'Click to select. Double-click to add text to shapes.'}
        {activeTool === 'rectangle' && 'Click and drag to draw a rectangle.'}
        {activeTool === 'circle' && 'Click and drag to draw a circle.'}
        {activeTool === 'arrow' && 'Click and drag to draw an arrow.'}
        {activeTool === 'text' && 'Click to add text.'}
      </div>
    </div>
  );
}
