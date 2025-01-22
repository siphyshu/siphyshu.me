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
const MAX_WIDTH = 1200;
const MIN_HEIGHT = 250;
const CANVAS_PADDING = 50;

const initialState = {
  handprints: [],
  hoveredHandprint: null,
  formPosition: null,
  tempHandprint: null,
  selectedColor: null,
  showCursor: true,
  canvasSize: { width: MIN_WIDTH, height: MIN_HEIGHT },
  formName: "",
  formLink: "",
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

const HandprintCanvasDev = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchHandprints();
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!state.selectedColor) {
      const randomColor = Object.keys(COLORS)[
        Math.floor(Math.random() * Object.keys(COLORS).length)
      ];
      dispatch({ type: "SET_SELECTED_COLOR", payload: randomColor });
    }
  }, [state.selectedColor]);

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.min(
      Math.max(document.body.clientWidth, MIN_WIDTH),
      MAX_WIDTH
    ) - CANVAS_PADDING;
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
    
    // Calculate percentage positions
    const xPercentage = (x / state.canvasSize.width) * 100;
    const yPercentage = (y / state.canvasSize.height) * 100;
    const angle = Math.random() * 120 - 60;


    // Calculate form position with viewport boundary checks
    const clickX = e.clientX;
    const clickY = e.clientY;
    const formWidth = 300; // Approximate form width
    const formHeight = 200; // Approximate form height
    const offset = 20; // Distance from click point
  
    let formX = clickX;
    let formY = clickY;
    let transformOrigin = "top-left";
  
    // Check available space and position form accordingly
    if (clickX > window.innerWidth - formWidth) {
      formX = clickX - formWidth + offset;
      transformOrigin = "top-right";
    } else {
      formX += offset;
    }
  
    if (clickY > window.innerHeight - formHeight) {
      formY = clickY - formHeight + offset;
      transformOrigin = "bottom-left";
    } else {
      formY += offset;
    }
  
    // Ensure form stays within viewport boundaries
    formX = Math.max(10, Math.min(formX, window.innerWidth - formWidth - 10));
    formY = Math.max(10, Math.min(formY, window.innerHeight - formHeight - 10));
  
  
    dispatch({
      type: "SET_TEMP_HANDPRINT",
      payload: {
        x: xPercentage,
        y: yPercentage,
        color: state.selectedColor,
        angle,
      },
    });
    dispatch({
      type: "SET_FORM_SELECTED_COLOR",
      payload: state.selectedColor,
    });
    dispatch({
      type: "SET_FORM_POSITION",
      payload: { x: formX, y: formY, origin: transformOrigin },
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
    <div className="w-full px-5 flex justify-center flex-col items-center">
      <p className="text-sm italic text-gray-600 mb-4 text-center w-full">
        From cave walls to pixels: the human urge to leave a trace endures. 🖐️
      </p>
  
      {/* Canvas Container */}
      <div 
        className="relative" 
        style={{ 
          width: `${state.canvasSize.width}px`,
        }}
      >
        {/* Handprint Layer */}
        <div
          ref={canvasRef}
          className={`bg-gray-100 overflow-hidden relative ${
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
                className="absolute"
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
            )
          )}

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
                    className="bg-red-50 bg-opacity-2 border border-black text-black px-2 py-1 font-serif pointer-events-auto"
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
            })}
  
          {/* "X were here" label */}
          {state.handprints.length > 0 && (
            <div className="absolute bottom-2 left-2 bg-red-50 bg-opacity-2 border border-black p-1 pointer-events-auto">
              <p className="text-sm font-serif">{state.handprints.length} were here</p>
            </div>
          )}
        </div>
      </div>
  
      {/* Form */}
      {state.formPosition && (
        <div
          className="absolute bg-white border border-black shadow-md"
          style={{
            left: `${state.formPosition.x}px`,
            top: `${state.formPosition.y}px`,
            transformOrigin: state.formPosition.origin,
            transform: `
              translate(
                ${state.formPosition.origin.includes("right") ? "-100%" : "0"},
                ${state.formPosition.origin.includes("bottom") ? "-100%" : "0"}
              )
            `,
            zIndex: 20,
          }}
        >
          <form onSubmit={handleFormSubmit} className="p-4">
            <input
              type="text"
              placeholder="Name / Alias"
              value={state.formName}
              onChange={(e) =>
                dispatch({ type: "SET_FORM_NAME", payload: e.target.value })
              }
              className="block w-full mb-2 px-2 py-1 border border-black"
            />
            <input
              type="text"
              placeholder="Link (Optional)"
              value={state.formLink}
              onChange={(e) =>
                dispatch({ type: "SET_FORM_LINK", payload: e.target.value })
              }
              className="block w-full mb-2 px-2 py-1 border border-black"
            />
            <div className="flex justify-between items-center mb-2">
              <div className="flex justify-between w-full">
                {Object.entries(COLORS).map(([key, value]) => (
                  <div
                    key={key}
                    className={`w-6 h-6 cursor-pointer ${
                      state.formSelectedColor === key ? "ring-2 ring-black" : ""
                    }`}
                    style={{ backgroundColor: value }}
                    onClick={() =>
                      dispatch({ type: "SET_FORM_SELECTED_COLOR", payload: key })
                    }
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
                onClick={() => dispatch({ type: "RESET_FORM" })}
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

export default HandprintCanvasDev;