export const games = [
    {
        id: 1,
        title: "scattr-invaders",
        description: "A tiny space-invaders clone rendered with the scattr layout engine. Playable right here.",
        thumbnail: "/thumbnails/projects/scattr-thumbnail.png",
        platform: "web",
        playUrl: null,
        links: { github: "https://github.com/siphyshu/scattr" },
        tags: ["game-dev", "javascript"]
    },
    {
        id: 2,
        title: "snake-R4",
        description: "The classic snake game built on the Arduino UNO R4's 8x12 LED matrix, uses a dual-axis joystick controller for movement.",
        thumbnail: "/thumbnails/projects/snake-r4-thumbnail.png",
        platform: "hardware",
        demoVideo: null,
        links: {
            "external": "https://siphyshu.medium.com/i-made-the-snake-game-on-the-arduino-uno-r4-led-matrix-with-a-joystick-controller-5127c28f8a38",
            "github": "https://github.com/siphyshu/snake-R4",
        },
        tags: ["game-dev", "electronics"]
    },
    {
        id: 3,
        title: "pong-R4",
        description: "The classic pong game on the Arduino R4's LED matrix. Play with friends with 2 joysticks, or solo against the AI.",
        thumbnail: "/thumbnails/projects/pong-r4-thumbnail.png",
        platform: "hardware",
        demoVideo: null,
        links: { github: "https://github.com/siphyshu/pong-R4" },
        tags: ["game-dev", "electronics"]
    },
    {
        id: 4,
        title: "term-quest",
        description: "A terminal roguelike written in Python. Runs anywhere you've got a terminal and a pip install.",
        thumbnail: "/thumbnails/projects/placeholder-thumbnail.png",
        platform: "python",
        links: { github: "https://github.com/siphyshu/term-quest" },
        tags: ["game-dev", "python"]
    },
    {
        id: 5,
        title: "wordle-bot",
        description: "A daily wordle-style game you play with friends inside a Discord server.",
        thumbnail: "/thumbnails/projects/placeholder-thumbnail.png",
        platform: "discord",
        discordInvite: null,
        links: { github: "https://github.com/siphyshu/wordle-bot" },
        tags: ["game-dev", "discord"]
    }
];
