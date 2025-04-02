// HandprintCanvas.jsx
import React, { useEffect, useRef, useReducer } from "react";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const COLORS = {
  blue: "#8AC3FF",
  aqua: "#62DDBD",
  red: "#F096A4",
  green: "#C3E798",
  yellow: "#FADFA4",
  skin: "#F4D0B5",
};

const MIN_WIDTH = 300;
const MAX_WIDTH = 950;
const MIN_HEIGHT = 250;
const CANVAS_PADDING = 50;

const initialState = {
  handprints: [],
  hoveredHandprint: null,
  formPosition: null,
  tempHandprint: null,
  showCursor: true,
  canvasSize: { width: MIN_WIDTH, height: MIN_HEIGHT },
  formName: "",
  formLink: "",
  selectedColor: Object.keys(COLORS)[Math.floor(Math.random() * Object.keys(COLORS).length)],
  formSelectedColor: null,
  cursorPosition: { x: 0, y: 0 },
  isMouseInside: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_HANDPRINTS":
      return { ...state, handprints: action.payload };
    case "SET_HOVERED_HANDPRINT":
      return { ...state, hoveredHandprint: action.payload };
    case "SET_FORM_POSITION":
      return { ...state, formPosition: action.payload };
    case "SET_TEMP_HANDPRINT":
      return { ...state, tempHandprint: action.payload };
    case "SET_SELECTED_COLOR":
      return { ...state, selectedColor: action.payload };
    case "SET_SHOW_CURSOR":
      return { ...state, showCursor: action.payload };
    case "SET_CURSOR_POSITION":
      return { ...state, cursorPosition: action.payload };  
    case "SET_CANVAS_SIZE":
      return { ...state, canvasSize: action.payload };
    case "SET_FORM_NAME":
      return { ...state, formName: action.payload };
    case "SET_FORM_LINK":
      return { ...state, formLink: action.payload };
    case "SET_FORM_SELECTED_COLOR":
      return { ...state, formSelectedColor: action.payload };
    case "SET_MOUSE_INSIDE":
      return { ...state, isMouseInside: action.payload };
    case "RESET_FORM":
      return {
        ...state,
        formPosition: null,
        tempHandprint: null,
        formName: "",
        formLink: "",
      };
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

const HandprintCanvasDev = ({ className }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const canvasRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchHandprints();
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!state.formSelectedColor) {
      dispatch({ 
        type: "SET_FORM_SELECTED_COLOR", 
        payload: state.selectedColor 
      });
    }
  }, [state.formSelectedColor, state.selectedColor]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        dispatch({ type: "RESET_FORM" });
      }
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        dispatch({ type: "RESET_FORM" });
      }
    };
  
    if (state.formPosition) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.formPosition]);
  
  useEffect(() => {
    if (state.tempHandprint && state.formSelectedColor) {
      dispatch({
        type: "SET_TEMP_HANDPRINT",
        payload: {
          ...state.tempHandprint,
          color: state.formSelectedColor
        }
      });
    }
  }, [state.formSelectedColor]);
  
  
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get the actual width of the container element
    // const containerWidth = canvas.parentElement.getBoundingClientRect().width;
    // const width = Math.max(MIN_WIDTH, containerWidth - CANVAS_PADDING);
    const width = Math.min(Math.max(document.body.clientWidth, MIN_WIDTH), MAX_WIDTH) - CANVAS_PADDING;
    
    dispatch({
      type: "SET_CANVAS_SIZE",
      payload: { width, height: MIN_HEIGHT },
    });
  };

  const fetchHandprints = async () => {
    try {
      const response = await fetch("/api/handprints");
      if (!response.ok) throw new Error("Failed to fetch handprints");
      const data = await response.json();
      dispatch({ type: "SET_HANDPRINTS", payload: data });
    } catch (error) {
      console.error("Error fetching handprints:", error);
      toast.error("Failed to load handprints. Please refresh the page.");
    }
  };

  const handleCanvasHover = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Check if mouse is actually inside canvas
    const isInside = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    dispatch({ type: "SET_MOUSE_INSIDE", payload: isInside });

    if (isInside) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dispatch({ type: "SET_CURSOR_POSITION", payload: { x, y } });
    
      const isOverHandprint = state.handprints.some((handprint) => {
        const handprintX = (handprint.x / 100) * state.canvasSize.width;
        const handprintY = (handprint.y / 100) * state.canvasSize.height;
        return Math.abs(x - handprintX) < 15 && Math.abs(y - handprintY) < 15;
      });
  
      dispatch({
        type: "SET_SHOW_CURSOR",
        payload: !isOverHandprint && !state.formPosition,
      });
    }
  };


  const handleCanvasClick = (e) => {
    if (state.formPosition) return;
  
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    // Simplified form positioning
    const formWidth = 280; // Approximate form width
    const formHeight = 260; // Approximate form height
    const clickX = e.clientX;
    const clickY = e.clientY;
    const viewportPadding = 10;
  
    // Calculate initial position (10px offset from click)
    let formX = clickX + 10;
    let formY = clickY + 10;
  
    // Adjust for right edge
    if (formX + formWidth > window.innerWidth - viewportPadding) {
      formX = clickX - formWidth - 10;
    }
  
    // Adjust for bottom edge
    if (formY + formHeight > window.innerHeight - viewportPadding) {
      formY = clickY - formHeight - 10;
    }
  
    // Final clamp to viewport boundaries
    formX = Math.max(viewportPadding, Math.min(formX, window.innerWidth - formWidth - viewportPadding));
    formY = Math.max(viewportPadding, Math.min(formY, window.innerHeight - formHeight - viewportPadding));
  
    dispatch({
      type: "SET_TEMP_HANDPRINT",
      payload: {
        x: (x / state.canvasSize.width) * 100,
        y: (y / state.canvasSize.height) * 100,
        color: state.formSelectedColor || state.selectedColor,
        angle: Math.random() * 120 - 60,
      },
    });
  
    dispatch({
      type: "SET_FORM_POSITION",
      payload: { x: formX, y: formY },
    });
  };  


  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!state.tempHandprint) return;

    let formattedLink = state.formLink;
    if (state.formLink && !state.formLink.startsWith("http")) {
      formattedLink = `https://${state.formLink}`;
    }

    const newHandprint = {
      ...state.tempHandprint,
      name: state.formName || "Anonymous",
      link: formattedLink || null,
      color: state.formSelectedColor,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/handprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHandprint),
      });

      if (!response.ok) throw new Error("Failed to save handprint");

      dispatch({
        type: "SET_HANDPRINTS",
        payload: [...state.handprints, newHandprint],
      });
      dispatch({ type: "RESET_FORM" });

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
      position: "absolute",
      whiteSpace: "nowrap",
      pointerEvents: "none",
    };

    if (handprint.y < 20) {
      labelStyle.top = "100%";
      labelStyle.marginTop = "5px";
    } else {
      labelStyle.bottom = "100%";
      labelStyle.marginBottom = "5px";
    }

    if (handprint.x < LABEL_MARGIN) {
      labelStyle.left = "0";
    } else if (handprint.x > 100 - LABEL_MARGIN) {
      labelStyle.right = "0";
    } else {
      labelStyle.left = "50%";
      labelStyle.transform = "translateX(-50%)";
    }

    return labelStyle;
  };

  const formatLink = (link) => {
    if (!link) return "";
    return link.replace(/^https?:\/\//, "").replace(/^www\./, "");
  };

  return (
    <div className="w-full flex justify-center flex-col items-center">
      {/* <p className="italic text-sm text-gray-600 mb-4 text-center w-full px-6 lg:px-0">
        From cave walls to pixels: the human urge to leave a trace endures. 🖐️
      </p> */}
  
      {/* Canvas Container */}
      <div 
        className={`relative ${className}`}
        style={{
          width: `${state.canvasSize.width}px`,
        }}
      >
        {/* Handprint Layer */}
        <div
          ref={canvasRef}
          className={`bg-gray-100 overflow-hidden relative w-full ${
            state.showCursor ? 'cursor-none' : ''
          }`}
          style={{
            height: `${state.canvasSize.height}px`,
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => {
            dispatch({ type: "SET_SHOW_CURSOR", payload: false });
            dispatch({ type: "SET_CURSOR_POSITION", payload: { x: 0, y: 0 } });
          }}
        >
          {/* Handprints */}
          {[...state.handprints, state.tempHandprint]
            .filter(Boolean)
            .map((handprint, index) => (
              <div
                key={`handprint-${index}`}
                className={`absolute ${handprint.link ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  left: `${handprint.x}%`,
                  top: `${handprint.y}%`,
                  transform: `translate(-50%, -50%) rotate(${handprint.angle}deg)`,
                  width: '30px',
                  height: '30px',
                }}
                onMouseEnter={() =>
                  dispatch({ type: "SET_HOVERED_HANDPRINT", payload: handprint })
                }
                onMouseLeave={() =>
                  dispatch({ type: "SET_HOVERED_HANDPRINT", payload: null })
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (handprint.link) {
                    window.open(handprint.link, "_blank");
                  }
                }}
              >
                <Image
                  src={`/handprints/${handprint.color}.svg`}
                  width={30}
                  height={30}
                  alt="Handprint"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>
            ))}


          {/* Cursor */}
          {state.showCursor && state.isMouseInside && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${state.cursorPosition.x}px`,
                top: `${state.cursorPosition.y}px`,
                transform: "translate(-50%, -50%)",
                zIndex: 30,
                // Prevent image scaling
                width: "30px",
                height: "30px",
              }}
            >
              <Image
                src="/handprints/black.svg"
                width={30}
                height={30}
                alt="Cursor"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          )}
        </div>

  
        {/* UI Overlay Layer */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 10 }}
        >
          {/* Labels */}
          {[...state.handprints, state.tempHandprint]
            .filter(Boolean)
            .map((handprint, index) => {
              // Only show label if hovered and has name
              if (!handprint.name || handprint !== state.hoveredHandprint) return null;
              
              const labelStyle = getLabelPosition(handprint);
              return (
                <div
                  key={`label-${index}`}
                  className="absolute"
                  style={{
                    left: `${handprint.x}%`,
                    top: `${handprint.y}%`,
                    transform: `translate(-50%, -50%)`,
                  }}
                >
                  <div
                    className="bg-red-50 bg-opacity-2 border border-black text-black px-2 py-1 font-serif pointer-events-none"
                    style={{
                      ...labelStyle,
                      transform: `${labelStyle.transform || ""}`,
                    }}
                  >
                    {handprint.name}
                    {handprint.link && (
                      <span className="ml-1 text-xs">
                        ({formatLink(handprint.link)})
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}
  
          {/* "X were here" label */}
          {state.handprints.length > 0 && (
            <div className="absolute bottom-2 left-2 bg-red-50 bg-opacity-2 border border-black p-1 pointer-events-auto">
              <p className="text-sm font-serif">{state.handprints.length} were here</p>
            </div>
          )}
        </div>
      </div>

      <p className="italic text-sm text-gray-600 mt-4 text-center md:text-right w-full px-6 lg:px-0">
        From cave walls to pixels: the human urge to leave a trace endures. 🖐️
      </p>
  
      {/* Form */}
      {state.formPosition && (
        <div
          ref={formRef}
          className="absolute bg-white/95 backdrop-blur-sm border border-gray-400 rounded-md shadow-sm w-64 m-3"
          style={{
            left: `${state.formPosition.x}px`,
            top: `${state.formPosition.y}px`,
            zIndex: 20,
          }}
        >
          <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Your Name / Alias <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. siphyshu"
                  value={state.formName}
                  onChange={(e) =>
                    dispatch({ type: "SET_FORM_NAME", payload: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 bg-transparent"
                  autoFocus
                  required
                />
              </div>

              {/* Website Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Link (Optional)
                </label>
                <input
                  // type="url"
                  placeholder="e.g. linktr.ee/yourname"
                  value={state.formLink}
                  onChange={(e) =>
                    dispatch({ type: "SET_FORM_LINK", payload: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 bg-transparent"
                  pattern="^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Color Picker
                </label>
                <div className="grid grid-cols-6 gap-2 py-2 px-3">
                  {Object.entries(COLORS).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        dispatch({ type: "SET_FORM_SELECTED_COLOR", payload: key })
                      }
                      className={`h-6 w-6 rounded-full transition-all ${
                        state.formSelectedColor === key 
                          ? "ring-2 ring-offset-1 ring-gray-800"
                          : "hover:ring-1 hover:ring-gray-200"
                      }`}
                      style={{ backgroundColor: value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
              >
                Imprint!
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "RESET_FORM" })}
                className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
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

export default HandprintCanvasDev;