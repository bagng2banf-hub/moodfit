const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const escapeHtml = (value) =>
  String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const colorMap = {
  화이트: "#f2eee4",
  블랙: "#101010",
  차콜: "#242424",
  크림: "#d8cab7",
  실버: "#c6c4be",
  네이비: "#111a2e",
  데님: "#2f5577",
  브라운: "#5a4234",
  그레이: "#8d8b86",
};

const skinMap = {
  bright: { label: "밝은 톤", color: "#e7b898" },
  medium: { label: "중간 톤", color: "#c98e68" },
  dark: { label: "딥 톤", color: "#82543f" },
  cool: { label: "쿨톤", color: "#ddb1a5" },
  warm: { label: "웜톤", color: "#d99b72" },
};

const styleFamilies = ["Minimal", "Street", "Old Money", "Darkwear", "Classic", "Avant-garde"];
const tabs = [
  ["profile", "프로필"],
  ["body", "체형"],
  ["wardrobe", "옷장"],
  ["coach", "코치"],
];

const prompts = [
  "도회적인 블랙 미니멀",
  "올드머니 데이트룩",
  "무심한 스트릿 캐주얼",
  "차분한 전시회 룩",
  "클래식 오피스 룩",
];

const defaultWardrobe = [
  item("w1", "COS 크림 셔츠", "상의", "크림", "코튼", "정핏", "봄", "COS", 89000, "자주"),
  item("w2", "블랙 울 블레이저", "아우터", "블랙", "울", "오버핏", "가을", "The Row", 210000, "가끔"),
  item("w3", "차콜 와이드 슬랙스", "하의", "차콜", "울 블렌드", "와이드", "가을", "SSENSE", 129000, "자주"),
  item("w4", "화이트 레더 스니커즈", "신발", "화이트", "레더", "정핏", "봄", "Common Projects", 168000, "자주"),
  item("w5", "실버 체인 네크리스", "악세사리", "실버", "메탈", "정핏", "봄", "Gentle Monster", 49000, "자주"),
  item("w6", "브라운 미니백", "가방", "브라운", "레더", "정핏", "가을", "Archive", 76000, "가끔"),
];

function item(id, name, category, color, material, fit, season, brand, price, frequency) {
  return { id, name, category, color, material, fit, season, brand, price, frequency, image: "", tags: [category, fit, season] };
}

let userProfile = {
  gender: "none",
  height: 165,
  weight: 55,
  bodyType: "normal",
  faceShape: "oval",
  skinTone: "medium",
  shoulderWidth: 40,
  waist: 27,
  legLength: 92,
  mood: "calm",
  schedule: "전시회",
  place: "성수",
  weather: "선선한 봄",
  budget: 180000,
  styleTaste: "Minimal",
};

let wardrobeItems = loadWardrobe();
let currentOutfit = {
  top: bestByCategory("상의"),
  bottom: bestByCategory("하의"),
  outer: bestByCategory("아우터"),
  shoes: bestByCategory("신발"),
  bag: bestByCategory("가방"),
  accessories: [bestByCategory("악세사리")].filter(Boolean),
};

let state = {
  tab: "profile",
  isThinking: false,
  rotate: 0,
  loggedInUser: localStorage.getItem("moodfit-user") || "",
};

function loadWardrobe() {
  try {
    const saved = JSON.parse(localStorage.getItem("moodfit-wardrobe-editorial") || "null");
    return Array.isArray(saved) && saved.length ? saved.filter((entry) => entry?.category && entry?.name) : defaultWardrobe;
  } catch {
    return defaultWardrobe;
  }
}

function saveWardrobe() {
  localStorage.setItem("moodfit-wardrobe-editorial", JSON.stringify(wardrobeItems));
}

function init() {
  try {
    bindGlobalEvents();
    renderPrompts();
    renderTabs();
    renderPanel();
    generateEditorial(false);
    renderAuth();
    playIntro();
  } catch (error) {
    renderBootError(error);
  }
}

function renderBootError(error) {
  const message = escapeHtml(error?.message || error || "알 수 없는 오류");
  const result = $("#result-content");
  const lookbook = $("#lookbook-grid");
  if (result) {
    result.innerHTML = `
      <section class="result-section">
        <h2>화면을 불러오지 못했습니다</h2>
        <p>초기화 중 오류가 발생했습니다. 오류 내용: ${message}</p>
      </section>`;
  }
  if (lookbook) {
    lookbook.innerHTML = `
      <article class="look-card"><span>ERROR</span><h3>Reload Required</h3><p>브라우저를 새로고침하거나 저장된 옷장 데이터를 초기화해주세요.</p></article>`;
  }
}

function bindGlobalEvents() {
  $("#generate-style")?.addEventListener("click", () => generateEditorial(true));
  $("#style-brief")?.addEventListener("input", (event) => {
    interpretBrief(event.target.value);
    applyModel(true);
    renderResults();
    renderLookbook();
  });
  $("#open-viewer")?.addEventListener("click", openViewer);
  $("#close-viewer")?.addEventListener("click", closeViewer);
  $("#viewer")?.addEventListener("click", (event) => {
    if (event.target.id === "viewer") closeViewer();
  });
  $("#open-login")?.addEventListener("click", () => $("#login-modal")?.classList.remove("hidden"));
  $("#close-login")?.addEventListener("click", () => $("#login-modal")?.classList.add("hidden"));
  $("#login-form")?.addEventListener("submit", handleLogin);

  const stage = $("#model-stage");
  if (!stage) return;
  let dragging = false;
  let lastX = 0;
  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    state.rotate += (event.clientX - lastX) * 0.35;
    lastX = event.clientX;
    applyModel(false);
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
}

function playIntro() {
  document.body.classList.add("intro-ready");
  setTimeout(() => document.body.classList.remove("intro-ready"), 1200);
}

function renderPrompts() {
  $("#prompt-row").innerHTML = prompts.map((prompt) => `<button type="button" data-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("");
  $$("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      $("#style-brief").value = button.dataset.prompt;
      interpretBrief(button.dataset.prompt);
      generateEditorial(true);
    });
  });
}

function renderTabs() {
  $("#tabs").innerHTML = tabs.map(([id, label]) => `<button type="button" class="${state.tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("");
  $$("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      renderTabs();
      renderPanel();
    });
  });
}

function renderPanel() {
  const panel = $("#panel-content");
  if (state.tab === "profile") panel.innerHTML = renderProfilePanel();
  if (state.tab === "body") panel.innerHTML = renderBodyPanel();
  if (state.tab === "wardrobe") panel.innerHTML = renderWardrobePanel();
  if (state.tab === "coach") panel.innerHTML = renderCoachPanel();
  bindPanelEvents();
}

function renderProfilePanel() {
  return `
    ${choice("성별", "gender", [["female", "여성"], ["male", "남성"], ["neutral", "중성"], ["none", "선택 안 함"]])}
    <div class="two-col">${field("일정", "schedule")}${field("장소", "place")}</div>
    <div class="two-col">${field("날씨", "weather")}${field("예산", "budget", "number")}</div>
    ${choice("감성 무드", "mood", [["calm", "차분한"], ["urban", "도회적인"], ["date", "데이트"], ["effortless", "무심한"], ["dark", "다크한"]])}
  `;
}

function renderBodyPanel() {
  return `
    ${choice("체형", "bodyType", [["slim", "마른형"], ["normal", "보통"], ["muscular", "근육형"], ["curvy", "통통형"], ["lower", "하체 발달형"], ["upper", "상체 발달형"]])}
    ${choice("얼굴형", "faceShape", [["round", "둥근형"], ["long", "긴형"], ["square", "각진형"], ["oval", "계란형"]])}
    ${choice("피부톤", "skinTone", [["bright", "밝음"], ["medium", "중간"], ["dark", "딥"], ["cool", "쿨톤"], ["warm", "웜톤"]])}
    <div class="two-col">${field("키 cm", "height", "number")}${field("몸무게 kg", "weight", "number")}</div>
    <div class="two-col">${field("어깨너비 cm", "shoulderWidth", "number")}${field("허리 inch", "waist", "number")}</div>
    ${field("다리 길이 cm", "legLength", "number")}
  `;
}

function renderWardrobePanel() {
  return `
    <form class="wardrobe-form" id="wardrobe-form">
      <div class="two-col">${formInput("옷 이름", "name", "예: 프라다 무드 블랙 코트")}${formInput("브랜드", "brand", "예: COS")}</div>
      <div class="two-col">${formSelect("카테고리", "category", ["상의", "하의", "아우터", "신발", "가방", "악세사리"])}${formSelect("색상", "color", Object.keys(colorMap))}</div>
      <div class="two-col">${formInput("소재", "material", "울, 코튼, 레더")}${formSelect("핏", "fit", ["슬림", "정핏", "오버핏", "와이드"])}</div>
      <div class="two-col">${formSelect("계절", "season", ["봄", "여름", "가을", "겨울"])}${formInput("가격", "price", "89000", "number")}</div>
      ${formSelect("자주 입는 정도", "frequency", ["자주", "가끔", "거의 안 입음"])}
      <button class="primary-soft" type="submit">옷장에 저장</button>
    </form>
    <div class="closet-toolbar"><strong>Virtual Wardrobe</strong><span>클릭하면 모델이 착용합니다.</span></div>
    <div class="closet-grid">${wardrobeItems.map(wardrobeCard).join("")}</div>
    <div class="avatar-actions">
      <button class="primary-soft" id="recommend-wardrobe" type="button">오늘 날씨 + 일정으로 추천</button>
      <button class="ghost-soft" id="share-style" type="button">스타일 카드 저장</button>
    </div>
  `;
}

function renderCoachPanel() {
  return `
    <div class="ai-box">
      <strong>AI 스타일 코치</strong>
      <p>${styleCoach()}</p>
    </div>
    <div class="ai-box">
      <strong>감성 기반 추천</strong>
      <p>${moodCoach()}</p>
    </div>
    <button class="analysis-button" id="refresh-analysis" type="button">큐레이션 다시 생성</button>
  `;
}

function field(label, key, type = "text") {
  return `<label class="field"><span>${escapeHtml(label)}</span><input data-profile="${key}" type="${type}" value="${escapeHtml(userProfile[key])}" /></label>`;
}

function choice(label, key, options) {
  return `
    <div class="choice">
      <p>${escapeHtml(label)}</p>
      <div>${options.map(([value, text]) => `<button type="button" class="chip ${userProfile[key] === value ? "active" : ""}" data-choice="${key}:${value}">${escapeHtml(text)}</button>`).join("")}</div>
    </div>`;
}

function formInput(label, name, placeholder, type = "text") {
  return `<label class="field"><span>${escapeHtml(label)}</span><input name="${name}" type="${type}" placeholder="${escapeHtml(placeholder)}" /></label>`;
}

function formSelect(label, name, options) {
  return `<label class="field"><span>${escapeHtml(label)}</span><select name="${name}">${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}</select></label>`;
}

function wardrobeCard(entry) {
  return `
    <article class="closet-item" data-wear="${escapeHtml(entry.id)}" draggable="true">
      <span class="closet-swatch" style="background:${escapeHtml(colorOf(entry))}"></span>
      <strong>${escapeHtml(entry.name)}</strong>
      <small>${escapeHtml(entry.brand || "Brand")} · ${escapeHtml(entry.category)} · ${escapeHtml(entry.fit)}</small>
      <em>${Number(entry.price || 0).toLocaleString()}원 · ${escapeHtml(entry.frequency)}</em>
    </article>`;
}

function bindPanelEvents() {
  $$("[data-profile]").forEach((input) => {
    input.addEventListener("input", () => {
      userProfile[input.dataset.profile] = input.type === "number" ? Number(input.value) : input.value;
      generateEditorial(false);
    });
  });

  $$("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const [key, value] = button.dataset.choice.split(":");
      userProfile[key] = value;
      generateEditorial(false);
      renderTabs();
      renderPanel();
    });
  });

  $$("[data-wear]").forEach((card) => {
    card.addEventListener("click", () => wearItem(card.dataset.wear));
    card.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", card.dataset.wear));
  });

  $("#wardrobe-form")?.addEventListener("submit", addWardrobeItem);
  $("#recommend-wardrobe")?.addEventListener("click", () => generateEditorial(true));
  $("#refresh-analysis")?.addEventListener("click", () => generateEditorial(true));
  $("#share-style")?.addEventListener("click", saveStyleCard);
}

function addWardrobeItem(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const entry = item(
    `item-${Date.now()}`,
    form.get("name") || "이름 없는 옷",
    form.get("category"),
    form.get("color"),
    form.get("material") || "소재 미입력",
    form.get("fit"),
    form.get("season"),
    form.get("brand") || "Brand",
    Number(form.get("price")) || 0,
    form.get("frequency")
  );
  wardrobeItems.unshift(entry);
  saveWardrobe();
  renderPanel();
  generateEditorial(false);
}

function wearItem(id) {
  const entry = wardrobeItems.find((wardrobe) => wardrobe.id === id);
  if (!entry) return;
  const slot = { 상의: "top", 하의: "bottom", 아우터: "outer", 신발: "shoes", 가방: "bag", 악세사리: "accessories" }[entry.category];
  if (!slot) return;
  if (slot === "accessories") currentOutfit.accessories = [entry];
  else currentOutfit[slot] = entry;
  applyModel(true);
  renderResults();
  renderLookbook();
}

function generateEditorial(withRunway) {
  state.isThinking = Boolean(withRunway);
  interpretBrief($("#style-brief")?.value || "");
  recommendOutfit();
  applyModel(true);
  renderResults();
  renderLookbook();
  renderWearing();
  if (withRunway) {
    $("#model-panel").classList.add("runway-mode");
    setTimeout(() => {
      state.isThinking = false;
      $("#model-panel").classList.remove("runway-mode");
      renderResults();
    }, 800);
  }
}

function interpretBrief(text) {
  const value = text.toLowerCase();
  if (value.includes("스트릿") || value.includes("street")) userProfile.styleTaste = "Street";
  else if (value.includes("올드머니") || value.includes("old")) userProfile.styleTaste = "Old Money";
  else if (value.includes("다크") || value.includes("블랙") || value.includes("dark")) userProfile.styleTaste = "Darkwear";
  else if (value.includes("클래식") || value.includes("오피스") || value.includes("classic")) userProfile.styleTaste = "Classic";
  else if (value.includes("아방") || value.includes("avant")) userProfile.styleTaste = "Avant-garde";
  else userProfile.styleTaste = "Minimal";

  if (value.includes("데이트")) userProfile.mood = "date";
  else if (value.includes("무심")) userProfile.mood = "effortless";
  else if (value.includes("도회") || value.includes("성수")) userProfile.mood = "urban";
  else if (value.includes("다크") || value.includes("블랙")) userProfile.mood = "dark";
  else userProfile.mood = "calm";
}

function recommendOutfit() {
  currentOutfit.top = bestByCategory("상의");
  currentOutfit.bottom = bestByCategory("하의");
  currentOutfit.outer = bestByCategory("아우터");
  currentOutfit.shoes = bestByCategory("신발");
  currentOutfit.bag = bestByCategory("가방");
  currentOutfit.accessories = [bestByCategory("악세사리")].filter(Boolean);
}

function bestByCategory(category) {
  return wardrobeItems.filter((entry) => entry.category === category).sort((a, b) => scoreItem(b) - scoreItem(a))[0] || null;
}

function scoreItem(entry) {
  let score = 50;
  if (entry.frequency === "자주") score += 8;
  if (seasonFromWeather() === entry.season) score += 12;
  if (Number(entry.price) <= Number(userProfile.budget || 0)) score += 4;
  if (userProfile.styleTaste === "Minimal" && ["화이트", "크림", "블랙", "차콜"].includes(entry.color)) score += 10;
  if (userProfile.styleTaste === "Street" && ["데님", "블랙", "그레이"].includes(entry.color)) score += 10;
  if (userProfile.styleTaste === "Old Money" && ["크림", "브라운", "네이비"].includes(entry.color)) score += 11;
  if (userProfile.styleTaste === "Darkwear" && ["블랙", "차콜"].includes(entry.color)) score += 12;
  if (userProfile.bodyType === "upper" && entry.category === "아우터" && entry.fit === "오버핏") score -= 8;
  if (userProfile.bodyType === "lower" && entry.category === "하의" && entry.fit === "와이드") score += 5;
  return score;
}

function seasonFromWeather() {
  if (String(userProfile.weather).includes("겨울") || String(userProfile.weather).includes("추")) return "겨울";
  if (String(userProfile.weather).includes("여름") || String(userProfile.weather).includes("더")) return "여름";
  if (String(userProfile.weather).includes("가을")) return "가을";
  return "봄";
}

function renderResults() {
  const dna = styleDna();
  $("#result-content").innerHTML = `
    <section class="score-card">
      <div class="score-ring" style="--score:${moodScore()}"><strong>${moodScore()}</strong><span>Score</span></div>
      <div>
        <h2>${state.isThinking ? "런웨이 조명 조정 중" : "Editorial Curation Complete"}</h2>
        <p>${escapeHtml(userProfile.place)} · ${escapeHtml(userProfile.schedule)} · ${escapeHtml(moodLabel())} 기준으로 오늘의 룩을 큐레이션했습니다.</p>
        ${state.isThinking ? '<div class="skeleton-line"></div><div class="skeleton-line short"></div>' : ""}
      </div>
    </section>
    <button class="analysis-button" type="button" id="rerun-editorial">AI 큐레이션 다시 생성</button>
    ${section("Style DNA", dna.map((entry) => `${entry.name} ${entry.value}%`).join("<br>"))}
    ${section("AI 스타일 코치", styleCoach())}
    ${section("감성 기반 추천", moodCoach())}
    ${section("현재 착용 룩", outfitList())}
    ${section("공유 저장", "현재 스타일은 인스타 스토리/Pinterest 무드보드처럼 저장할 수 있는 카드 형태로 구성됩니다.")}
  `;
  $("#rerun-editorial")?.addEventListener("click", () => generateEditorial(true));
}

function section(title, body) {
  return `<section class="result-section"><h2>${escapeHtml(title)}</h2><p>${body}</p></section>`;
}

function styleDna() {
  const base = {
    Minimal: 14,
    Street: 10,
    "Old Money": 10,
    Darkwear: 10,
    Classic: 12,
    "Avant-garde": 8,
  };
  base[userProfile.styleTaste] += 42;
  if (userProfile.mood === "urban") base.Minimal += 10;
  if (userProfile.mood === "effortless") base.Street += 12;
  if (userProfile.mood === "date") base["Old Money"] += 9;
  if (userProfile.mood === "dark") base.Darkwear += 14;
  const total = Object.values(base).reduce((sum, value) => sum + value, 0);
  return styleFamilies
    .map((name) => ({ name, value: Math.round((base[name] / total) * 100) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

function moodScore() {
  const dnaTop = styleDna()[0]?.value || 50;
  let score = 64 + Math.round(dnaTop * 0.24);
  if (currentOutfit.top && currentOutfit.bottom && currentOutfit.shoes) score += 7;
  if (currentOutfit.outer?.season === seasonFromWeather()) score += 5;
  return Math.min(98, Math.max(55, score));
}

function outfitList() {
  const entries = Object.values(currentOutfit).flatMap((entry) => (Array.isArray(entry) ? entry : [entry])).filter(Boolean);
  return entries.map((entry) => `${escapeHtml(entry.category)} · ${escapeHtml(entry.brand)} ${escapeHtml(entry.name)} (${escapeHtml(entry.color)}, ${escapeHtml(entry.fit)})`).join("<br>");
}

function styleCoach() {
  if (userProfile.bodyType === "upper") return "상체가 발달한 편이라 오버핏 코트보다 어깨선이 정리된 블레이저가 더 고급스럽습니다.";
  if (userProfile.bodyType === "lower") return "하체에 볼륨이 있는 편이라 상체에 크림/화이트 포인트를 두면 비율이 위로 올라갑니다.";
  if (userProfile.styleTaste === "Old Money") return "이 코트에는 와이드 팬츠보다 스트레이트 슬랙스가 더 조용하고 비싼 인상을 만듭니다.";
  if (userProfile.styleTaste === "Darkwear") return "블랙끼리만 맞추면 평면적으로 보일 수 있어 실버 액세서리나 패브릭 차이를 넣는 것이 좋습니다.";
  return "상의와 하의의 폭을 모두 크게 잡기보다 한쪽만 여유 있게 두면 룩이 더 편집적으로 보입니다.";
}

function moodCoach() {
  const copy = {
    calm: "차분한 느낌은 채도를 낮추고 소재의 결을 살릴 때 가장 고급스럽습니다.",
    urban: "도회적인 느낌은 블랙, 차콜, 실버를 중심으로 선명한 실루엣을 잡는 것이 핵심입니다.",
    date: "데이트 무드는 너무 꾸민 느낌보다 크림 톤과 부드러운 레이어가 자연스럽습니다.",
    effortless: "무심한 느낌은 좋은 기본템을 살짝 크게 입고 액세서리를 최소화할 때 살아납니다.",
    dark: "다크한 무드는 네온보다 매트한 블랙과 소재 대비가 훨씬 세련돼 보입니다.",
  };
  return copy[userProfile.mood] || copy.calm;
}

function renderLookbook() {
  const looks = [
    {
      title: `${new Date().getFullYear()} Summer Minimal`,
      label: "LOOK 01",
      text: `${userProfile.place}의 빛과 어울리는 낮은 채도의 미니멀 룩.`,
      color: "rgba(232, 223, 209, 0.24)",
    },
    {
      title: "Urban Layered",
      label: "LOOK 02",
      text: "아우터와 팬츠의 선을 정리해 도시적인 비율을 만든 룩.",
      color: "rgba(140, 148, 160, 0.24)",
    },
    {
      title: `${userProfile.styleTaste} Mood`,
      label: "LOOK 03",
      text: "사용자의 Style DNA를 반영한 공유용 에디토리얼 카드.",
      color: "rgba(90, 80, 70, 0.26)",
    },
  ];
  $("#lookbook-grid").innerHTML = looks
    .map(
      (look) => `
        <article class="look-card" style="--look-color:${look.color}">
          <span>${escapeHtml(look.label)}</span>
          <h3>${escapeHtml(look.title)}</h3>
          <p>${escapeHtml(look.text)}</p>
        </article>`
    )
    .join("");
}

function applyModel(animate) {
  [$("#fashion-model"), $("#viewer-model")].forEach((model) => {
    if (!model) return;
    const skin = skinMap[userProfile.skinTone] || skinMap.medium;
    const shoulderBoost = userProfile.bodyType === "upper" || userProfile.bodyType === "muscular" ? 22 : userProfile.bodyType === "slim" ? -8 : 0;
    const hipBoost = userProfile.bodyType === "lower" || userProfile.bodyType === "curvy" ? 24 : 0;
    const shoulderWidth = Math.min(150, Math.max(78, userProfile.shoulderWidth * 2.2 + shoulderBoost));
    const hipWidth = Math.min(138, Math.max(70, userProfile.waist * 2.35 + hipBoost));
    const heightScale = Math.min(1.14, Math.max(0.9, userProfile.height / 165));
    const legHeight = Math.min(136, Math.max(78, userProfile.legLength * 1.02));
    const topFit = currentOutfit.top?.fit || "정핏";
    const bottomFit = currentOutfit.bottom?.fit || "정핏";
    model.dataset.gender = userProfile.gender;
    model.style.setProperty("--skin", skin.color);
    model.style.setProperty("--rotate", `${state.rotate}deg`);
    model.style.setProperty("--model-scale", heightScale);
    model.style.setProperty("--shoulder-width", `${shoulderWidth}px`);
    model.style.setProperty("--hip-width", `${hipWidth}px`);
    model.style.setProperty("--leg-height", `${legHeight}px`);
    model.style.setProperty("--leg-width", `${bottomFit === "와이드" ? 39 : userProfile.bodyType === "slim" ? 23 : 29}px`);
    model.style.setProperty("--leg-gap", `${userProfile.bodyType === "lower" ? 56 : 46}px`);
    model.style.setProperty("--top-extra", topFit === "오버핏" ? "44px" : topFit === "슬림" ? "10px" : "26px");
    model.style.setProperty("--top-length", topFit === "오버핏" ? "140px" : "124px");
    model.style.setProperty("--bottom-height", bottomFit === "와이드" ? "96px" : "88px");
    model.style.setProperty("--top-color", colorOf(currentOutfit.top));
    model.style.setProperty("--outer-color", colorOf(currentOutfit.outer));
    model.style.setProperty("--outer-opacity", currentOutfit.outer ? 1 : 0);
    model.style.setProperty("--bottom-color", colorOf(currentOutfit.bottom));
    model.style.setProperty("--shoe-color", colorOf(currentOutfit.shoes));
    model.style.setProperty("--bag-color", colorOf(currentOutfit.bag));
    model.style.setProperty("--bag-opacity", currentOutfit.bag ? 1 : 0);
    model.style.setProperty("--necklace-color", colorOf(currentOutfit.accessories[0]) || "#c8c1b6");
    model.style.setProperty("--necklace-opacity", currentOutfit.accessories.length ? 1 : 0);
    if (animate) {
      model.classList.remove("outfit-change");
      void model.offsetWidth;
      model.classList.add("outfit-change");
    }
  });
  $("#model-title").textContent = `${userProfile.styleTaste} ${moodLabel()}`;
  $("#collection-label").textContent = `${new Date().getFullYear()} ${seasonFromWeather()} Collection`;
  renderWearing();
}

function colorOf(entry) {
  return entry ? colorMap[entry.color] || entry.color || "transparent" : "transparent";
}

function renderWearing() {
  $("#wearing-summary").innerHTML = `<strong>${escapeHtml(userProfile.styleTaste)} · ${escapeHtml(moodLabel())}</strong>${outfitList()}`;
}

function moodLabel() {
  return { calm: "Calm", urban: "Urban", date: "Date", effortless: "Effortless", dark: "Dark" }[userProfile.mood] || "Calm";
}

function openViewer() {
  $("#viewer-copy").innerHTML = `
    <p class="kicker">FULLSCREEN STYLE VIEWER</p>
    <h2>${escapeHtml(userProfile.styleTaste)}<br />${escapeHtml(moodLabel())}</h2>
    <p>${styleCoach()}</p>
    <p>${moodCoach()}</p>
    <div class="save-row"><button type="button">링크 공유</button><button type="button">인스타 카드 저장</button></div>
  `;
  $("#viewer").classList.remove("hidden");
  applyModel(false);
}

function closeViewer() {
  $("#viewer").classList.add("hidden");
}

function saveStyleCard() {
  const card = {
    date: new Date().toISOString(),
    style: userProfile.styleTaste,
    mood: userProfile.mood,
    score: moodScore(),
    outfit: currentOutfit,
  };
  localStorage.setItem("moodfit-last-style-card", JSON.stringify(card));
  alert("스타일 카드가 브라우저에 저장됐습니다.");
}

function handleLogin(event) {
  event.preventDefault();
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    alert("이메일 형식과 8자 이상 비밀번호를 확인해주세요.");
    return;
  }
  localStorage.setItem("moodfit-user", email);
  state.loggedInUser = email;
  $("#login-modal").classList.add("hidden");
  renderAuth();
}

function renderAuth() {
  $("#auth-status").textContent = state.loggedInUser ? `${state.loggedInUser.split("@")[0]} 님` : "게스트";
  $("#open-login").textContent = state.loggedInUser ? "계정" : "로그인";
}

init();
