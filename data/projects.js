export const projects = [
    { 
        id: 1, 
        title: "snake-R4", 
        description: "The classic snake game built on the Arduino UNO R4's 8x12 LED matrix, uses a dual-axis joystick controller for movement.", 
        thumbnail: "/thumbnails/projects/snake-r4-thumbnail.png", 
        links: {
            "external": "https://siphyshu.medium.com/i-made-the-snake-game-on-the-arduino-uno-r4-led-matrix-with-a-joystick-controller-5127c28f8a38",
            "github": "https://github.com/siphyshu/snake-R4",
        }, 
        tags: ["electronics", "c++"],
        hiddentags: ["arduino", "game-dev"]
    },
    { 
        id: 2, 
        title: "VITB-timetable-parser", 
        description: "Parses VITB _(my uni)_ timetable images to json/csv. Built this to enable easy timetable handling for anyone building VITB projects.", 
        thumbnail: "/thumbnails/projects/vitb-tt2json-thumbnail.png",
        links: {
            "external": "https://vitb-tt2json.streamlit.app/",
            "github": "https://github.com/siphyshu/vitb-timetable-parser",
        },
        tags: ["python", "ocr"]
    },
    {
        id: 3,
        title: "wallpy-sensei",
        description: "A dynamic wallpaper engine written in python. Wallpacks that change throughout the day, based on your mood, weather, and more.",
        thumbnail: "/thumbnails/projects/wallpy-thumbnail.png",
        links: {
            "github": "https://github.com/siphyshu/wallpy-sensei"
        },
        tags: ["python", "cli"]
    },
];