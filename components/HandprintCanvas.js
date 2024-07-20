import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const colors = {
  blue: '#8AC3FF',
  aqua: '#62DDBD',
  red: '#F096A4',
  green: '#C3E798',
  yellow: '#FADFA4',
  skin: '#F4D0B5'
};

const HandprintCanvas = () => {
  const [handprints, setHandprints] = useState([]);
  const [hoveredHandprint, setHoveredHandprint] = useState(null);
  const [formPosition, setFormPosition] = useState(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [tempHandprint, setTempHandprint] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1400, height: 300 });
  const [selectedColor, setSelectedColor] = useState(null);
  const [isPlacingHandprint, setIsPlacingHandprint] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchHandprints();
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSelectedColor(Object.keys(colors)[Math.floor(Math.random() * Object.keys(colors).length)]);
  }, []);

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const containerWidth = canvas.parentElement.clientWidth;
    const maxWidth = 1400;
    const minWidth = 300;

    let width = containerWidth - 40;
    width = Math.min(Math.max(width, minWidth), maxWidth);

    let height = width / 4.67; 

    if (width < 700) {
      const extraHeight = (700 - width) / 2.67; 
      height += extraHeight;
    }

    height = Math.min(height, width * 0.75); 

    setCanvasSize({ width, height });
  };

  const fetchHandprints = async () => {
    try {
      const response = await fetch('/api/handprints');
      if (!response.ok) throw new Error('Failed to fetch handprints');
      const data = await response.json();
      setHandprints(data);
    } catch (error) {
      console.error('Error fetching handprints:', error);
      toast.error('Failed to load handprints. Please refresh the page.');
    }
  };

  const calculateRelativePosition = (clientX, clientY, scale, positionX, positionY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - positionX) / scale;
    const y = (clientY - rect.top - positionY) / scale;
    return { x, y };
  };

  const handleCanvasHover = (e, scale = 1, positionX = 0, positionY = 0) => {
    if (!canvasRef.current) return;
    const { x, y } = calculateRelativePosition(e.clientX, e.clientY, scale, positionX, positionY);
    setCursorPosition({ x, y });
  };

  const handleCanvasClick = (e, scale = 1, positionX = 0, positionY = 0) => {
    if (formPosition) return;
    const { x, y } = calculateRelativePosition(e.clientX, e.clientY, scale, positionX, positionY);
    
    const xPercentage = (x / canvasSize.width) * 100;
    const yPercentage = (y / canvasSize.height) * 100;
    
    const angle = Math.random() * 120 - 60;

    setTempHandprint({ x: xPercentage, y: yPercentage, color: selectedColor, angle });
    setFormPosition({ x: e.clientX, y: e.clientY });
    setName('');
    setLink('');
  };

  const addHandprint = async (e) => {
    e.preventDefault();
    if (!tempHandprint) return;

    const newHandprint = {
      ...tempHandprint,
      name: name || "Anonymous",
      link: link || null,
      color: selectedColor
    };

    try {
      const response = await fetch('/api/handprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHandprint),
      });

      if (!response.ok) throw new Error('Failed to save handprint');

      setHandprints(prevHandprints => [...prevHandprints, newHandprint]);
      setFormPosition(null);
      setTempHandprint(null);
      setIsPlacingHandprint(false); // Set to false after placing handprint
      toast.success("30,000 years later, we still say: 'I was here.'", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className: "bg-red-50 bg-opacity-2 border border-black text-black font-serif",
      });
    } catch (error) {
      console.error('Error adding handprint:', error);
      setTempHandprint(null);
      toast.error("Failed to leave a mark. It's okay, some other time.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className: "bg-red-50 bg-opacity-2 border border-black text-black font-serif",
      });
    }
  };

  const cancelHandprint = () => {
    setFormPosition(null);
    setTempHandprint(null);
  };

  return (
    <div className="w-full px-5 flex justify-center flex-col items-center">
      <p className="text-sm italic text-gray-600 mb-4">
        From cave walls to pixels: the human urge to leave a trace endures. 🖐️
      </p>
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <React.Fragment>
            <TransformComponent>
              <div
                ref={canvasRef}
                className={`bg-gray-100 relative overflow-hidden ${isPlacingHandprint ? 'cursor-none' : 'cursor-default'}`}
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                }}
                onClick={(e) => {
                  if (isPlacingHandprint) {
                    handleCanvasClick(e, rest.state?.scale || 1, rest.state?.positionX || 0, rest.state?.positionY || 0);
                  }
                }}
                onMouseMove={(e) => handleCanvasHover(e, rest.state?.scale || 1, rest.state?.positionX || 0, rest.state?.positionY || 0)}
              >
                {[...handprints, tempHandprint].filter(Boolean).map((handprint, index) => (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${handprint.x}%`,
                      top: `${handprint.y}%`,
                      transform: `translate(-50%, -50%) rotate(${handprint.angle}deg)`,
                    }}
                    onMouseEnter={() => setHoveredHandprint(handprint)}
                    onMouseLeave={() => setHoveredHandprint(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (handprint.link) window.open(handprint.link, '_blank');
                    }}
                  >
                    <Image
                      src={`/handprints/${handprint.color}.svg`}
                      width={30}
                      height={30}
                      alt="Handprint"
                    />
                    {hoveredHandprint === handprint && handprint.name && (
                      <div 
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-red-50 bg-opacity-2 border border-black text-black px-2 py-1 whitespace-nowrap font-serif"
                        style={{ 
                          transform: `translate(-50%, -100%) scale(${1 / (rest.state?.scale || 1)}) rotate(${-handprint.angle}deg)`,
                          transformOrigin: 'center bottom'
                        }}
                      >
                        {handprint.name}
                        {handprint.link && <span className="ml-1">🔗</span>}
                      </div>
                    )}
                  </div>
                ))}
                {isPlacingHandprint && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${cursorPosition.x}px`,
                      top: `${cursorPosition.y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Image
                      src="/handprints/black.svg"
                      width={30}
                      height={30}
                      alt="Cursor"
                    />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex bg-red-50 bg-opacity-2 border border-black p-1">
                  <button onClick={(e) => { e.stopPropagation(); zoomIn(); }} className="mr-1">
                    <ZoomIn size={20} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); zoomOut(); }} className="mr-1">
                    <ZoomOut size={20} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); resetTransform(); }}>
                    <Maximize size={20} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-red-50 bg-opacity-2 border border-black p-1">
                  <p className="text-sm font-serif">{handprints.length} 🖐️</p>
                </div>
              </div>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
      {formPosition && (
        <div
          className="absolute bg-white border border-black shadow-md"
          style={{
            left: `${formPosition.x}px`,
            top: `${formPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <form onSubmit={addHandprint} className="p-4">
            <input
              type="text"
              placeholder="Name / Alias"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full mb-2 px-2 py-1 border border-black"
            />
            <input
              type="text"
              placeholder="Link (Optional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="block w-full mb-2 px-2 py-1 border border-black"
            />
            <div className="flex justify-between items-center mb-2">
              <div className="flex justify-between w-full">
                {Object.entries(colors).map(([key, value]) => (
                  <div
                    key={key}
                    className={`w-6 h-6 cursor-pointer ${selectedColor === key ? 'ring-2 ring-black' : ''}`}
                    style={{ backgroundColor: value }}
                    onClick={() => setSelectedColor(key)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 hover:bg-gray-800"
              >
                Imprint!
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelHandprint();
                  setIsPlacingHandprint(true);
                }}
                className="bg-gray-300 text-black px-4 py-2 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default HandprintCanvas;