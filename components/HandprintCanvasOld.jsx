import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

// handprint colors
const COLORS = {
  blue: "#8AC3FF",
  aqua: "#62DDBD",
  red: "#F096A4",
  green: "#C3E798",
  yellow: "#FADFA4",
  skin: "#F4D0B5",
};

// canvas sizes
const MIN_WIDTH = 300;
const MAX_WIDTH = 1200;
const MIN_HEIGHT = 250;
const CANVAS_PADDING = 50;

const HandprintCanvas = () => {
  const [handprints, setHandprints] = useState([]);
  const [hoveredHandprint, setHoveredHandprint] = useState(null);
  const [formPosition, setFormPosition] = useState(null);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [tempHandprint, setTempHandprint] = useState(null);
  const [canvasSize, setCanvasSize] = useState({
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  });
  const [selectedColor, setSelectedColor] = useState(null);
  const [isPlacingHandprint, setIsPlacingHandprint] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const canvasRef = useRef(null);

  // why are these 2 useEffects separated? 
  // TODO: check if they can be combined for brevity
  useEffect(() => {
    console.log("fetching handprints");
    fetchHandprints();
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSelectedColor(
      Object.keys(COLORS)[
        Math.floor(Math.random() * Object.keys(COLORS).length)
      ]
    );
  }, []);

  // why are we explicitly handling resize? can't we use CSS for this?
  // TODO: check if CSS can be used for resizing
  const handleResize = () => {
    // check canvas rendered
    const canvas = canvasRef.current;
    if (!canvas) return;

    // calculate canvas width
    let width = MIN_WIDTH;
    const screenWidth = document.body.clientWidth;
    if (screenWidth > MIN_WIDTH) width = screenWidth;
    if (width > MAX_WIDTH) width = MAX_WIDTH;
    width -= CANVAS_PADDING;

    // calculate height
    let height = MIN_HEIGHT;

    setCanvasSize({ width, height });
  };

  // why are we fetching handprints here from the API every time? can't we cache this data?
  // TODO: check if we can cache this data
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

  const calculateRelativePosition = (
    clientX,
    clientY,
    scale,
    positionX,
    positionY
  ) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - positionX) / scale;
    const y = (clientY - rect.top - positionY) / scale;
    return { x, y };
  };

  // instead of passing scale, positionX, positionY, can we use state for this?
  // also, is this causing the cursor offset bug?
  // TODO: check if we can use state for scale, positionX, positionY
  // TODO: examine logic for this function to see if it's causing cursor offset bug
  const handleCanvasHover = (e, scale = 1, positionX = 0, positionY = 0) => {
    if (!canvasRef.current) return;
    const { x, y } = calculateRelativePosition(
      e.clientX,
      e.clientY,
      scale,
      positionX,
      positionY
    );
    setCursorPosition({ x, y });
    
    // Check if hovering over a handprint
    const isOverHandprint = handprints.some(handprint => {
      const handprintX = (handprint.x / 100) * canvasSize.width;
      const handprintY = (handprint.y / 100) * canvasSize.height;
      return Math.abs(x - handprintX) < 15 && Math.abs(y - handprintY) < 15;
    });

    setShowCursor(!isOverHandprint && isPlacingHandprint);
  };

  const handleCanvasClick = (e, scale = 1, positionX = 0, positionY = 0) => {
    if (formPosition) return;
    const { x, y } = calculateRelativePosition(
      e.clientX,
      e.clientY,
      scale,
      positionX,
      positionY
    );

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
    setName("");
    setLink("");
  };

  const addHandprint = async (e) => {
    e.preventDefault();
    if (!tempHandprint) return;

    let formattedLink = link;
    if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
      formattedLink = `https://${link}`;
    }

    const newHandprint = {
      ...tempHandprint,
      name: name || "Anonymous",
      link: formattedLink || null,
      color: selectedColor,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/handprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHandprint),
      });

      if (!response.ok) throw new Error("Failed to save handprint");

      setHandprints((prevHandprints) => [...prevHandprints, newHandprint]);
      setFormPosition(null);
      setTempHandprint(null);
      setIsPlacingHandprint(false); // Set to false after placing handprint
      
      // Homo Sapiens reference :D
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
      setTempHandprint(null);
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

  const cancelHandprint = () => {
    setFormPosition(null);
    setTempHandprint(null);
  };

  const getLabelPosition = (handprint) => {
    const LABEL_MARGIN = 10; // pixels from edge
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
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <React.Fragment>
            <TransformComponent wrapperStyle={{}}>
              <div
                ref={canvasRef}
                className={`bg-gray-100 relative overflow-hidden ${
                  isPlacingHandprint ? "cursor-none" : "cursor-default"
                }`}
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                }}
                onClick={(e) => {
                  if (isPlacingHandprint) {
                    handleCanvasClick(
                      e,
                      rest.state.scale || 1,
                      rest.state?.positionX || 0,
                      rest.state?.positionY || 0
                    );
                  }
                }}
                onMouseMove={(e) =>
                  handleCanvasHover(
                    e,
                    rest.state?.scale || 1,
                    rest.state?.positionX || 0,
                    rest.state?.positionY || 0
                  )
                }
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
                        onMouseEnter={() => {
                          setHoveredHandprint(handprint);
                          setShowCursor(false);
                        }}
                        onMouseLeave={() => {
                          setHoveredHandprint(null);
                          setShowCursor(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (handprint.link)
                            window.open(handprint.link, "_blank");
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
                              transform: `${labelStyle.transform || ''} 
                              scale(${
                                1 / (rest.state?.scale || 1)
                              })
                              rotate(${-handprint.angle}deg)`,
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
                {isPlacingHandprint && showCursor && (
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
                <div className="absolute bottom-2 right-2 flex bg-red-50 bg-opacity-2 border border-black p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      zoomIn();
                    }}
                    className="mr-1"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      zoomOut();
                    }}
                    className="mr-1"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTransform();
                    }}
                  >
                    <Maximize size={20} />
                  </button>
                </div>
                {(handprints.length > 0) && (
                  <div className="absolute bottom-2 left-2 bg-red-50 bg-opacity-2 border border-black p-1">
                    <p className="text-sm font-serif">{handprints.length} were here</p>
                  </div>
                )}
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
            transform: "translate(-50%, -100%)",
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
                {Object.entries(COLORS).map(([key, value]) => (
                  <div
                    key={key}
                    className={`w-6 h-6 cursor-pointer ${
                      selectedColor === key ? "ring-2 ring-black" : ""
                    }`}
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
