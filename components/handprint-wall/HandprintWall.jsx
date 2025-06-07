// HandprintCanvas.jsx
import React, { useEffect, useRef, useReducer } from "react";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { reducer, initialState, MIN_WIDTH, MAX_WIDTH, MIN_HEIGHT, CANVAS_PADDING } from "./handprintReducer";
import HandprintForm from "./HandprintForm";

const COLORS = {
  blue: "#8AC3FF",
  aqua: "#62DDBD",
  red: "#F096A4",
  green: "#C3E798",
  yellow: "#FADFA4",
  skin: "#F4D0B5",
};

const HandprintCanvasDev = ({ className }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const canvasRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchHandprints();
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
        const handprintX = (handprint.x / 100) * rect.width;
        const handprintY = (handprint.y / 100) * rect.height;
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
  
    const formWidth = 280;
    const formHeight = 260;
    const clickX = e.clientX;
    const clickY = e.clientY;
    const viewportPadding = 10;

    // Check if we're on mobile (sm breakpoint and below)
    const isMobile = window.innerWidth < 640; // 640px is Tailwind's sm breakpoint
  
    let formX, formY;
    
    if (isMobile) {
      // On mobile, position at bottom center
      formX = (window.innerWidth - formWidth) / 2;
      formY = window.innerHeight - formHeight - viewportPadding;
    } else {
      // Desktop behavior remains the same
      formX = clickX + 10;
      formY = clickY + 10;
    
      if (formX + formWidth > window.innerWidth - viewportPadding) {
        formX = clickX - formWidth - 10;
      }
    
      if (formY + formHeight > window.innerHeight - viewportPadding) {
        formY = clickY - formHeight - 10;
      }
    
      formX = Math.max(viewportPadding, Math.min(formX, window.innerWidth - formWidth - viewportPadding));
      formY = Math.max(viewportPadding, Math.min(formY, window.innerHeight - formHeight - viewportPadding));
    }
  
    dispatch({
      type: "SET_TEMP_HANDPRINT",
      payload: {
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        color: state.formSelectedColor || state.selectedColor,
        angle: Math.random() * 120 - 60,
      },
    });
  
    dispatch({
      type: "SET_FORM_POSITION",
      payload: { x: formX, y: formY },
    });

    // Hide cursor when form opens
    dispatch({ type: "SET_SHOW_CURSOR", payload: false });
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
      <div className={`relative w-full max-w-[950px] min-w-[300px] ${className}`}>
        {/* Handprint Layer */}
        <div
          ref={canvasRef}
          className={`bg-gray-100 overflow-hidden relative w-full aspect-[3.5/1] min-h-[200px] ${
            state.showCursor ? 'cursor-none' : ''
          }`}
          style={{
            backgroundImage: 'url(/images/canvasbg2.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => {
            dispatch({ type: "SET_SHOW_CURSOR", payload: false });
            dispatch({ type: "SET_CURSOR_POSITION", payload: { x: 0, y: 0 } });
          }}
        >
          {/* White overlay */}
          <div 
            className="absolute inset-0 bg-white bg-opacity-30 pointer-events-none"
            style={{ zIndex: 0 }}
          />  
          
          {/* Handprints */}
          {[...state.handprints, state.tempHandprint]
            .filter(Boolean)
            .map((handprint, index) => (
              <div
                key={`handprint-${index}`}
                className={`absolute ${handprint.link ? 'cursor-pointer' : 'cursor-default'} w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] lg:w-[30px] lg:h-[30px]`}
                style={{
                  left: `${handprint.x}%`,
                  top: `${handprint.y}%`,
                  transform: `translate(-50%, -50%) rotate(${handprint.angle}deg)`,
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
                  alt=""
                  className="w-full h-full select-none"
                />
              </div>
            ))}


          {/* Cursor */}
          {state.showCursor && state.isMouseInside && (
            <div
              className="absolute pointer-events-none w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] lg:w-[30px] lg:h-[30px]"
              style={{
                left: `${state.cursorPosition.x}px`,
                top: `${state.cursorPosition.y}px`,
                transform: "translate(-50%, -50%)",
                zIndex: 30,
              }}
            >
              <Image
                src="/handprints/black.svg"
                width={30}
                height={30}
                alt="Cursor"
                className="w-full h-full"
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
            <div className="absolute bottom-2 left-2 bg-red-50 bg-opacity-2 border border-black p-1 pointer-events-auto select-none">
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
        <HandprintForm
          formRef={formRef}
          formPosition={state.formPosition}
          formName={state.formName}
          formLink={state.formLink}
          formSelectedColor={state.formSelectedColor}
          onNameChange={(value) => dispatch({ type: "SET_FORM_NAME", payload: value })}
          onLinkChange={(value) => dispatch({ type: "SET_FORM_LINK", payload: value })}
          onColorSelect={(color) => dispatch({ type: "SET_FORM_SELECTED_COLOR", payload: color })}
          onSubmit={handleFormSubmit}
          onCancel={() => dispatch({ type: "RESET_FORM" })}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default HandprintCanvasDev;