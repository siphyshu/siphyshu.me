export const ctfs = [
    {
        id: 1,
        title: "baby's first overflow",
        category: "pwn",
        difficulty: "easy",
        points: 100,
        solves: 12,
        status: "live",
        description: "A classic stack buffer overflow. No protections enabled — get comfortable with the basics.",
        files: ["chall", "chall.c"],
        connect: "nc chall.siphyshu.me 31337"
    },
    {
        id: 2,
        title: "cookie jar",
        category: "web",
        difficulty: "easy",
        points: 150,
        solves: 8,
        status: "live",
        description: "A login form that trusts the client a little too much.",
        files: ["cookie-jar.zip"],
        connect: "https://cookie-jar.siphyshu.me"
    },
    {
        id: 3,
        title: "rotten cipher",
        category: "crypto",
        difficulty: "medium",
        points: 250,
        solves: 3,
        status: "live",
        description: "A rolled-your-own cipher scheme. Something's rotten about the key schedule.",
        files: ["rotten.py", "output.txt"],
        connect: null
    },
    {
        id: 4,
        title: "memory lane",
        category: "forensics",
        difficulty: "medium",
        points: 200,
        solves: 0,
        status: "upcoming",
        description: "A memory dump with a story to tell, if you know where to look.",
        files: [],
        connect: null
    }
];
