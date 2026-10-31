"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import "./wordle.css";

// The figures for "Wordle was never English" (content/articles/
// wordle-was-never-english.mdx), ported from the reader mockup's script. Each
// is registered by name in mdx-components.tsx; the captions live in the MDX,
// inside <Figure>.

type Mark = "g" | "y" | "x";

function Tile({ ch = "", state, extra }: { ch?: string; state?: string | null; extra?: string }) {
  const cls = ["wd-tile", state, extra].filter(Boolean).join(" ");
  // A Motus circle draws its yellow disc in ::before; the letter sits on top.
  return <div className={cls}>{state === "c" ? <span>{ch}</span> : ch}</div>;
}

/** Wordle's grading: greens first, then yellows from what's left. */
function grade<T>(guess: T[], answer: T[]): Mark[] {
  const marks: Mark[] = guess.map(() => "x");
  const left = new Map<T, number>();
  guess.forEach((g, i) => {
    if (g === answer[i]) marks[i] = "g";
    else left.set(answer[i], (left.get(answer[i]) ?? 0) + 1);
  });
  guess.forEach((g, i) => {
    if (marks[i] !== "g" && (left.get(g) ?? 0) > 0) {
      marks[i] = "y";
      left.set(g, left.get(g)! - 1);
    }
  });
  return marks;
}

const isCjk = (ch: string) => /[^\x00-\x7F]/.test(ch);

// ── Under the header: "word" in a few of the games' scripts ──

const STRIP: [string, string][] = [
  ["T", "g"], ["E", "g"], ["R", "y"], ["M", "g"], ["O", "x"], ["", ""],
  ["汉", "t"], ["兜", "o"], ["", ""],
  ["꼬", "g"], ["들", "y"], ["", ""],
  ["S", "r"], ["U", "c"], ["T", "r"], ["O", "r"], ["M", "r"],
];

export function WordStrip() {
  return (
    <div className="wd-tiles" style={{ flexWrap: "wrap" }} aria-hidden>
      {STRIP.map(([ch, st], i) =>
        ch ? <Tile key={i} ch={ch} state={st} extra={isCjk(ch) ? "xs cjk" : "xs"} /> : <div key={i} style={{ width: 10 }} />
      )}
    </div>
  );
}

// ── Fig. 1: Termo's growth against Wordle's ──

const GROWTH = [
  { g: "Wordle", d: "2021-11-01", n: 90 },
  { g: "Wordle", d: "2022-01-02", n: 300000 },
  { g: "Wordle", d: "2022-01-09", n: 2000000 },
  { g: "Termo", d: "2022-01-15", n: 100000 },
  { g: "Termo", d: "2022-01-17", n: 200000 },
  { g: "Termo", d: "2022-01-31", n: 400000 },
  { g: "Termo", d: "2022-02-15", n: 500000 },
];

export function TermoGrowth() {
  const W = 640, H = 330, L = 56, R = 560, T = 40, B = 290;
  const day = (d: string) => Date.parse(d) / 864e5;
  const lo = day("2021-10-20"), hi = day("2022-02-25");
  const X = (d: string) => L + ((day(d) - lo) / (hi - lo)) * (R - L);
  const Y = (v: number) => B - ((Math.log10(v) - 1) / 6) * (B - T);
  const fmt = (v: number) => (v >= 1e6 ? v / 1e6 + "M" : v >= 1e3 ? v / 1e3 + "k" : String(v));

  return (
    <div className="wd-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Termo reached 100,000 daily players about ten days after launch; Wordle took about two months to pass 300,000"
      >
        {[10, 100, 1e3, 1e4, 1e5, 1e6, 1e7].map((v) => (
          <g key={v}>
            <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} className="grid" />
            <text x={L - 8} y={Y(v) + 4} textAnchor="end">{fmt(v)}</text>
          </g>
        ))}
        {[["2021-11-01", "Nov"], ["2021-12-01", "Dec"], ["2022-01-01", "Jan 2022"], ["2022-02-01", "Feb"]].map(([d, l]) => (
          <text key={d} x={X(d)} y={B + 22} textAnchor="middle">{l}</text>
        ))}
        <line x1={L} x2={R} y1={B} y2={B} className="axis" />
        {[["2022-01-05", "Termo launches"], ["2022-01-31", "NYT buys Wordle"]].map(([d, l]) => (
          <g key={d}>
            <line x1={X(d)} x2={X(d)} y1={T - 6} y2={B} className="ref" />
            <text x={X(d) - 5} y={T - 12} textAnchor="end">{l}</text>
          </g>
        ))}
        {["Wordle", "Termo"].map((g) => {
          const pts = GROWTH.filter((r) => r.g === g);
          const c = g === "Termo" ? "b" : "a";
          const last = pts[pts.length - 1];
          return (
            <g key={g}>
              <path d={pts.map((r, i) => `${i ? "L" : "M"}${X(r.d)} ${Y(r.n)}`).join("")} className={`s${c}`} />
              {pts.map((r) => (
                <circle key={r.d} cx={X(r.d)} cy={Y(r.n)} r={4} className={`d${c}`}>
                  <title>{`${g}, ${r.d}: ${r.n.toLocaleString("en-US")}`}</title>
                </circle>
              ))}
              <text x={X(last.d) + 9} y={Y(last.n) + 4} className="strong">{g}</text>
            </g>
          );
        })}
        <text x={X("2022-01-02") - 9} y={Y(300000) + 4} textAnchor="end">300k by Jan 2</text>
        <text x={X("2022-01-15") - 30} y={Y(100000) + 22} className="strong">100k by Jan 15</text>
      </svg>
    </div>
  );
}

// ── Fig. 2: one guess, four sets of rules ──

const SECRETS = ["STAGE", "LINGO", "PLANT", "CHAIR", "FLAME", "BRICK", "SOUTH", "TILES"];
const JUDGES = [
  { name: "Jotto", year: "1955", rule: "How many letters you share. Nothing else.", kind: "jotto" },
  { name: "Mastermind", year: "1970s", rule: "Black peg: in place. White peg: elsewhere. Never which.", kind: "mastermind" },
  { name: "Lingo, Motus", year: "1987, 1990", rule: "First letter given. Red square: in place. Yellow circle: elsewhere.", kind: "motus" },
  { name: "Wordle", year: "2021", rule: "Green: in place. Yellow: elsewhere. Grey: absent.", kind: "wordle" },
] as const;

export function FourJudges() {
  const [secret, setSecret] = useState(0);
  const [guesses, setGuesses] = useState(["CRANE"]);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const s = SECRETS[secret];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim().toUpperCase();
    if (!/^[A-Z]{5}$/.test(v)) return setError("Five letters, A to Z.");
    if (guesses.length >= 6) return setError("That's six. Reveal it or pick a new word.");
    setError("");
    setGuesses([...guesses, v]);
    setInput("");
  };

  const status = error
    ? error
    : guesses.includes(s)
      ? `Solved: ${s}.`
      : revealed
        ? `The word was ${s}.`
        : `${guesses.length} of 6 guesses used. Try your own.`;

  return (
    <>
      <form className="fig-controls" onSubmit={submit} autoComplete="off">
        <label htmlFor="wd-guess" className="fig-msg" style={{ minHeight: 0 }}>Guess</label>
        <input
          type="text"
          id="wd-guess"
          maxLength={5}
          spellCheck={false}
          placeholder="CRANE"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
        />
        <button className="primary" type="submit">Judge it</button>
        <button type="button" onClick={() => setRevealed(true)}>Reveal</button>
        <button
          type="button"
          onClick={() => {
            setSecret((secret + 1) % SECRETS.length);
            setGuesses(["CRANE"]);
            setRevealed(false);
            setError("");
          }}
        >
          New word
        </button>
      </form>
      <div className="fig-msg" aria-live="polite">{status}</div>
      <div className="wd-judges">
        {JUDGES.map((j) => (
          <div key={j.kind} className="wd-judge">
            <div className="jn">{j.name} <span className="jy">{j.year}</span></div>
            <div className="jr">{j.rule}</div>
            {j.kind === "motus" && (
              <div className="wd-jrow">
                {[0, 1, 2, 3, 4].map((i) => <Tile key={i} ch={i ? "" : s[0]} state="m" />)}
              </div>
            )}
            {guesses.map((g, gi) => {
              const sc = grade([...g], [...s]);
              const greens = sc.filter((v) => v === "g").length;
              const yellows = sc.filter((v) => v === "y").length;
              const letters = [...g];
              return (
                <div key={gi} className="wd-jrow">
                  {j.kind === "jotto" && (
                    <>
                      {letters.map((ch, i) => <Tile key={i} ch={ch} />)}
                      <span className="wd-badge">{greens + yellows}</span>
                    </>
                  )}
                  {j.kind === "mastermind" && (
                    <>
                      {letters.map((ch, i) => <Tile key={i} ch={ch} />)}
                      <div className="wd-pegs" aria-label={`${greens} black, ${yellows} white`}>
                        {Array.from({ length: greens }, (_, i) => <span key={`b${i}`} className="wd-peg b" />)}
                        {Array.from({ length: yellows }, (_, i) => <span key={`w${i}`} className="wd-peg" />)}
                      </div>
                    </>
                  )}
                  {j.kind === "motus" &&
                    letters.map((ch, i) => <Tile key={i} ch={ch} state={sc[i] === "g" ? "r" : sc[i] === "y" ? "c" : "m"} />)}
                  {j.kind === "wordle" && letters.map((ch, i) => <Tile key={i} ch={ch} state={sc[i]} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Fig. 3: Hebrew's final forms ──

const ALEF_BET = [..."אבגדהוזחטיכלמנסעפצקרשת"];
const FINALS: Record<string, string> = { "כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ" };

export function HebrewFinals() {
  const [word, setWord] = useState([..."שלומ"]);
  const [showFinals, setShowFinals] = useState(false);

  return (
    <>
      <div className="wd-out">
        <div className="wd-tiles wd-rtl" aria-live="polite">
          {[0, 1, 2, 3, 4].map((i) => {
            const ch = word[i];
            const final = ch && i === word.length - 1 ? FINALS[ch] : undefined;
            return <Tile key={i} ch={ch ? final ?? ch : ""} state={final ? "fin" : null} extra="cjk" />;
          })}
        </div>
      </div>
      <div className="wd-kbd">
        {ALEF_BET.map((ch) => (
          <button key={ch} type="button" aria-label={`Type ${ch}`} onClick={() => word.length < 5 && setWord([...word, ch])}>
            {ch}
          </button>
        ))}
        {showFinals &&
          Object.values(FINALS).map((ch) => (
            <button key={ch} type="button" className="sofit" disabled title="A final form, removed from Meduyeket's keyboard">
              {ch}
            </button>
          ))}
      </div>
      <div className="fig-controls">
        <button type="button" onClick={() => setWord(word.slice(0, -1))}>Delete</button>
        <button type="button" onClick={() => setWord([])}>Clear</button>
        <button type="button" aria-pressed={showFinals} onClick={() => setShowFinals(!showFinals)}>
          {showFinals ? "Hide the 5 removed keys" : "Show the 5 removed keys"}
        </button>
      </div>
    </>
  );
}

// ── Fig. 4: what's inside a Hangul block ──

const LEADS = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"];
const VOWELS = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"];
const TAILS = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

/** A precomposed syllable's jamo, by Unicode arithmetic: 588 = 21 vowels × 28 tails. */
function jamo(ch: string) {
  const c = ch.codePointAt(0)! - 0xac00;
  if (c < 0 || c >= 11172) return null;
  return [LEADS[Math.floor(c / 588)], VOWELS[Math.floor((c % 588) / 28)], TAILS[c % 28]].filter(Boolean);
}

export function HangulBlocks() {
  const [text, setText] = useState("한글");
  const blocks = [...text].map((ch) => ({ ch, parts: jamo(ch) })).filter((b) => b.parts);
  const letters = blocks.reduce((n, b) => n + b.parts!.length, 0);

  return (
    <>
      <div className="fig-controls">
        <label htmlFor="wd-ko" className="fig-msg" style={{ minHeight: 0 }}>Korean</label>
        <input
          type="text"
          id="wd-ko"
          maxLength={6}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: "var(--wd-cjk)", letterSpacing: "0.04em" }}
        />
        {["한글", "꼬들", "서울", "김치"].map((w) => (
          <button key={w} type="button" style={{ fontFamily: "var(--wd-cjk)" }} onClick={() => setText(w)}>{w}</button>
        ))}
      </div>
      <div className="wd-out" aria-live="polite">
        {blocks.map(({ ch, parts }, i) => (
          <div key={i} className="wd-block">
            <Tile ch={ch} extra="cjk" />
            <div className="wd-arrow">↓</div>
            <div className="wd-tiles">
              {parts!.map((p, j) => <Tile key={j} ch={p} state={j === 1 ? "y" : "g"} extra="cjk sm" />)}
            </div>
          </div>
        ))}
      </div>
      <div className="fig-msg">
        {blocks.length
          ? `${blocks.length} block${blocks.length > 1 ? "s" : ""}, ${letters} letters.`
          : "Type a word in Hangul."}
      </div>
    </>
  );
}

// ── Fig. 5: Handle's three-way grading ──

// Initial, final, tone.
const PINYIN: Record<string, [string, string, number]> = {
  "一": ["y", "i", 1], "心": ["x", "in", 1], "意": ["y", "i", 4], "三": ["s", "an", 1],
  "二": ["", "er", 4], "石": ["sh", "i", 2], "鸟": ["n", "iao", 3], "想": ["x", "iang", 3],
  "事": ["sh", "i", 4], "成": ["ch", "eng", 2], "万": ["w", "an", 4], "众": ["zh", "ong", 4],
};
const IDIOM = "一心一意";
const OPTIONS = ["心想事成", "一石二鸟", "万众一心", "三心二意", "一心一意"];

export function HandleGrader() {
  const [played, setPlayed] = useState(["心想事成"]);
  const part = (w: string, k: 0 | 1 | 2) => [...w].map((ch) => String(PINYIN[ch][k]));

  return (
    <>
      <div className="fig-controls">
        {OPTIONS.map((o) => (
          <button
            key={o}
            type="button"
            style={{ fontFamily: "var(--wd-cjk)", fontSize: "0.95rem" }}
            disabled={played.includes(o)}
            onClick={() => setPlayed([...played, o])}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="wd-han" aria-live="polite">
        {played.map((w) => {
          const chars = grade([...w], [...IDIOM]);
          const [ini, fin, tone] = ([0, 1, 2] as const).map((k) => grade(part(w, k), part(IDIOM, k)));
          return (
            <div key={w} className="wd-hrow">
              {[...w].map((ch, i) => {
                const [initial, final, t] = PINYIN[ch];
                return (
                  <div key={i} className="wd-hcell">
                    <Tile ch={ch} state={chars[i] === "g" ? "t" : chars[i] === "y" ? "o" : null} extra="cjk" />
                    <div className="wd-py" aria-label={`${ch}: initial ${initial || "none"}, final ${final}, tone ${t}`}>
                      <b className={initial ? ini[i] : "none"}>{initial || "–"}</b>
                      <b className={fin[i]}>{final}</b>
                      <b className={tone[i]}>{t}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="fig-controls">
        <button type="button" onClick={() => setPlayed(["心想事成"])}>Start over</button>
        <span className="fig-msg">{played.includes(IDIOM) ? "一心一意, yī xīn yī yì: wholeheartedly." : ""}</span>
      </div>
    </>
  );
}

// ── Fig. 6: the takedown, one square per fork ──

const FORKS = 1900;

// A fixed, seeded shuffle, so the squares go out in the same scattered order
// every time.
const TAKEDOWN_ORDER = (() => {
  const o = Array.from({ length: FORKS }, (_, i) => i);
  let seed = 11;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = FORKS - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
})();

export function ForkTakedown() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gone = useRef(new Uint8Array(FORKS));
  const removed = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [label, setLabel] = useState("Send the notice");

  const draw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(canvasRef.current!);
    const on = css.getPropertyValue("--wd-g").trim();
    const off = css.getPropertyValue("--rule").trim();
    ctx.clearRect(0, 0, 1000, 200);
    for (let i = 0; i < FORKS; i++) {
      ctx.fillStyle = gone.current[i] ? off : on;
      ctx.fillRect((i % 100) * 10, Math.floor(i / 100) * 10 + 5, 8, 8);
    }
  };

  useEffect(() => {
    draw();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const send = () => {
    if (timer.current) return;
    if (removed.current >= FORKS) {
      gone.current.fill(0);
      removed.current = 0;
      draw();
      setLabel("Send the notice");
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gone.current.fill(1);
      removed.current = FORKS;
      draw();
      setLabel("Restore");
      return;
    }
    timer.current = setInterval(() => {
      for (let k = 0; k < 40 && removed.current < FORKS; k++) gone.current[TAKEDOWN_ORDER[removed.current++]] = 1;
      draw();
      if (removed.current >= FORKS) {
        clearInterval(timer.current!);
        timer.current = null;
        setLabel("Restore");
      }
    }, 30);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="wd-forks"
        width={1000}
        height={200}
        aria-label="About 1,900 squares, one for each fork of Reactle"
      />
      <div className="fig-controls">
        <button type="button" onClick={send}>{label}</button>
      </div>
    </>
  );
}

// ── The -dle maker ──

const KNOWN_DLES = new Set([
  "birdle", "plantle", "cardle", "colordle", "cloudle", "dogsdle", "heardle", "worldle", "absurdle", "lewdle",
  "quordle", "octordle", "sedecordle", "squirdle", "taylordle", "weddle", "nerdle", "dordle", "gordle", "byrdle",
  "searchdle", "foodle", "redactle", "wordle",
]);

function dle(word: string) {
  const w = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  if (/le$/i.test(w)) return w;
  if (/[dt]$/i.test(w)) return w + "le";
  if (/e$/i.test(w)) return w.slice(0, -1) + "dle";
  return w + "dle";
}

export function DleMaker() {
  const [text, setText] = useState("cloud");
  const word = text.replace(/[^A-Za-z]/g, "");

  let tiles: { ch: string; state: string | null }[] = [];
  let note = "Type a word.";
  if (word.toLowerCase() === "cat") {
    tiles = [..."CATDLE"].map((ch) => ({ ch, state: "x" }));
    note = "Catdle. In January 2023 it didn't exist.";
  } else if (word) {
    const name = dle(word);
    const known = KNOWN_DLES.has(name.toLowerCase());
    const stem = name.length - (/dle$/i.test(name) ? 3 : 2);
    tiles = [...name].map((ch, i) => ({ ch, state: i >= stem ? (known ? "g" : "y") : null }));
    note = known ? `${name} is real. It's on Language Log's list.` : `${name} isn't on Language Log's list. Someone may have made it since.`;
  }

  return (
    <aside className="wd-aside">
      <div className="fig-controls">
        <label htmlFor="wd-dle"><b>Make your own -dle</b></label>
        <input
          type="text"
          id="wd-dle"
          maxLength={12}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ letterSpacing: "0.02em" }}
        />
      </div>
      <div className="wd-tiles" style={{ flexWrap: "wrap", marginTop: 10 }}>
        {tiles.map((t, i) => <Tile key={i} ch={t.ch} state={t.state} extra="sm" />)}
      </div>
      <div style={{ marginTop: 8 }}>{note}</div>
    </aside>
  );
}

// ── The share grid, at the end ──

export function ShareGrid() {
  return (
    <div className="wd-tiles" style={{ flexDirection: "column" }} aria-label="A Wordle share grid: three rows, the last all green">
      {["xyxxg", "xgygg", "ggggg"].map((row, r) => (
        <div key={r} className="wd-tiles">
          {[...row].map((st, i) => <Tile key={i} state={st} extra="xs" />)}
        </div>
      ))}
    </div>
  );
}
