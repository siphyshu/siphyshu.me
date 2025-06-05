export const projects = [
    {
        id: 3,
        title: "wallpy-sensei",
        description: "A dynamic wallpaper engine. Schedule wallpaper changes throughout the day and manage wallpacks using a neat CLI.",
        thumbnail: "/thumbnails/projects/wallpy-thumbnail3.png",
        links: {
            "github": "https://github.com/siphyshu/wallpy-sensei"
        },
        tags: ["python", "cli", "wip"]
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
        id: 9,
        title: "Siphy's Bounty Board",
        description: "A place to post fun little tasks for friends, family, and random strangers on the internet. Built for fun for my brother.",
        thumbnail: "/thumbnails/projects/bounties_thumbnail3.png",
        links: {
            "external": "https://bounties.siphyshu.me",
            "github": "https://github.com/siphyshu/bounties"
        },
        tags: ["web", "nextjs", "wip"],
    },
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
        id: 5,
        title: "pong-R4",
        description: "The classic pong game on the Arduino R4's LED matrix. Play with friends with 2 joysticks, or solo against the AI.",
        thumbnail: "/thumbnails/projects/pong-r4-thumbnail.png",
        links: {
            "github": "https://github.com/siphyshu/pong-R4"
        },
        tags: ["electronics", "c++"],
        hiddentags: ["arduino", "game-dev"]
    }
];