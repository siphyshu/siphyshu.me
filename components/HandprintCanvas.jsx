import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HandprintForm from "./HandprintForm";

const COLORS = {
  blue: "#8AC3FF",
  aqua: "#62DDBD",
  red: "#F096A4",
  green: "#C3E798",
  yellow: "#FADFA4",
  skin: "#F4D0B5",
};

const MIN_WIDTH = 300;
const MAX_WIDTH = 1200;
const MIN_HEIGHT = 250;
const CANVAS_PADDING = 50;

const HandprintCanvas = () => {
  const [handprints, setHandprints] = useState([]);
  const [hoveredHandprint, setHoveredHandprint] = useState(null);
  const [formPosition, setFormPosition] = useState(null);
  const [tempHandprint, setTempHandprint] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(true);
  const [canvasSize, setCanvasSize] = useState({
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  });
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchHandprints();
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSelectedColor(
      Object.keys(COLORS)[
        Math.floor(Math.random() * Object.keys(COLORS).length)
      ]
    );
  }, []);

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = Math.min(Math.max(document.body.clientWidth, MIN_WIDTH), MAX_WIDTH) - CANVAS_PADDING;
    setCanvasSize({ width, height: MIN_HEIGHT });
  };

  const fetchHandprints = async () => {
    try {
      const response = await fetch("/api/handprints");
      if (!response.ok) throw new Error("Failed to fetch handprints");
      const data = await response.json();
      setHandprints(data);
    } catch (error) {
      console.error("Error fetching handprints:", error);
      toast.error("Failed to load handprints. Please refresh the page.");
    }
  };

  const handleCanvasHover = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPosition({ x, y });

    // Check if hovering over a handprint
    const isOverHandprint = handprints.some(handprint => {
      const handprintX = (handprint.x / 100) * canvasSize.width;
      const handprintY = (handprint.y / 100) * canvasSize.height;
      return Math.abs(x - handprintX) < 15 && Math.abs(y - handprintY) < 15;
    });

    setShowCursor(!isOverHandprint && !formPosition);
  };

  const handleCanvasClick = (e) => {
    if (formPosition) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercentage = (x / canvasSize.width) * 100;
    const yPercentage = (y / canvasSize.height) * 100;
    const angle = Math.random() * 120 - 60;

    setTempHandprint({
      x: xPercentage,
      y: yPercentage,
      color: selectedColor,
      angle,
    });
    setFormPosition({ x: e.clientX, y: e.clientY });
  };

  const handleSubmit = async (formData) => {
    if (!tempHandprint) return;

    const newHandprint = {
      ...tempHandprint,
      ...formData,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/handprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHandprint),
      });

      if (!response.ok) throw new Error("Failed to save handprint");

      setHandprints((prev) => [...prev, newHandprint]);
      setFormPosition(null);
      setTempHandprint(null);
      toast.success("30,000 years later, we still say: 'I was here.'", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className:
          "bg-red-50 bg-opacity-2 border border-black text-black font-serif",
      });
    } catch (error) {
      console.error("Error adding handprint:", error);
      toast.error("Failed to leave a mark. It's okay, try again later.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className:
          "bg-red-50 bg-opacity-2 border border-black text-black font-serif",
      });
    }
  };

  const getLabelPosition = (handprint) => {
    const LABEL_MARGIN = 10;
    let labelStyle = {
      position: 'absolute',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    };

    if (handprint.y < 20) {
      labelStyle.top = '100%';
      labelStyle.marginTop = '5px';
    } else {
      labelStyle.bottom = '100%';
      labelStyle.marginBottom = '5px';
    }

    if (handprint.x < LABEL_MARGIN) {
      labelStyle.left = '0';
    } else if (handprint.x > 100 - LABEL_MARGIN) {
      labelStyle.right = '0';
    } else {
      labelStyle.left = '50%';
      labelStyle.transform = 'translateX(-50%)';
    }

    return labelStyle;
  };

  const formatLink = (link) => {
    if (!link) return "";
    return link.replace(/^https?:\/\//, '').replace(/^www\./, '');
  };

  return (
    <div className="w-full px-5 flex justify-center flex-col items-center">
      <p className="text-sm italic text-gray-600 mb-4 text-center w-full">
        From cave walls to pixels: the human urge to leave a trace endures. 🖐️
      </p>
      
      <div
        ref={canvasRef}
        className="bg-gray-100 relative overflow-hidden cursor-none"
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasHover}
        onMouseLeave={() => setShowCursor(false)}
      >
        {[...handprints, tempHandprint]
          .filter(Boolean)
          .map((handprint, index) => {
            const labelStyle = getLabelPosition(handprint);
            return (
              <div
                key={index}
                className={`absolute ${handprint.link ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  left: `${handprint.x}%`,
                  top: `${handprint.y}%`,
                  transform: `translate(-50%, -50%) rotate(${handprint.angle}deg)`,
                }}
                onMouseEnter={() => setHoveredHandprint(handprint)}
                onMouseLeave={() => setHoveredHandprint(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (handprint.link) window.open(handprint.link, "_blank");
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
                    className="bg-red-50 bg-opacity-2 border border-black text-black px-2 py-1 font-serif"
                    style={{
                      ...labelStyle,
                      transform: `${labelStyle.transform || ''} rotate(${-handprint.angle}deg)`,
                    }}
                  >
                    {handprint.name}
                    {handprint.link && (
                      <span className="ml-1 text-xs">
                        ({formatLink(handprint.link)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {showCursor && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
              transform: "translate(-50%, -50%)",
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

        {handprints.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-red-50 bg-opacity-2 border border-black p-1">
            <p className="text-sm font-serif">{handprints.length} were here</p>
          </div>
        )}
      </div>

      {formPosition && (
        <HandprintForm
          position={formPosition}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormPosition(null);
            setTempHandprint(null);
          }}
          availableColors={COLORS}
          tempHandprint={tempHandprint}
        />
      )}
      
      <ToastContainer />
    </div>
  );
};

export default HandprintCanvas;