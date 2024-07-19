'use client'

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const HandprintCanvas = () => {
  const [handprints, setHandprints] = useState([]);
  const [name, setName] = useState('');
  const [hoveredHandprint, setHoveredHandprint] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchHandprints();
  }, []);

  const fetchHandprints = async () => {
    const response = await fetch('/api/handprints');
    const data = await response.json();
    setHandprints(data);
  };

  const addHandprint = async () => {
    if (!name) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    const angle = Math.random() * 360;

    const newHandprint = { name, x, y, color, angle };

    const response = await fetch('/api/handprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHandprint),
    });

    if (response.ok) {
      setHandprints([...handprints, newHandprint]);
      setName('');
    }
  };

  return (
    <div className="w-full max-w-3xl aspect-[3/2] sm:aspect-square relative">
      <div ref={canvasRef} className="w-full h-full bg-gray-100 relative overflow-hidden">
        {handprints.map((handprint, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${handprint.x}px`,
              top: `${handprint.y}px`,
              transform: `rotate(${handprint.angle}deg)`,
            }}
            onMouseEnter={() => setHoveredHandprint(handprint)}
            onMouseLeave={() => setHoveredHandprint(null)}
          >
            <Image
              src="/handprint.svg"
              width={50}
              height={50}
              alt="Handprint"
              style={{ filter: `hue-rotate(${handprint.color}deg)` }}
            />
            {hoveredHandprint === handprint && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded">
                {handprint.name}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="border p-2 mr-2"
        />
        <button onClick={addHandprint} className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Handprint
        </button>
      </div>
    </div>
  );
};

export default HandprintCanvas;