export const COLORS = {
  blue: "#8AC3FF",
  aqua: "#62DDBD",
  red: "#F096A4",
  green: "#C3E798",
  yellow: "#FADFA4",
  skin: "#F4D0B5",
};

export const initialState = {
  handprints: [],
  hoveredHandprint: null,
  formPosition: null,
  tempHandprint: null,
  showCursor: true,
  formName: "",
  formLink: "",
  selectedColor: Object.keys(COLORS)[Math.floor(Math.random() * Object.keys(COLORS).length)],
  formSelectedColor: null,
  cursorPosition: { x: 0, y: 0 },
  isMouseInside: false,
};

export function reducer(state, action) {
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