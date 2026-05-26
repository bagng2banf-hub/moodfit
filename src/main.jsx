import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Aperture,
  Camera,
  ChevronRight,
  CloudRain,
  Crown,
  Layers,
  Moon,
  Plus,
  Save,
  Search,
  Send,
  Shirt,
  Sparkles,
  Sun,
  Trees,
  Upload,
} from "lucide-react";
import "./index.css";

const themes = {
  white: { label: "White", icon: Sun, caption: "아이보리 매거진" },
  dark: { label: "Dark", icon: Moon, caption: "블랙 크롬 럭셔리" },
  wood: { label: "Wood", icon: Trees, caption: "월넛 부티크" },
};

const moods = {
  cozy: { label: "Cozy", icon: Sparkles, prompt: "아이보리 니트와 크림 팬츠, 따뜻한 스튜디오 무드", palette: "크림, 피치, 캐시미어" },
  luxury: { label: "Luxury", icon: Crown, prompt: "블랙 새틴 블레이저, 실버 주얼리, 포멀 디너", palette: "블랙, 실버, 스포트라이트" },
  street: { label: "Street", icon: Shirt, prompt: "오버사이즈 봄버, 카고 데님, 네온 시티 나이트", palette: "차콜, 데님, 네온 포인트" },
  rain: { label: "Rain", icon: CloudRain, prompt: "롱 트렌치코트, 글로시 부츠, 비 오는 갤러리 데이트", palette: "글라스, 리플렉션, 쿨 그레이" },
};

const seedWardrobe = [
  { id: 1, name: "Ivory Cashmere Knit", slot: "top", mood: "cozy", color: "#efe0c8", accent: "#f08b56", pattern: "knit", source: "curated" },
  { id: 2, name: "Chrome Satin Blazer", slot: "outer", mood: "luxury", color: "#111111", accent: "#eeeeee", pattern: "gloss", source: "curated" },
  { id: 3, name: "Oversized Bomber", slot: "outer", mood: "street", color: "#20242a", accent: "#67ffe4", pattern: "plain", source: "curated" },
  { id: 4, name: "Long Glass Trench", slot: "outer", mood: "rain", color: "#d7dce0", accent: "#8aa5b3", pattern: "stripe", source: "curated" },
  { id: 5, name: "Wide Charcoal Trousers", slot: "bottom", mood: "luxury", color: "#272727", accent: "#d4d4d4", pattern: "plain", source: "curated" },
  { id: 6, name: "Cargo Denim", slot: "bottom", mood: "street", color: "#455568", accent: "#bbff42", pattern: "denim", source: "curated" },
  { id: 7, name: "Pearl Slingback", slot: "shoes", mood: "luxury", color: "#f4f1ea", accent: "#c5c5c5", pattern: "gloss", source: "curated" },
  { id: 8, name: "Gloss Rain Boot", slot: "shoes", mood: "rain", color: "#111820", accent: "#7fd3ff", pattern: "gloss", source: "curated" },
];

const initialFit = {
  top: seedWardrobe[0],
  outer: seedWardrobe[1],
  bottom: seedWardrobe[4],
  shoes: seedWardrobe[6],
};

const inspirationPins = ["소프트 테일러링", "레인 글라스 에디토리얼", "뮤지엄 데이트", "블랙 크롬 나이트", "선데이 캐시미어", "오버사이즈 스트리트"];
const storageKey = "moodfit-premium-state";
const scanSlots = ["auto", "top", "outer", "bottom", "shoes"];

function App() {
  const stored = loadState();
  const [theme, setTheme] = useState(stored?.theme || "white");
  const [mood, setMood] = useState(stored?.mood || "cozy");
  const [prompt, setPrompt] = useState(stored?.prompt || moods.cozy.prompt);
  const [wardrobe, setWardrobe] = useState(stored?.wardrobe || seedWardrobe);
  const [fit, setFit] = useState(stored?.fit || initialFit);
  const [activePiece, setActivePiece] = useState(seedWardrobe[0]);
  const [savedFits, setSavedFits] = useState(stored?.savedFits || []);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [scannerOn, setScannerOn] = useState(false);
  const [scanStatus, setScanStatus] = useState("옷 사진을 업로드하면 색상, 카테고리, 무드를 자동으로 스캔합니다.");
  const [scanSlot, setScanSlot] = useState("auto");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const look = useMemo(() => makeLook(prompt, mood, fit), [prompt, mood, fit]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ theme, mood, prompt, wardrobe, fit, savedFits }));
  }, [theme, mood, prompt, wardrobe, fit, savedFits]);

  function generate(nextPrompt = prompt) {
    const text = nextPrompt.toLowerCase();
    const nextMood = detectMood(text);
    const nextFit = { ...fit };

    for (const slot of ["top", "outer", "bottom", "shoes"]) {
      const candidate = wardrobe.find((item) => item.slot === slot && item.mood === nextMood);
      if (candidate) nextFit[slot] = candidate;
    }

    setMood(nextMood);
    setPrompt(nextPrompt);
    setFit(nextFit);
    setDrawerOpen(true);
  }

  function wearPiece(item) {
    setFit((current) => ({ ...current, [item.slot]: item }));
    setActivePiece(item);
    setMood(item.mood);
    setDrawerOpen(true);
  }

  function saveFit() {
    const fitName = `${moods[mood].label} Look ${String(savedFits.length + 1).padStart(2, "0")}`;
    setSavedFits((current) => [{ id: Date.now(), name: fitName, mood, look, fit }, ...current].slice(0, 8));
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setScannerOn(true);
    setScanStatus("사진을 분석하는 중입니다. 색감과 무늬를 읽고 있어요.");

    const scan = await scanGarment(file, scanSlot);
    const newPiece = {
      id: Date.now(),
      name: scan.name,
      slot: scan.slot,
      mood: scan.mood,
      color: scan.color,
      accent: scan.accent,
      pattern: scan.pattern,
      image: scan.image,
      source: "scanned",
    };

    setWardrobe((current) => [newPiece, ...current]);
    wearPiece(newPiece);
    setScanStatus(`${scan.name}으로 저장했고, 지금 아바타에 입혔습니다.`);
    event.target.value = "";
  }

  return (
    <main className={`app theme-${theme} mood-${mood}`}>
      <Ambient />
      <input ref={fileInputRef} className="file-input" type="file" accept="image/*" onChange={handleUpload} />

      <header className="topbar">
        <a className="brand" href="#studio" aria-label="MoodFit home">
          <span className="mark">MF</span>
          <span>
            <strong>MoodFit</strong>
            <small>프리미엄 스타일링 스튜디오</small>
          </span>
        </a>

        <nav className="nav" aria-label="메인 메뉴">
          <a href="#studio">Studio</a>
          <a href="#wardrobe">Wardrobe</a>
          <a href="#looks">Looks</a>
          <a href="#scanner">Scanner</a>
        </nav>

        <div className="theme-switcher" aria-label="테마 선택">
          {Object.entries(themes).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <button className={theme === key ? "active" : ""} key={key} onClick={() => setTheme(key)} type="button">
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <section className="hero" id="studio">
        <section className="copy glass">
          <p className="eyebrow">Fashion platform, not a chatbot</p>
          <h1>오늘의 분위기를 먼저 입으세요.</h1>
          <p className="lead">
            옷장, 날씨, 무드, 장소를 하나의 스타일 장면으로 엮어주는 프리미엄 패션 스튜디오입니다.
          </p>

          <div className="prompt">
            <Search size={18} />
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && generate()}
              placeholder="예: 비 오는 날 갤러리 데이트에 어울리는 트렌치 룩"
            />
            <button onClick={() => generate()} aria-label="스타일 추천 생성" type="button">
              <Send size={18} />
            </button>
          </div>

          <div className="moods" aria-label="무드 선택">
            {Object.entries(moods).map(([key, item]) => {
              const Icon = item.icon;
              return (
                <button className={mood === key ? "active" : ""} key={key} onClick={() => { setMood(key); setPrompt(item.prompt); }} type="button">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="fit-actions">
            <button className="dark-btn" onClick={saveFit} type="button"><Save size={17} /> 현재 핏 저장</button>
            <button className="ghost-btn" onClick={() => fileInputRef.current?.click()} type="button"><Upload size={17} /> 옷 사진 업로드</button>
          </div>
        </section>

        <AvatarStage look={look} mood={mood} theme={theme} dragging={dragging} setDragging={setDragging} onOpen={() => setDrawerOpen(true)} />

        <aside className="look glass">
          <p className="eyebrow">Outfit recommendation</p>
          <h2>{look.title}</h2>
          <p>{look.copy}</p>
          <div className="tags">{look.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="wearing-list">
            {Object.entries(fit).map(([slot, item]) => (
              <button key={slot} onClick={() => setDrawerOpen(true)} type="button">
                <small>{slot}</small>
                <strong>{item.name}</strong>
                <em>{item.pattern || "plain"} pattern</em>
              </button>
            ))}
          </div>
          <button className="dark-btn wide" onClick={() => setDrawerOpen(true)} type="button">
            레이어 살펴보기 <ChevronRight size={18} />
          </button>
        </aside>
      </section>

      <section className={`drawer glass ${drawerOpen ? "open" : ""}`} id="wardrobe">
        <div className="section-title">
          <div>
            <p className="eyebrow">Wardrobe system</p>
            <h2>옷을 클릭하면 아바타가 바로 입습니다.</h2>
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="옷장 열고 닫기" type="button"><Layers size={19} /></button>
        </div>
        <div className="garments">
          {wardrobe.map((item) => (
            <button className={fit[item.slot]?.id === item.id ? "garment selected" : "garment"} key={item.id} onClick={() => wearPiece(item)} type="button">
              {item.image ? <img className="thumb" src={item.image} alt="" /> : <span className={`swatch pattern-${item.pattern || "plain"}`} style={{ "--fabric": item.color, "--accent": item.accent }} />}
              <strong>{item.name}</strong>
              <small>{item.slot} · {moods[item.mood].label} · {item.pattern || "plain"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="feature-grid" id="looks">
        <section className="panel glass">
          <div className="section-title"><div><p className="eyebrow">Mood-based recommendations</p><h2>추천 스타일 방향</h2></div><Sparkles /></div>
          <article className="rec"><small>styling move</small><h3>스타일링 포인트</h3><p>{look.recommendation}</p></article>
          <article className="rec"><small>wardrobe logic</small><h3>질감 조합</h3><p>{activePiece.name}에 대비되는 소재를 더하면 에디토리얼 깊이가 살아납니다.</p></article>
          <article className="rec"><small>weather card</small><h3>날씨 대응</h3><p>{look.occasion}</p></article>
        </section>

        <section className="panel glass">
          <div className="section-title"><div><p className="eyebrow">Saved looks</p><h2>저장한 핏</h2></div><Plus /></div>
          <div className="fit-grid">
            {savedFits.length === 0 ? <p className="empty">마음에 드는 착장을 저장하면 개인 룩 아카이브가 만들어집니다.</p> : savedFits.map((saved) => (
              <button className="fit-card" key={saved.id} onClick={() => { setMood(saved.mood); setFit(saved.fit); }} type="button">
                <span>{moods[saved.mood].label}</span>
                <strong>{saved.name}</strong>
                <small>{Object.values(saved.fit).map((item) => item.name.split(" ")[0]).join(" / ")}</small>
              </button>
            ))}
          </div>
          <div className="pins">{inspirationPins.map((pin, index) => <button className={`pin pin-${index + 1}`} key={pin} type="button"><span>{moods[mood].label}</span><strong>{pin}</strong></button>)}</div>
        </section>

        <section className="panel glass" id="scanner">
          <div className="section-title">
            <div><p className="eyebrow">Camera clothing scanner</p><h2>옷 사진 스캔</h2></div>
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="옷 사진 업로드" type="button"><Camera size={20} /></button>
          </div>
          <div className="slot-picker" aria-label="스캔 카테고리">
            {scanSlots.map((slot) => (
              <button className={scanSlot === slot ? "active" : ""} key={slot} onClick={() => setScanSlot(slot)} type="button">{slot}</button>
            ))}
          </div>
          <button className={scannerOn ? "scanner active" : "scanner"} onClick={() => fileInputRef.current?.click()} type="button">
            <Aperture size={58} />
            <span>{scanStatus}</span>
          </button>
        </section>
      </section>
    </main>
  );
}

function AvatarStage({ look, mood, theme, dragging, setDragging, onOpen }) {
  const start = useRef({ x: 0, y: 0 });
  const begin = (event) => {
    const point = "touches" in event ? event.touches[0] : event;
    start.current = { x: point.clientX, y: point.clientY };
    setDragging(true);
  };
  const end = (event) => {
    const point = "changedTouches" in event ? event.changedTouches[0] : event;
    setDragging(false);
    if (Math.hypot(point.clientX - start.current.x, point.clientY - start.current.y) > 18) onOpen();
  };

  return (
    <button className={`stage glass ${dragging ? "dragging" : ""}`} onMouseDown={begin} onMouseUp={end} onTouchStart={begin} onTouchEnd={end} type="button">
      <div className="spotlight" />
      <FashionAvatar look={look} mood={mood} />
      <span className="caption"><small>현재 테마</small><strong>{themes[theme].caption}</strong></span>
    </button>
  );
}

function FashionAvatar({ look, mood }) {
  return (
    <div className={`avatar pose-${mood}`}>
      <i className="glow" />
      <i className="head" /><i className="neck" />
      <i className={`torso pattern-${look.topPattern}`} style={{ "--cloth": look.top, "--trim": look.trim }} />
      <i className={`outer left pattern-${look.outerPattern}`} style={{ "--cloth": look.outer }} /><i className={`outer right pattern-${look.outerPattern}`} style={{ "--cloth": look.outer }} />
      <i className="arm left" /><i className="arm right" />
      <i className={`bottom pattern-${look.bottomPattern}`} style={{ "--cloth": look.bottom }} />
      <i className="leg left" /><i className="leg right" />
      <i className="shoe left" style={{ "--cloth": look.shoes }} /><i className="shoe right" style={{ "--cloth": look.shoes }} />
      <i className="flare" />
    </div>
  );
}

function Ambient() {
  return <div className="ambient" aria-hidden="true"><i className="grain" /><i className="halo a" /><i className="halo b" /><i className="rain" /><i className="chrome c1" /><i className="chrome c2" /></div>;
}

function makeLook(prompt, mood, fit) {
  const base = {
    cozy: ["Warm Ivory Atelier", "부드러운 아이보리 니트와 정돈된 볼륨으로 따뜻한 부티크 무드를 만듭니다.", ["cream", "cashmere", "soft volume"], "톤을 부드럽게 맞추고 얼굴 가까이에 피치 포인트를 하나만 더하세요.", "쌀쌀한 날에는 얇은 아우터를 더해 실내외 온도 차를 자연스럽게 커버합니다."],
    luxury: ["Black Chrome Evening", "새틴 구조감과 실버 포인트가 만드는 절제된 포멀 실루엣입니다.", ["satin", "silver", "formal posture"], "금속 포인트는 귀걸이, 힐, 백 하드웨어 중 하나만 선택하면 더 고급스럽습니다.", "저녁 약속이나 호텔 라운지처럼 조도가 낮은 공간에서 가장 선명하게 보입니다."],
    street: ["Neon Street Silhouette", "오버사이즈 레이어와 데님 무게감으로 여유 있는 스트리트 포즈를 만듭니다.", ["oversized", "cargo", "neon accent"], "큰 실루엣에는 선명한 슈즈나 네온 포인트 하나로 균형을 잡으세요.", "바람이 있는 날에는 무게감 있는 아우터가 실루엣을 안정적으로 잡아줍니다."],
    rain: ["Rain Glass Trench", "트렌치와 글로시 부츠가 비 오는 거리의 반사를 세련되게 받아냅니다.", ["trench", "reflection", "weather-ready"], "하의나 슈즈 쪽에 광택을 두면 젖은 바닥의 반사와 잘 어울립니다.", "비가 오거나 기온이 낮을 때는 실내 카페 동선을 함께 잡는 것이 좋습니다."],
  }[mood];

  const look = {
    title: base[0],
    copy: base[1],
    tags: base[2],
    recommendation: base[3],
    occasion: base[4],
    top: fit.top.color,
    outer: fit.outer.color,
    bottom: fit.bottom.color,
    shoes: fit.shoes.color,
    trim: fit.top.accent,
    topPattern: fit.top.pattern || "plain",
    outerPattern: fit.outer.pattern || "plain",
    bottomPattern: fit.bottom.pattern || "plain",
  };

  if (prompt.toLowerCase().includes("dress") || prompt.includes("드레스")) {
    return { ...look, bottom: look.top, title: `${look.title} Dress Edit`, tags: ["one-piece", ...look.tags.slice(0, 2)] };
  }

  return look;
}

function detectMood(text) {
  if (text.includes("rain") || text.includes("trench") || text.includes("boot") || text.includes("비") || text.includes("트렌치")) return "rain";
  if (text.includes("street") || text.includes("bomber") || text.includes("cargo") || text.includes("denim") || text.includes("스트리트") || text.includes("데님")) return "street";
  if (text.includes("black") || text.includes("satin") || text.includes("formal") || text.includes("blazer") || text.includes("블랙") || text.includes("포멀")) return "luxury";
  return "cozy";
}

function detectSlot(fileName, preferredSlot = "auto") {
  if (preferredSlot !== "auto") return preferredSlot;
  const name = fileName.toLowerCase();
  if (name.includes("shoe") || name.includes("boot") || name.includes("sneaker")) return "shoes";
  if (name.includes("pant") || name.includes("denim") || name.includes("jean") || name.includes("skirt")) return "bottom";
  if (name.includes("coat") || name.includes("jacket") || name.includes("blazer") || name.includes("trench") || name.includes("bomber")) return "outer";
  return "top";
}

function detectPattern(fileName, colorSpread) {
  const name = fileName.toLowerCase();
  if (name.includes("stripe") || name.includes("pinstripe")) return "stripe";
  if (name.includes("check") || name.includes("plaid")) return "check";
  if (name.includes("dot") || name.includes("polka")) return "dot";
  if (name.includes("denim") || name.includes("jean")) return "denim";
  if (name.includes("knit") || name.includes("sweater")) return "knit";
  if (name.includes("leather") || name.includes("gloss") || name.includes("satin")) return "gloss";
  if (colorSpread > 58) return "check";
  if (colorSpread > 34) return "stripe";
  return "plain";
}

function colorToMood(hex) {
  const rgb = hexToRgb(hex);
  const brightness = (rgb.r + rgb.g + rgb.b) / 3;
  if (brightness < 70) return "luxury";
  if (rgb.b > rgb.r + 24) return "rain";
  if (rgb.g > rgb.r + 18) return "street";
  return "cozy";
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
}

function componentToHex(value) {
  return value.toString(16).padStart(2, "0");
}

function rgbToHex(r, g, b) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function scanGarment(file, preferredSlot) {
  return new Promise((resolve) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        const samples = [];

        for (let i = 0; i < pixels.length; i += 16) {
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          samples.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
          count += 1;
        }

        const color = rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
        const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
        const variance = samples.reduce((sum, value) => sum + Math.abs(value - average), 0) / samples.length;
        const slot = detectSlot(file.name, preferredSlot);
        const mood = colorToMood(color);
        const pattern = detectPattern(file.name, variance);
        const label = slot === "outer" ? "Scanned Outerwear" : slot === "bottom" ? "Scanned Bottom" : slot === "shoes" ? "Scanned Shoes" : "Scanned Top";

        resolve({ name: label, slot, mood, color, accent: moods[mood].label === "Luxury" ? "#f2f2ee" : "#ffffff", pattern, image: reader.result });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

createRoot(document.getElementById("root")).render(<App />);
