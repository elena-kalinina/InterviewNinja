import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
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
  const fabricRef = useRef(null);
  const containerRef = useRef(null);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPointRef = useRef(null);
  const tempShapeRef = useRef(null);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#0f172a',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      const container = containerRef.current;
      if (container && canvas) {
        canvas.setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        canvas.renderAll();
      }
    };

    // Delay initial resize to ensure container has dimensions
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Handle tool change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = activeTool === 'select';
    
    canvas.getObjects().forEach((obj) => {
      obj.selectable = activeTool === 'select';
      obj.evented = activeTool === 'select';
    });

    canvas.renderAll();
  }, [activeTool]);

  // Create arrow shape
  const createArrow = useCallback((x1, y1, x2, y2, color) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;

    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: color,
      strokeWidth: 2,
      selectable: false,
    });

    const head = new fabric.Triangle({
      left: x2,
      top: y2,
      width: headLength,
      height: headLength,
      fill: color,
      angle: (angle * 180) / Math.PI + 90,
      originX: 'center',
      originY: 'center',
      selectable: false,
    });

    return new fabric.Group([line, head], {
      selectable: true,
    });
  }, []);

  // Handle mouse events for drawing shapes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleMouseDown = (options) => {
      if (activeTool === 'select') return;
      
      const pointer = canvas.getPointer(options.e);
      startPointRef.current = { x: pointer.x, y: pointer.y };
      setIsDrawing(true);

      if (activeTool === 'text') {
        const text = new fabric.IText('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 18,
          fill: activeColor,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        setActiveTool('select');
      }
    };

    const handleMouseMove = (options) => {
      if (!isDrawing || !startPointRef.current) return;
      if (activeTool === 'select' || activeTool === 'text') return;

      const pointer = canvas.getPointer(options.e);
      const start = startPointRef.current;

      // Remove temporary shape if exists
      if (tempShapeRef.current) {
        canvas.remove(tempShapeRef.current);
        tempShapeRef.current = null;
      }

      let shape;

      if (activeTool === 'rectangle') {
        const width = pointer.x - start.x;
        const height = pointer.y - start.y;
        shape = new fabric.Rect({
          left: width > 0 ? start.x : pointer.x,
          top: height > 0 ? start.y : pointer.y,
          width: Math.abs(width),
          height: Math.abs(height),
          fill: 'transparent',
          stroke: activeColor,
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          selectable: false,
          evented: false,
        });
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2)
        ) / 2;
        shape = new fabric.Circle({
          left: (start.x + pointer.x) / 2 - radius,
          top: (start.y + pointer.y) / 2 - radius,
          radius: radius,
          fill: 'transparent',
          stroke: activeColor,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
      } else if (activeTool === 'arrow') {
        shape = createArrow(start.x, start.y, pointer.x, pointer.y, activeColor);
        shape.selectable = false;
        shape.evented = false;
      }

      if (shape) {
        tempShapeRef.current = shape;
        canvas.add(shape);
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      // Make temp shape permanent
      if (tempShapeRef.current) {
        tempShapeRef.current.selectable = activeTool === 'select';
        tempShapeRef.current.evented = activeTool === 'select';
        tempShapeRef.current = null;
      }

      startPointRef.current = null;
      const canvas = fabricRef.current;
      if (canvas) canvas.renderAll();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [activeTool, activeColor, isDrawing, createArrow]);

  const handleDelete = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handleClear = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#0f172a';
    canvas.renderAll();
  };

  const handleZoom = (direction) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let zoom = canvas.getZoom();
    zoom = direction === 'in' ? zoom * 1.1 : zoom / 1.1;
    zoom = Math.min(Math.max(zoom, 0.5), 3);
    canvas.setZoom(zoom);
    canvas.renderAll();
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
                activeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-navy-900' : ''
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
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} />
      </div>

      {/* Instructions */}
      <div className="px-4 py-2 text-xs text-gray-500 border-t border-white/10">
        {activeTool === 'select' && 'Click to select objects. Drag to move.'}
        {activeTool === 'rectangle' && 'Click and drag to draw a rectangle.'}
        {activeTool === 'circle' && 'Click and drag to draw a circle.'}
        {activeTool === 'arrow' && 'Click and drag to draw an arrow.'}
        {activeTool === 'text' && 'Click to add text. Double-click to edit.'}
      </div>
    </div>
  );
}
