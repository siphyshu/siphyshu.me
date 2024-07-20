import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const colors = ['red', 'aqua', 'blue', 'green', 'skin', 'yellow'];

const HandprintCanvas = () => {
  const [handprints, setHandprints] = useState([]);
  const [hoveredHandprint, setHoveredHandprint] = useState(null);
  const [formPosition, setFormPosition] = useState(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [tempHandprint, setTempHandprint] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchHandprints();
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const containerWidth = canvas.parentElement.clientWidth;
    const maxWidth = 1400; // Increased max width
    const minWidth = 300;
    const aspectRatio = 7 / 2;

    let width = containerWidth - 40;
    width = Math.min(Math.max(width, minWidth), maxWidth);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${width / aspectRatio}px`;
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

  const handleCanvasHover = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCanvasClick = (e) => {
    if (formPosition) return; // Ignore clicks when form is open
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * 120 - 60;

    setTempHandprint({ x, y, color, angle });
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
      link: link || null
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
      toast.success("Your handprint has been forever imprinted!", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Error adding handprint:', error);
      setTempHandprint(null);
      toast.error("Failed to save your handprint. Please try again.", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const cancelHandprint = () => {
    setFormPosition(null);
    setTempHandprint(null);
  };

  return (
    <div className="w-full px-5 flex justify-center flex-col items-center">
      <div
        ref={canvasRef}
        className={`bg-gray-100 relative overflow-hidden ${formPosition ? 'cursor-default' : 'cursor-none'}`}
        style={{
          maxWidth: '1400px', // Increased max width
          minWidth: '300px',
          aspectRatio: '7 / 2',
        }}
        onMouseMove={handleCanvasHover}
        onClick={handleCanvasClick}
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
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 whitespace-nowrap">
                {handprint.name}
                {handprint.link && <span className="ml-1">🔗</span>}
              </div>
            )}
          </div>
        ))}
        {!formPosition && (
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
      </div>
      {formPosition && (
        <div
          className="absolute bg-white border border-gray-300 shadow-md"
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
              className="block w-full mb-2 px-2 py-1 border border-gray-300"
            />
            <input
              type="text"
              placeholder="Link (Optional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="block w-full mb-2 px-2 py-1 border border-gray-300"
            />
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 hover:bg-gray-800"
              >
                Imprint!
              </button>
              <button
                type="button"
                onClick={cancelHandprint}
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