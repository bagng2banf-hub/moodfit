import React, { Component, useEffect, useId, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Camera,
  Check,
  ChevronRight,
  Coins,
  Gift,
  Globe2,
  Home,
  CalendarDays,
  Lock,
  LogOut,
  Mail,
  Medal,
  Moon,
  Palette,
  Save,
  Search,
  X,
  Settings,
  Shirt,
  Sparkles,
  Sun,
  Trophy,
  Trees,
  Upload,
  UserRound,
} from "lucide-react";
import { createTranslator } from "./i18n";
import { clearSession, createGuestSession, loadSession, signInWithEmail } from "./lib/auth";
import { canRequestAi, pruneClientState, safeJsonParse, sanitizeIdentifier, sanitizeInput } from "./lib/security";
import { categories, defaultFit, moods, normalizeFit, seedWardrobe, themes } from "./lib/data";
import "./index.css";

const storageKey = "moodfit-premium-state-v2";
const assetPath = (fileName) => `${import.meta.env.BASE_URL}${fileName.replace(/^\//, "")}`;
const fashionCategories = [
  ["tops", "상의"],
  ["bottoms", "하의"],
  ["outerwear", "아우터"],
  ["shoes", "신발"],
  ["bags", "가방"],
  ["accessories", "액세서리"],
  ["other", "기타"],
];
const subcategoryOptions = {
  tops: ["Basic T-Shirt", "Oversized T-Shirt", "Slim Fit T-Shirt", "Graphic T-Shirt", "Long Sleeve T-Shirt", "Oxford Shirt", "Dress Shirt", "Short Sleeve Shirt", "Denim Shirt", "Linen Shirt", "Pullover Hoodie", "Zip-Up Hoodie", "Oversized Hoodie", "Crewneck", "Oversized Crewneck", "Knit Sweater", "Turtleneck", "Cable Knit"],
  bottoms: ["Skinny Jeans", "Straight Jeans", "Wide Jeans", "Baggy Jeans", "Slacks", "Chinos", "Cargo Pants", "Joggers", "Denim Shorts", "Athletic Shorts", "Casual Shorts", "Mini Skirt", "Midi Skirt", "Long Skirt"],
  outerwear: ["Denim Jacket", "Leather Jacket", "Bomber", "Harrington", "Trench Coat", "Long Coat", "Wool Coat", "Short Padding", "Long Padding", "Short Cardigan", "Long Cardigan"],
  shoes: ["Sneakers", "Loafers", "Boots", "Slingback", "Sandals"],
  bags: ["Shoulder Bag", "Tote Bag", "Backpack", "Mini Bag"],
  accessories: ["Glasses", "Scarf", "Necklace", "Hat"],
  other: ["Fashion Item"],
};
const fabricOptions = ["Cotton", "Linen", "Denim", "Wool", "Cashmere", "Polyester", "Nylon", "Leather", "Corduroy", "Fleece", "Silk"];
const fitOptions = ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized", "Wide Fit", "Baggy Fit", "Cropped Fit"];
const patternOptions = ["Solid", "Stripe", "Check", "Plaid", "Floral", "Graphic"];
const neckOptions = ["Round Neck", "V Neck", "Turtleneck", "Collar"];
const sleeveOptions = ["Short Sleeve", "Long Sleeve", "Sleeveless", "Raglan"];
const mainBannerOptions = [
  { id: "dressing", label: "드레스룸", src: assetPath("main-banner-dressing.png") },
  { id: "closet", label: "옷장룸", src: assetPath("main-banner-closet.png") },
];
const shopItems = [
  { id: "pose-walk", name: "워킹 포즈", type: "pose", value: "walking", price: 45, copy: "가볍게 걷는 자연스러운 포즈" },
  { id: "pose-bag", name: "쇼핑백 포즈", type: "pose", value: "bag", price: 55, copy: "외출룩이 잘 살아나는 포즈" },
  { id: "hair-wavy", name: "웨이브 헤어", type: "hairStyle", value: "wavy", price: 35, copy: "부드러운 패션 일러스트 헤어" },
  { id: "hair-ash", name: "애쉬 헤어 컬러", type: "hairColor", value: "ash", price: 30, copy: "차분한 애쉬 브라운 톤" },
  { id: "face-confident", name: "자신감 표정", type: "expression", value: "confident", price: 25, copy: "오늘 코디가 더 멋져 보이는 표정" },
];
const fashionLabelMap = {
  tops: "상의", bottoms: "하의", outerwear: "아우터", shoes: "신발", bags: "가방", accessories: "액세서리", other: "기타",
  "Basic T-Shirt": "기본 티셔츠", "Oversized T-Shirt": "오버핏 티셔츠", "Slim Fit T-Shirt": "슬림핏 티셔츠", "Graphic T-Shirt": "그래픽 티셔츠", "Long Sleeve T-Shirt": "긴팔 티셔츠",
  "Oxford Shirt": "옥스퍼드 셔츠", "Dress Shirt": "드레스 셔츠", "Short Sleeve Shirt": "반팔 셔츠", "Denim Shirt": "데님 셔츠", "Linen Shirt": "리넨 셔츠",
  "Pullover Hoodie": "풀오버 후디", "Zip-Up Hoodie": "집업 후디", "Oversized Hoodie": "오버핏 후디", Crewneck: "맨투맨", "Oversized Crewneck": "오버핏 맨투맨",
  "Knit Sweater": "니트 스웨터", Turtleneck: "터틀넥", "Cable Knit": "케이블 니트",
  "Skinny Jeans": "스키니 진", "Straight Jeans": "스트레이트 진", "Wide Jeans": "와이드 진", "Baggy Jeans": "배기 진",
  Slacks: "슬랙스", Chinos: "치노 팬츠", "Cargo Pants": "카고 팬츠", Joggers: "조거 팬츠",
  "Denim Shorts": "데님 쇼츠", "Athletic Shorts": "애슬레틱 쇼츠", "Casual Shorts": "캐주얼 쇼츠", "Mini Skirt": "미니 스커트", "Midi Skirt": "미디 스커트", "Long Skirt": "롱 스커트",
  "Denim Jacket": "데님 재킷", "Leather Jacket": "레더 재킷", Bomber: "봄버 재킷", Harrington: "해링턴 재킷", "Trench Coat": "트렌치 코트", "Long Coat": "롱 코트", "Wool Coat": "울 코트", "Short Padding": "숏 패딩", "Long Padding": "롱 패딩", "Short Cardigan": "숏 가디건", "Long Cardigan": "롱 가디건",
  Sneakers: "스니커즈", Loafers: "로퍼", Boots: "부츠", Slingback: "슬링백", Sandals: "샌들",
  "Shoulder Bag": "숄더백", "Tote Bag": "토트백", Backpack: "백팩", "Mini Bag": "미니백", Glasses: "안경", Scarf: "스카프", Necklace: "목걸이", Hat: "모자", "Fashion Item": "패션 아이템",
  Cotton: "코튼", Linen: "리넨", Denim: "데님", Wool: "울", Cashmere: "캐시미어", Polyester: "폴리에스터", Nylon: "나일론", Leather: "레더", Corduroy: "코듀로이", Fleece: "플리스", Silk: "실크",
  "Slim Fit": "슬림핏", "Regular Fit": "레귤러핏", "Relaxed Fit": "릴랙스핏", Oversized: "오버사이즈", "Wide Fit": "와이드핏", "Baggy Fit": "배기핏", "Cropped Fit": "크롭핏",
  Solid: "무지", Stripe: "스트라이프", Check: "체크", Plaid: "플래드", Floral: "플로럴", Graphic: "그래픽",
  "Round Neck": "라운드넥", "V Neck": "브이넥", Collar: "카라", "Short Sleeve": "반팔", "Long Sleeve": "긴팔", Sleeveless: "민소매", Raglan: "래글런",
  "Inner Layer": "이너", "Middle Layer": "미들 레이어", "Outer Layer": "아우터 레이어",
};
function App() {
  const stored = loadStoredState();
  const [language, setLanguage] = useState(stored.language || null);
  const [session, setSession] = useState(loadSession());
  const [entryStep, setEntryStep] = useState("auth");
  const [activePanel, setActivePanel] = useState("v3-home");
  const [theme, setTheme] = useState(stored.theme || "white");
  const [mood, setMood] = useState(stored.mood || "moodLuxury");
  const [wardrobe, setWardrobe] = useState(Array.isArray(stored.wardrobe) ? stored.wardrobe : seedWardrobe);
  const [fit, setFit] = useState(normalizeFit(stored.fit, Array.isArray(stored.wardrobe) ? stored.wardrobe : seedWardrobe));
  const [savedLooks, setSavedLooks] = useState(Array.isArray(stored.savedLooks) ? stored.savedLooks : []);
  const [brief, setBrief] = useState(stored.brief || "");
  const [weather, setWeather] = useState(stored.weather || "soft rain");
  const [schedule, setSchedule] = useState(stored.schedule || "gallery date");
  const [eventType, setEventType] = useState(stored.eventType || "evening");
  const [aesthetic, setAesthetic] = useState(stored.aesthetic || "quiet luxury");
  const [bodyProfile, setBodyProfile] = useState(normalizeBodyProfile(stored.bodyProfile || {
    gender: "neutral",
    bodyType: "balanced",
    height: 165,
    shoulder: 42,
    waist: 27,
    torsoLength: 54,
    legLength: 92,
    legRatio: 52,
    skinTone: "medium",
  }));
  const [toast, setToast] = useState("");
  const [lastRequestAt, setLastRequestAt] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [avatarWardrobeOpen, setAvatarWardrobeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [game, setGame] = useState(normalizeGame(stored.game));
  const [profileName, setProfileName] = useState(stored.profileName || loadSession()?.username || "무드핏 스타일러");
  const [profilePhoto, setProfilePhoto] = useState(stored.profilePhoto || "");
  const [homeBanner, setHomeBanner] = useState(stored.homeBanner || "dressing");
  const [viewMode, setViewMode] = useState(stored.viewMode || "desktop");
  const fileInputRef = useRef(null);
  const t = useMemo(() => createTranslator(language || "ko"), [language]);
  const recommendation = useMemo(
    () => buildRecommendation({ t, mood, fit, brief, weather, schedule, eventType, aesthetic }),
    [t, mood, fit, brief, weather, schedule, eventType, aesthetic]
  );
  const scores = useMemo(() => scoreOutfit({ fit, weather, mood, eventType }), [fit, weather, mood, eventType]);
  const showToday = activePanel === "today" || activePanel === "all";
  const showAll = activePanel === "all";
  const activeWorld = activePanel.startsWith("v3-");
  const goPanel = (panel) => (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setActivePanel(panel);
  };

  useEffect(() => {
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, [activePanel]);

  useEffect(() => {
    localStorage.removeItem("moodfit-user");
    localStorage.removeItem("moodfit-wardrobe-editorial");
    localStorage.removeItem("moodfit-last-style-card");
    localStorage.setItem(storageKey, JSON.stringify(pruneClientState(loadStoredState())));
  }, []);

  function persist(next = {}) {
    const nextState = pruneClientState({
        language,
        theme,
        mood,
        wardrobe,
        fit,
        savedLooks,
        brief,
        weather,
        schedule,
        eventType,
        aesthetic,
        bodyProfile,
        game,
        profileName,
        profilePhoto,
        homeBanner,
        viewMode,
        ...next,
      });
    localStorage.setItem(storageKey, JSON.stringify(nextState));
  }

  function chooseLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    localStorage.setItem(storageKey, JSON.stringify({ ...loadStoredState(), language: nextLanguage }));
    setEntryStep("auth");
  }

  async function continueGuest() {
    const nextSession = await createGuestSession();
    setSession(nextSession);
    setEntryStep("app");
  }

  async function handleAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = sanitizeIdentifier(form.get("username"), 32) || "moodfit";
    const password = String(form.get("password") || "");
    if (username.length < 3) return showToast("아이디는 3글자 이상 입력해줘");
    if (!password || password.length < 8) return showToast(t("invalidPassword"));
    try {
      const nextSession = await signInWithEmail({ username, password });
      setSession(nextSession);
      setEntryStep("app");
      showToast(t("mockSession"));
    } catch {
      showToast(t("invalidPassword"));
    }
  }

  function logout() {
    clearSession();
    setSession(null);
    setEntryStep("auth");
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2200);
  }

  function openComingSoon(feature = "준비중인 기능") {
    setComingSoon({
      feature,
      title: "준비중입니다",
      subtitle: "더 똑똑한 기능으로 곧 돌아올게요",
    });
  }

  function award(reason, xp = 25, coins = 6, rewardKey = "") {
    const today = new Date().toISOString().slice(0, 10);
    const completedKey = rewardKey ? `${today}:${rewardKey}` : "";
    if (completedKey && game.completedMissions?.includes(completedKey)) {
      showToast("이미 오늘 보상을 받았어요");
      return;
    }
    setGame((current) => {
      const safe = normalizeGame(current);
      if (completedKey && safe.completedMissions.includes(completedKey)) return safe;
      const nextXp = safe.xp + xp;
      const next = {
        ...safe,
        xp: nextXp,
        coins: safe.coins + coins,
        level: levelFromXp(nextXp),
        petLevel: levelFromXp(nextXp),
        streak: safe.streak || 1,
        completedMissions: completedKey ? [...safe.completedMissions, completedKey] : safe.completedMissions,
      };
      const saved = safeJsonParse(localStorage.getItem(storageKey), {});
      localStorage.setItem(storageKey, JSON.stringify({ ...saved, game: next }));
      return next;
    });
    showToast(`${reason} +${xp} XP · +${coins} 코인`);
  }

  function buyShopItem(item) {
    const safe = normalizeGame(game);
    if (safe.ownedShopItems.includes(item.id)) return showToast("이미 갖고 있는 아이템이에요");
    if (safe.coins < item.price) return showToast(`${item.price - safe.coins}코인이 더 필요해요`);
    const nextGame = { ...safe, coins: safe.coins - item.price, ownedShopItems: [...safe.ownedShopItems, item.id] };
    const nextProfile = { ...bodyProfile, [item.type]: item.value };
    setGame(nextGame);
    setBodyProfile(nextProfile);
    persist({ game: nextGame, bodyProfile: nextProfile });
    showToast(`${item.name}을(를) 샀어요 · -${item.price} 코인`);
  }

  function changeProfileName(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextName = sanitizeInput(form.get("profileName"));
    if (!nextName) return showToast("바꿀 이름을 입력해줘");
    if (game.coins < 20) return showToast("이름 변경에는 20코인이 필요해요");
    const nextGame = { ...game, coins: game.coins - 20 };
    setGame(nextGame);
    setProfileName(nextName);
    persist({ game: nextGame, profileName: nextName });
    showToast("이름을 바꿨어요 · -20 코인");
  }

  async function changeProfilePhoto(event) {
    const file = event.target.files?.[0];
    const image = await readImageFile(file);
    event.target.value = "";
    if (!image) return showToast("프로필 사진을 다시 골라줘");
    setProfilePhoto(image);
    persist({ profilePhoto: image });
    showToast("프로필 사진을 바꿨어요");
  }

  function generateStyling() {
    if (!canRequestAi(lastRequestAt)) return showToast(t("rateReady"));
    const cleanBrief = sanitizeInput(brief);
    setBrief(cleanBrief);
    setLastRequestAt(Date.now());
    const nextMood = detectMood(cleanBrief, mood);
    const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
    const nextFit = normalizeFit(fit, safeWardrobe);
    for (const category of ["tops", "outerwear", "bottoms", "shoes", "bags", "accessories"]) {
      const match = safeWardrobe.find((item) => item.category === category && item.mood === nextMood);
      if (match) nextFit[category] = match;
    }
    setMood(nextMood);
    setFit(nextFit);
    persist({ mood: nextMood, fit: nextFit, brief: cleanBrief });
    award(t("generate"), 30, 8);
    openComingSoon("고급 AI 코디 추천");
  }

  function wear(item) {
    if (!item || !item.category) return;
    if (item.archived) return showToast("보관된 옷은 복원 후 입을 수 있어요");
    const nextFit = normalizeFit({ ...fit, [item.category]: item }, wardrobe);
    setFit(nextFit);
    setMood(item.mood || mood);
    persist({ fit: nextFit, mood: item.mood || mood });
  }

  function addItem() {
    setComposerOpen(true);
  }

  async function saveDetailedItem(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
    const category = categories[safeWardrobe.length % categories.length];
    const selectedCategory = form.get("category") || category;
    const subcategory = sanitizeInput(form.get("subcategory")) || inferSubcategory(selectedCategory, form.get("clothingType"));
    const fabric = sanitizeInput(form.get("fabric")) || inferFabric(subcategory, form.get("pattern"));
    const fitType = form.get("fitType") || "Regular Fit";
    const primaryColor = sanitizeInput(form.get("primaryColor")) || sanitizeInput(form.get("color")) || ["#eadcc7", "#101010", "#46627d", "#f5f1e9", "#8c5a38"][safeWardrobe.length % 5];
    const item = {
      id: crypto.randomUUID(),
      name: sanitizeInput(form.get("name")) || `${t("scannedItem")} ${safeWardrobe.length + 1}`,
      category: selectedCategory,
      subcategory,
      fabric,
      mood,
      season: sanitizeInput(form.get("season")) || "all",
      color: primaryColor,
      primaryColor,
      secondaryColor: sanitizeInput(form.get("secondaryColor")) || "",
      accentColor: sanitizeInput(form.get("accentColor")) || "",
      vibe: sanitizeInput(form.get("vibe")) || "editorial",
      occasion: sanitizeInput(form.get("occasion")) || eventType,
      styleCategory: sanitizeInput(form.get("styleCategory")) || aesthetic,
      fitType,
      clothingType: subcategory,
      pattern: sanitizeInput(form.get("pattern")) || "Solid",
      neckType: sanitizeInput(form.get("neckType")) || inferNeckType(subcategory),
      sleeveType: sanitizeInput(form.get("sleeveType")) || inferSleeveType(subcategory),
      layer: sanitizeInput(form.get("layerSlot")) || inferLayer(selectedCategory),
      image: await readImageFile(form.get("photo")),
      checklist: {
        clean: form.has("clean"),
        fit: form.has("fit"),
        layer: form.has("layer"),
        weather: form.has("weather"),
        favorite: form.has("favorite"),
      },
    };
    const nextWardrobe = [item, ...safeWardrobe];
    setWardrobe(nextWardrobe);
    wear(item);
    persist({ wardrobe: nextWardrobe });
    setComposerOpen(false);
    award(t("addItem"), 45, 12);
  }

  function saveLook() {
    const look = { id: crypto.randomUUID(), mood, fit, recommendation, createdAt: new Date().toISOString() };
    const nextLooks = [look, ...(Array.isArray(savedLooks) ? savedLooks : [])].slice(0, 8);
    setSavedLooks(nextLooks);
    persist({ savedLooks: nextLooks });
    award(t("saveLook"), 35, 10);
  }

  function scanPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    addItem();
    event.target.value = "";
  }

  function updateWardrobeItem(itemId, patch) {
    const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
    const nextWardrobe = safeWardrobe.map((item) => item.id === itemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
    const nextFit = Object.fromEntries(Object.entries(normalizeFit(fit, safeWardrobe)).map(([slot, item]) => [slot, item?.id === itemId ? { ...item, ...patch } : item]));
    setWardrobe(nextWardrobe);
    setFit(nextFit);
    persist({ wardrobe: nextWardrobe, fit: nextFit });
    showToast("옷 정보를 저장했어요");
  }

  function archiveWardrobeItem(itemId) {
    updateWardrobeItem(itemId, { archived: true, archivedAt: new Date().toISOString() });
  }

  function restoreWardrobeItem(itemId) {
    updateWardrobeItem(itemId, { archived: false, archivedAt: "" });
  }

  function confirmDeleteWardrobeItem() {
    if (!pendingDelete) return;
    const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
    const nextWardrobe = safeWardrobe.filter((item) => item.id !== pendingDelete.id);
    const nextFit = Object.fromEntries(Object.entries(normalizeFit(fit, safeWardrobe)).map(([slot, item]) => [slot, item?.id === pendingDelete.id ? null : item]));
    setWardrobe(nextWardrobe);
    setFit(nextFit);
    persist({ wardrobe: nextWardrobe, fit: nextFit });
    setPendingDelete(null);
    award("옷장 정리", 10, 2);
  }

  if (entryStep === "auth") {
    return <AuthScreen t={t} onGuest={continueGuest} onAccount={handleAccount} setLanguage={setLanguage} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />;
  }

  function changeViewMode(nextMode) {
    setViewMode(nextMode);
    persist({ viewMode: nextMode });
  }

  const renderedWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const renderedSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const renderedFit = normalizeFit(fit, renderedWardrobe);

  return (
    <main className={`app moodfit-game theme-${theme} mood-${mood} panel-${activePanel} view-${viewMode}`}>
      <div className="ambient" aria-hidden="true" />
      <input ref={fileInputRef} className="hidden-input" type="file" accept="image/*" onChange={scanPhoto} />
      <header className="topbar">
        <button className="brand sketch-home-button" data-panel="v3-home" onClick={goPanel("v3-home")} type="button">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span><strong>골라줄개</strong><small>당신의 무드를 정해줄개</small></span>
        </button>
        <nav className="nav main-tabs" aria-label="Main">
          <button className={activePanel === "v3-home" ? "active" : ""} data-panel="v3-home" onClick={goPanel("v3-home")} type="button"><Home size={16} />홈</button>
          <button className={activePanel === "v3-character" ? "active" : ""} data-panel="v3-character" onClick={goPanel("v3-character")} type="button"><UserRound size={16} />캐릭터</button>
          <button className={activePanel === "v3-closet" ? "active" : ""} data-panel="v3-closet" onClick={goPanel("v3-closet")} type="button"><Shirt size={16} />옷장</button>
          <button className={activePanel === "v3-style" ? "active" : ""} data-panel="v3-style" onClick={goPanel("v3-style")} type="button"><Sparkles size={16} />스타일</button>
          <button className={activePanel === "v3-photo" ? "active" : ""} data-panel="v3-photo" onClick={goPanel("v3-photo")} type="button"><Camera size={16} />사진</button>
          <button className={activePanel === "v3-calendar" ? "active" : ""} data-panel="v3-calendar" onClick={goPanel("v3-calendar")} type="button"><CalendarDays size={16} />캘린더</button>
          <button className={activePanel === "v3-ranking" ? "active" : ""} data-panel="v3-ranking" onClick={goPanel("v3-ranking")} type="button"><Trophy size={16} />랭킹</button>
          <button className={activePanel === "v3-shop" ? "active" : ""} data-panel="v3-shop" onClick={goPanel("v3-shop")} type="button"><Gift size={16} />상점</button>
          <button className={activePanel === "v3-map" ? "active" : ""} data-panel="v3-map" onClick={goPanel("v3-map")} type="button"><Trees size={16} />지도</button>
        </nav>
        <div className="header-actions">
          <div className="view-switch" aria-label="화면 버전 선택">
            <button className={viewMode === "desktop" ? "active" : ""} onClick={() => changeViewMode("desktop")} type="button">PC</button>
            <button className={viewMode === "mobile" ? "active" : ""} onClick={() => changeViewMode("mobile")} type="button">모바일</button>
          </div>
          <button className="status-pill" data-panel="v3-profile" onClick={goPanel("v3-profile")} type="button"><UserRound size={15} />프로필</button>
          <button className="settings-bubble" data-panel="settings" onClick={goPanel("settings")} type="button" aria-label="설정"><Settings size={24} /><span>설정</span></button>
        </div>
      </header>

      {activeWorld && (
        <WorldView
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          t={t}
          mood={mood}
          setMood={setMood}
          fit={renderedFit}
          setFit={setFit}
          language={language}
          bodyProfile={bodyProfile}
          setBodyProfile={setBodyProfile}
          persist={persist}
          wardrobe={renderedWardrobe}
          wear={wear}
          addItem={addItem}
          onEditItem={setEditingItem}
          onArchiveItem={archiveWardrobeItem}
          onRestoreItem={restoreWardrobeItem}
          onDeleteItem={setPendingDelete}
          recommendation={recommendation}
          scores={scores}
          brief={brief}
          setBrief={setBrief}
          weather={weather}
          setWeather={setWeather}
          schedule={schedule}
          setSchedule={setSchedule}
          eventType={eventType}
          setEventType={setEventType}
          aesthetic={aesthetic}
          setAesthetic={setAesthetic}
          generateStyling={generateStyling}
          saveLook={saveLook}
          award={award}
          fileInputRef={fileInputRef}
          game={game}
          buyShopItem={buyShopItem}
          profileName={profileName}
          profilePhoto={profilePhoto}
          homeBanner={homeBanner}
          setHomeBanner={(nextBanner) => {
            setHomeBanner(nextBanner);
            persist({ homeBanner: nextBanner });
          }}
          onRenameProfile={changeProfileName}
          onProfilePhoto={changeProfilePhoto}
          savedLooks={renderedSavedLooks}
          session={session}
          onEvent={() => setEventOpen(true)}
          onComingSoon={openComingSoon}
        />
      )}

      {!activeWorld && activePanel === "home" && (
        <SketchHome
          t={t}
          setActivePanel={setActivePanel}
          recommendation={recommendation}
          scores={scores}
          game={game}
          mood={mood}
          onEvent={() => setEventOpen(true)}
        />
      )}

      {!activeWorld && showAll && <ProfileDock t={t} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />}

      {!activeWorld && showToday && activePanel !== "home" && <section id="studio" className="hero">
        <section className="hero-copy glass">
          <p className="eyebrow">{t("heroEyebrow")}</p>
          <h1>{t("heroTitle")}</h1>
          <p className="lead">{t("heroLead")}</p>
          <div className="daily-note">
            <span>{t("dailyNoteMeta")}</span>
            <strong>{t("dailyNoteTitle")}</strong>
            <p>{t("dailyNoteBody")}</p>
          </div>
          <div className="control-grid">
            <label><span>{t("promptLabel")}</span><textarea value={brief} placeholder={t("promptPlaceholder")} onChange={(event) => setBrief(event.target.value)} /></label>
            <label><span>{t("weather")}</span><input value={weather} onChange={(event) => setWeather(event.target.value)} /></label>
            <label><span>{t("schedule")}</span><input value={schedule} onChange={(event) => setSchedule(event.target.value)} /></label>
            <label><span>{t("eventType")}</span><input value={eventType} onChange={(event) => setEventType(event.target.value)} /></label>
            <label><span>{t("aesthetic")}</span><input value={aesthetic} onChange={(event) => setAesthetic(event.target.value)} /></label>
          </div>
          <div className="mood-row">
            {moods.map((key) => <button key={key} className={mood === key ? "active" : ""} onClick={() => setMood(key)} type="button">{t(key)}</button>)}
          </div>
          <div className="action-row">
            <button className="primary" onClick={generateStyling} type="button"><Sparkles size={17} />{t("generate")}</button>
            <button className="secondary" onClick={saveLook} type="button"><Save size={17} />{t("saveLook")}</button>
          <button className="secondary" onClick={() => fileInputRef.current?.click()} type="button"><Upload size={17} />{t("upload")}</button>
          </div>
        </section>

        <section className="avatar-panel glass">
          <button className="avatar-wardrobe-button" onClick={() => setAvatarWardrobeOpen((open) => !open)} type="button">
            <Shirt size={17} />
            {avatarWardrobeOpen ? t("closeWardrobe") : t("openWardrobe")}
          </button>
          <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />
          <div className="avatar-caption">
            <span>{recommendation.name}</span>
            <strong>{t(mood)}</strong>
          </div>
          {avatarWardrobeOpen && <AvatarWardrobe t={t} fit={renderedFit} wardrobe={renderedWardrobe} wear={wear} />}
        </section>

        <aside className="recommendation glass">
          <p className="eyebrow">{t("recommendationTitle")}</p>
          <Info title={t("outfitName")} value={recommendation.name} />
          <Info title={t("explanation")} value={recommendation.explanation} />
          <Info title={t("colors")} value={recommendation.colors} />
          <Info title={t("avoid")} value={recommendation.avoid} />
          <Info title={t("tips")} value={recommendation.tips} />
          <GameScorePanel t={t} scores={scores} />
        </aside>
      </section>}

      {!activeWorld && showAll && <GameLayer t={t} game={game} wardrobe={renderedWardrobe} savedLooks={renderedSavedLooks} />}
      {!activeWorld && showAll && <FeatureShowcase t={t} />}
      {!activeWorld && showAll && <RealLifeExamples t={t} />}

      {!activeWorld && (activePanel === "wardrobe" || showAll) && <section id="wardrobe" className="wardrobe glass panel-view">
        <div className="section-head">
          <div><p className="eyebrow">{t("wardrobeTitle")}</p><h2>{t("wardrobeLead")}</h2></div>
          <button className="icon-button" onClick={addItem} type="button"><Shirt size={18} />{t("addItem")}</button>
        </div>
        <div className="wardrobe-grid">
          {renderedWardrobe.length ? renderedWardrobe.map((item) => (
            <button className="garment-card" key={item.id} onClick={() => wear(item)} type="button">
              {item.image ? <img className="garment-photo" src={item.image} alt="" /> : <span className={`fabric pattern-${item.pattern}`} style={{ "--fabric": item.color }} />}
              <strong>{item.name}</strong>
              <small>{t(item.category)} · {t(item.fitType || "regularFit")} · {t(item.clothingType || item.mood)} · {item.season}</small>
            </button>
          )) : <p className="empty">{t("emptyWardrobe")}</p>}
        </div>
      </section>}
      {composerOpen && <ItemComposer t={t} mood={mood} onClose={() => setComposerOpen(false)} onSubmit={saveDetailedItem} />}
      {editingItem && <ItemEditor item={editingItem} onClose={() => setEditingItem(null)} onSave={updateWardrobeItem} />}
      {pendingDelete && <ConfirmModal title="정말 삭제할까요?" copy={`${pendingDelete.name} 아이템은 옷장에서 완전히 사라져요.`} onCancel={() => setPendingDelete(null)} onConfirm={confirmDeleteWardrobeItem} />}
      {eventOpen && <EventPopup onClose={() => setEventOpen(false)} />}
      {comingSoon && (
        <ComingSoonModal
          feature={comingSoon.feature}
          title={comingSoon.title}
          subtitle={comingSoon.subtitle}
          onClose={() => setComingSoon(null)}
          onExplore={() => {
            setComingSoon(null);
            setActivePanel("v3-closet");
          }}
        />
      )}

      {!activeWorld && (activePanel === "looks" || showAll) && <section id="looks" className="lookbook panel-view">
        {renderedSavedLooks.length ? renderedSavedLooks.map((look) => (
          <button className="saved-look glass" key={look.id} onClick={() => { setFit(look.fit); setMood(look.mood); showToast(t("loaded")); }} type="button">
            <MiniFit fit={look.fit} />
            <strong>{look.recommendation.name}</strong>
            <span>{t(look.mood)}</span>
          </button>
        )) : <div className="saved-look glass empty">{t("emptyLooks")}</div>}
      </section>}

      {!activeWorld && activePanel === "customize" && <CustomizePanel t={t} theme={theme} setTheme={setTheme} mood={mood} setMood={setMood} fit={renderedFit} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />}

      {!activeWorld && activePanel === "photo" && <PhotoTryOnPage t={t} onUpload={() => fileInputRef.current?.click()} wardrobe={renderedWardrobe} />}

      {!activeWorld && activePanel === "ranking" && <RankingBoard t={t} game={game} scores={scores} wardrobe={renderedWardrobe} savedLooks={renderedSavedLooks} />}

      {activePanel === "settings" && <section id="settings" className="settings glass panel-view">
        <div>
          <p className="eyebrow">{t("settingsTitle")}</p>
          <h2>{session?.mode === "guest" ? t("localOnly") : t("protectedCopy")}</h2>
        </div>
        <div className="settings-controls">
          <Segment label={t("languageSetting")} items={[["ko", t("korean")], ["en", t("english")]]} value={language} onChange={setLanguage} />
          <Segment label="Theme" items={themes.map((item) => [item, t(`theme${capitalize(item)}`)])} value={theme} onChange={setTheme} />
          {session?.mode === "account" && <button className="secondary" type="button"><Lock size={16} />{t("protectedSettings")}</button>}
          {session?.mode === "account" && <button className="secondary" onClick={logout} type="button"><LogOut size={16} />{t("logout")}</button>}
        </div>
      </section>}
      {activePanel === "settings" && <TrustSection t={t} />}
      {!activeWorld && showAll && <PlatformLayer t={t} wardrobe={wardrobe} savedLooks={savedLooks} fit={fit} />}
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      {settingsOpen && (
        <SettingsModal
          t={t}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          session={session}
          logout={logout}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {routeLoading && (
        <div className="route-loading" aria-live="polite">
          <img src={assetPath("transition-loading.png")} alt="로딩 중" />
        </div>
      )}
    </main>
  );
}

function LanguageScreen({ t, onChoose }) {
  return (
    <main className="entry-screen">
      <section className="entry-card language-card">
        <div className="brand-lockup"><span>MF</span><strong>{t("brand")}</strong></div>
        <p className="eyebrow">{t("tagline")}</p>
        <h1>{t("languageTitle")}</h1>
        <p>{t("languageLead")}</p>
        <div className="language-options">
          <button onClick={() => onChoose("ko")} type="button"><Globe2 />{t("korean")}<ChevronRight /></button>
          <button onClick={() => onChoose("en")} type="button"><Globe2 />{t("english")}<ChevronRight /></button>
        </div>
      </section>
    </main>
  );
}

function AuthScreen({ t, onGuest, onAccount, setLanguage }) {
  return (
    <main className="entry-screen login-world">
      <section className="entry-card auth-card">
        <div className="auth-hero pixel-auth-hero">
          <img src={assetPath("login-loading-banner.png")} alt="골라줄개 로그인 배너" />
          <div className="landing-slogan">
            <strong>당신의 무드를 정해줄개</strong>
            <p>오늘의 코디, 옷장, 무드를 골라줄개와 함께 시작해요.</p>
          </div>
          <div className="language-options compact-language">
            <button onClick={() => setLanguage("ko")} type="button"><Globe2 />한국어</button>
            <button onClick={() => setLanguage("en")} type="button"><Globe2 />English</button>
          </div>
        </div>
        <form className="auth-form" onSubmit={onAccount}>
          <p className="eyebrow">MOODFIT START</p>
          <h2>골라줄개 시작하기</h2>
          <label><span>아이디</span><input name="username" type="text" autoComplete="username" placeholder="moodfit_id" /></label>
          <label><span>비밀번호</span><input name="password" type="password" autoComplete="current-password" /></label>
          <button className="primary start-button" type="submit"><Sparkles size={16} />로그인</button>
          <button className="secondary" type="submit">회원가입</button>
          <button className="text-button" type="button">비밀번호 찾기</button>
          <button className="guest-button" onClick={onGuest} type="button">게스트로 보기</button>
          <p className="notice">입력한 정보는 이 기기에서만 안전하게 처리됩니다.</p>
        </form>
      </section>
    </main>
  );
}
function WorldView(props) {
  const pages = {
    "v3-home": <V3Home {...props} />,
    "v3-character": <CharacterRoom {...props} />,
    "v3-closet": <MagicCloset {...props} />,
    "v3-style": <StyleStudio {...props} />,
    "v3-photo": <FashionLab {...props} />,
    "v3-calendar": <FashionCalendar {...props} />,
    "v3-profile": <ProfilePage {...props} />,
    "v3-mission": <MissionPage {...props} />,
    "v3-ranking": <RankingBoard {...props} />,
    "v3-shop": <CoinShop {...props} />,
    "v3-map": <MoodVillageMap {...props} />,
  };

  return (
    <section className={`world-view ${props.activePanel === "v3-home" ? "cloud-village home-world" : "plain-world"}`} aria-live="polite">
      <div className="floating-cloud cloud-one" aria-hidden="true" />
      <div className="floating-cloud cloud-two" aria-hidden="true" />
      <div className="twinkle-field" aria-hidden="true"><span /> <span /> <span /> <span /></div>
      {pages[props.activePanel] || pages["v3-home"]}
    </section>
  );
}

function V3Home({ recommendation, scores, game, wardrobe, savedLooks, weather, fit, onEvent, homeBanner, setHomeBanner }) {
  const safeFit = normalizeFit(fit);
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const banner = mainBannerOptions.find((item) => item.id === homeBanner) || mainBannerOptions[0];
  const missions = [
    ["색 조합 저장하기", "보상 30 XP"],
    ["새 옷 코디하기", "보상 12 코인"],
    ["오늘의 추천룩 입혀보기", "보상 배지 조각"],
  ];

  return (
    <section className="world-room v3-home-room">
      <figure className={`seasonal-hero-banner main-art-banner banner-${banner.id}`} key={banner.id}>
        <img src={banner.src} alt={`골라줄개 ${banner.label} 메인 배너`} />
      </figure>
      <div className="banner-picker" aria-label="메인 배너 선택">
        {mainBannerOptions.map((item) => (
          <button className={banner.id === item.id ? "active" : ""} key={item.id} onClick={() => setHomeBanner(item.id)} type="button">
            {item.label}
          </button>
        ))}
      </div>

      <div className="v3-home-grid">
        <WorldCard className="home-outfit-card" icon={<Sparkles size={20} />} title="오늘의 스타일 추천" note="오늘 뭐 입을지 바로 볼 수 있게">
          <div className="outfit-preview-v3">
            <MiniFit fit={fit} />
            <div>
              <strong>{recommendation.name}</strong>
              <p>{recommendation.explanation}</p>
              <div className="score-strip-v3">
                <b>{scores.total}점</b>
                <span>컬러 {scores.color}</span>
                <span>편안함 {scores.comfort}</span>
                <span>트렌드 {scores.confidence}</span>
              </div>
              <div className="palette-row-v3">
                {Object.values(safeFit).filter(Boolean).slice(0, 5).map((item) => <i key={item.id} style={{ "--swatch": item.color }} />)}
              </div>
            </div>
          </div>
        </WorldCard>
        <WorldCard className="home-medium-card" icon={<Sun size={20} />} title="날씨 추천" note="날씨에 맞춰 가볍게">
          <div className="metric-row"><MetricPill label="날씨" value={weather} /><MetricPill label="습도" value="62%" /><MetricPill label="UV" value="보통" /></div>
          <p className="tiny-copy">비 오는 날엔 흰 운동화는 조심할개!</p>
        </WorldCard>
        <WorldCard className="home-medium-card" icon={<Shirt size={20} />} title="옷장 요약" note="오늘 활용할 아이템">
          <div className="mini-closet-row">
            {safeWardrobe.slice(0, 4).map((item) => <span key={item.id} style={{ "--fabric": item.color }}>{item.name}</span>)}
          </div>
          <p className="tiny-copy">저장한 룩 {safeSavedLooks.length}개 · 옷장 아이템 {safeWardrobe.length}개</p>
        </WorldCard>
        <WorldCard className="home-small-card" icon={<Check size={20} />} title="미션" note="오늘의 성장">
          <div className="mission-list-v3">
            {missions.slice(0, 2).map(([title, reward]) => <label key={title}><input type="checkbox" /> <span>{title}</span><em>{reward}</em></label>)}
          </div>
        </WorldCard>
        <WorldCard className="home-small-card" icon={<Gift size={20} />} title="이벤트" note="시즌 보상">
          <EventCard title="봄 패션 페스티벌" label="D-7" copy="파스텔 코디로 스카프와 코인을 받을개" onClick={onEvent} />
        </WorldCard>
        <WorldCard className="home-small-card" icon={<Trophy size={20} />} title="랭킹" note="이번 주 감각">
          <div className="level-card-v3"><strong>Fashion Lv.{Math.max(1, game.petLevel + 9)}</strong><span style={{ "--xp": `${Math.min(100, (game.xp % 1000) / 10)}%` }} /><p>{game.xp} XP · {game.coins} 코인</p></div>
        </WorldCard>
      </div>
    </section>
  );
}
function CharacterRoom({ t, mood, setMood, fit, bodyProfile, setBodyProfile, persist }) {
  const profile = normalizeBodyProfile(bodyProfile);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeCustomizeTab, setActiveCustomizeTab] = useState("face");
  const updateProfile = (patch) => {
    const next = normalizeBodyProfile({ ...profile, ...patch });
    setBodyProfile(next);
    persist({ bodyProfile: next });
  };
  const faceControls = [
    ["머리 크기", "headSize", 82, 118],
    ["머리 폭", "headWidth", -50, 50],
    ["머리 높이", "headHeight", -50, 50],
    ["눈 크기", "eyeSize", -50, 50],
    ["눈 간격", "eyeSpacing", -50, 50],
    ["눈 높이", "eyeHeight", -50, 50],
    ["코 크기", "noseSize", -50, 50],
    ["입 너비", "mouthWidth", -50, 50],
    ["입 위치", "mouthHeight", -50, 50],
    ["턱 크기", "jawSize", -50, 50],
    ["턱 폭", "jawWidth", -50, 50],
    ["얼굴 길이", "faceLength", -50, 50],
    ["목 길이", "neckLength", 72, 118],
    ["목 굵기", "neckWidth", -50, 50],
  ];
  const bodyControls = [
    ["키", "height", 140, 210],
    ["몸통 길이", "torsoLength", 44, 70],
    ["다리 길이", "legLength", 72, 120],
    ["팔 길이", "armLength", 72, 116],
    ["어깨 너비", "shoulderWidth", 30, 56, { shoulder: true }],
    ["쇄골 넓이", "clavicleWidth", -50, 50],
    ["가슴 볼륨", "chestVolume", -50, 50],
    ["가슴 위치", "chestPosition", -50, 50],
    ["허리 너비", "waistWidth", 22, 42, { waist: true }],
    ["허리 높이", "waistHeight", -50, 50],
    ["복부 볼륨", "abdomenVolume", -50, 50],
    ["등 두께", "backThickness", -50, 50],
    ["상완 굵기", "upperArmWidth", -50, 50],
    ["하완 굵기", "lowerArmWidth", -50, 50],
    ["손 크기", "handSize", -50, 50],
    ["손가락 길이", "fingerLength", -50, 50],
    ["골반 너비", "hipWidth", 32, 60],
    ["엉덩이 볼륨", "hipVolume", -50, 50],
    ["허벅지 굵기", "thighWidth", -50, 50],
    ["종아리 굵기", "calfWidth", -50, 50],
    ["무릎 높이", "kneeHeight", -50, 50],
    ["발 크기", "footSize", -50, 50],
    ["전체 체중감", "weightMass", -50, 50],
    ["근육량", "muscleMass", -50, 50],
    ["체지방량", "bodyFat", -50, 50],
  ];
  const updateRange = (key, value, options = {}) => {
    const number = Number(value);
    updateProfile({
      [key]: number,
      ...(options.shoulder ? { shoulder: number } : {}),
      ...(options.waist ? { waist: number } : {}),
    });
  };
  const renderRanges = (controls) => controls.map(([label, key, min, max, options]) => (
    <RangeControl
      key={key}
      label={label}
      min={min}
      max={max}
      value={profile[key]}
      onChange={(value) => updateRange(key, value, options)}
    />
  ));

  return (
    <section className="world-room room-split character-room-v3">
      <RoomHeader eyebrow="캐릭터" title="아바타 스튜디오" comment="내 체형과 스타일을 직접 조정하는 공간" />
      <div className="avatar-dressing-stage avatar-studio-stage" style={{ "--studio-zoom": zoom / 100, "--studio-rotate": `${rotation}deg` }}>
        <FashionAvatar fit={fit} mood={mood} bodyProfile={profile} t={t} />
        <div className="studio-stage-actions">
          <button type="button" onClick={() => setRotation((value) => value - 8)}>왼쪽</button>
          <button type="button" onClick={() => setRotation(0)}>정면</button>
          <button type="button" onClick={() => setRotation((value) => value + 8)}>오른쪽</button>
        </div>
      </div>
      <div className="room-panel-v3">
        <h3>캐릭터 커스터마이징</h3>
        <div className="avatar-studio-tabs" role="tablist" aria-label="캐릭터 커스터마이징 항목">
          {[
            ["face", "얼굴"],
            ["body", "신체 비율"],
            ["hair", "헤어"],
            ["style", "스타일"],
            ["view", "보기"],
          ].map(([key, label]) => (
            <button key={key} className={activeCustomizeTab === key ? "active" : ""} type="button" onClick={() => setActiveCustomizeTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="avatar-studio-tools compact">
          <Segment label="성별" items={[["female", "여성"], ["male", "남성"], ["neutral", "뉴트럴"]]} value={profile.gender} onChange={(value) => updateProfile({ gender: value })} />
          <Segment label="체형" items={[["slim", "슬림"], ["regular", "평균"], ["athletic", "운동형"], ["curvy", "통통"], ["model", "모델형"], ["zepeto", "패션핏"]]} value={profile.bodyType} onChange={(value) => updateProfile(bodyPreset(value))} />
          {activeCustomizeTab === "face" && (
            <div className="custom-tab-panel-v3">
              <Segment label="얼굴형" items={[["round", "라운드"], ["softSquare", "소프트"], ["heart", "하트"], ["oval", "오벌"]]} value={profile.faceShape} onChange={(value) => updateProfile({ faceShape: value })} />
              <Segment label="눈" items={[["soft", "소프트"], ["round", "동그란"], ["cat", "캣아이"], ["calm", "차분"]]} value={profile.eyeStyle} onChange={(value) => updateProfile({ eyeStyle: value })} />
              <Segment label="얼굴 디테일" items={[["detailed", "표정 있음"], ["faceless", "무안면"]]} value={profile.faceDetail} onChange={(value) => updateProfile({ faceDetail: value })} />
              <div className="custom-range-grid-v3">{renderRanges(faceControls)}</div>
            </div>
          )}
          {activeCustomizeTab === "body" && (
            <div className="custom-tab-panel-v3">
              <p className="custom-panel-note-v3">신체 비율은 슬라이더를 움직이면 바로 아바타에 반영돼요.</p>
              <div className="custom-range-grid-v3">{renderRanges(bodyControls)}</div>
            </div>
          )}
          {activeCustomizeTab === "hair" && (
            <div className="custom-tab-panel-v3">
              <Segment label="헤어" items={[["none", "무안면"], ["short", "숏"], ["medium", "미디엄"], ["long", "롱"], ["wavy", "웨이브"], ["straight", "스트레이트"], ["ponytail", "포니테일"], ["bangs", "앞머리"]]} value={profile.hairStyle} onChange={(value) => updateProfile({ hairStyle: value })} />
              <Segment label="헤어 컬러" items={[["black", "블랙"], ["brown", "브라운"], ["blonde", "블론드"], ["ash", "애쉬"]]} value={profile.hairColor} onChange={(value) => updateProfile({ hairColor: value })} />
              <Segment label="피부톤" items={[["bright", "밝음"], ["medium", "보통"], ["warm", "웜"], ["cool", "쿨"], ["deep", "딥"]]} value={profile.skinTone} onChange={(value) => updateProfile({ skinTone: value })} />
            </div>
          )}
          {activeCustomizeTab === "style" && (
            <div className="custom-tab-panel-v3">
              <Segment label="포즈" items={[["standing", "정면"], ["walking", "워킹"], ["mirror", "거울"], ["bag", "쇼핑백"]]} value={profile.pose} onChange={(value) => updateProfile({ pose: value })} />
              <Segment label="표정" items={[["happy", "해피"], ["confident", "자신감"], ["calm", "차분"], ["excited", "반짝"], ["cute", "러블리"]]} value={profile.expression} onChange={(value) => updateProfile({ expression: value })} />
            </div>
          )}
          {activeCustomizeTab === "view" && (
            <div className="custom-tab-panel-v3">
              <RangeControl label="줌" min="86" max="116" value={zoom} onChange={(value) => setZoom(Number(value))} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
function MagicCloset({ t, wardrobe, wear, addItem, onEditItem, onArchiveItem, onRestoreItem, onDeleteItem, fit, bodyProfile }) {
  const [closetCategory, setClosetCategory] = useState("tops");
  const closetTabs = [
    ["tops", "상의"],
    ["bottoms", "하의"],
    ["outerwear", "아우터"],
    ["shoes", "신발"],
    ["bags", "가방"],
    ["accessories", "액세서리"],
    ["other", "기타"],
  ];
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const activeItems = safeWardrobe.filter((item) => !item.archived);
  const archivedItems = safeWardrobe.filter((item) => item.archived);
  const visibleItems = [...activeItems, ...archivedItems].filter((item) => item.category === closetCategory);
  const analytics = buildWardrobeAnalytics(safeWardrobe);

  return (
    <section className="world-room magic-closet-v3">
      <RoomHeader eyebrow="옷장" title="마법 옷장" comment="옷 종류와 태그가 먼저 보이는 디지털 클로젯" />
      <div className="wardrobe-analytics-v3">
        <MetricPill label="전체" value={`${analytics.total}개`} />
        <MetricPill label="자주 입는 색" value={analytics.favoriteColor} />
        <MetricPill label="대표 카테고리" value={fashionText(analytics.favoriteCategory)} />
        <MetricPill label="예상 가치" value={analytics.valueEstimate} />
        <MetricPill label="30일 미착용" value={`${analytics.unused30}개`} />
        <MetricPill label="보관" value={`${archivedItems.length}개`} />
      </div>
      <div className="closet-fitting-room-v3">
        <div className="closet-avatar-preview-v3">
          <FashionAvatar fit={fit} mood="moodLuxury" bodyProfile={bodyProfile} t={t} />
          <div>
            <strong>지금 입은 룩</strong>
            <p>옷 카드의 입히기를 누르면 바로 캐릭터에 적용돼요.</p>
          </div>
        </div>
        <div className="wearing-details compact-wearing-v3">
          {["tops", "outerwear", "bottoms", "shoes", "bags", "accessories"].map((slot) => (
            <div className="wearing-detail" key={slot}>
              <span style={{ "--swatch": normalizeFit(fit)[slot]?.color || "#e8e1d9" }} />
              <div>
                <small>{fashionText(slot)}</small>
                <strong>{normalizeFit(fit)[slot]?.name || "비어 있음"}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="storybook-closet">
        <aside className="closet-tabs-v3">
          {closetTabs.map(([value, label]) => <button className={closetCategory === value ? "active" : ""} key={value} onClick={() => setClosetCategory(value)} type="button">{label}</button>)}
          <button className="world-primary" onClick={addItem} type="button"><Upload size={16} />옷 등록</button>
        </aside>
        <div className="collectible-grid">
          {visibleItems.length ? visibleItems.map((item) => (
            <article className={`collectible-card ${item.archived ? "is-archived" : ""}`} key={item.id}>
              <button className="collectible-wear" onClick={() => wear(item)} type="button" disabled={item.archived}>
                {item.image ? <img src={item.image} alt="" /> : <span className={`fabric pattern-${item.pattern || "plain"}`} style={{ "--fabric": item.color }} />}
                <strong>{item.name}</strong>
                <p>{fashionText(item.category)} · {fashionText(item.subcategory || item.clothingType)} · {fashionText(item.pattern || "Solid")}</p>
                <div><em>{fashionText(item.fitType || "Regular Fit")}</em><em>{fashionText(item.fabric || "Cotton")}</em></div>
                <b className="wear-now-label">바로 입히기</b>
              </button>
              <div className="wardrobe-actions-v3">
                <button onClick={() => onEditItem(item)} type="button">편집</button>
                {item.archived
                  ? <button onClick={() => onRestoreItem(item.id)} type="button">복원</button>
                  : <button onClick={() => onArchiveItem(item.id)} type="button">보관</button>}
                <button className="danger" onClick={() => onDeleteItem(item)} type="button">삭제</button>
              </div>
            </article>
          )) : <div className="closet-empty-state"><Shirt size={26} /><strong>{fashionText(closetCategory)} 아이템이 아직 없어요</strong><p>이 카테고리에 맞는 옷을 등록해줘.</p><button className="world-primary" onClick={addItem} type="button">옷 등록</button></div>}
        </div>
      </div>
    </section>
  );
}
function StyleStudio({ t, mood, setMood, fit, bodyProfile, recommendation, scores, brief, setBrief, weather, setWeather, schedule, setSchedule, eventType, setEventType, aesthetic, setAesthetic, generateStyling, saveLook, onComingSoon }) {
  const styleModes = [
    ["Daily", "daily outfit", "데일리"],
    ["Weather", weather, "날씨"],
    ["Event", "event styling", "이벤트"],
    ["School", "school day", "학교"],
    ["Date", "date outfit", "데이트"],
    ["Interview", "interview", "면접"],
    ["Travel", "travel outfit", "여행"],
  ];

  return (
    <section className="world-room style-studio-v3">
      <RoomHeader eyebrow="스타일" title="스타일 연구소" comment="날씨, 무드, 옷장으로 오늘의 코디를 만드는 공간" />
      <div className="style-studio-layout-v3">
        <div className="avatar-runway-v3">
          <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />
        </div>
        <div className="style-console-v3">
          <div className="mood-row-v3">
            {moods.slice(0, 8).map((key) => <button key={key} className={mood === key ? "active" : ""} onClick={() => setMood(key)} type="button">{t(key)}</button>)}
          </div>
          <div className="style-mode-grid-v3">
            {styleModes.map(([key, value, label]) => <button key={key} onClick={() => setEventType(value)} type="button" className={eventType === value ? "active" : ""}>{label}</button>)}
          </div>
          <label><span>오늘의 기분</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="예: 비 오는데 편하고 단정하게 입고 싶어" /></label>
          <div className="studio-input-grid-v3">
            <label><span>날씨</span><input value={weather} onChange={(event) => setWeather(event.target.value)} /></label>
            <label><span>일정</span><input value={schedule} onChange={(event) => setSchedule(event.target.value)} /></label>
            <label><span>무드</span><input value={aesthetic} onChange={(event) => setAesthetic(event.target.value)} /></label>
          </div>
          <StyleResultCard recommendation={recommendation} scores={scores} />
          <div className="world-actions">
            <button className="world-primary" onClick={generateStyling} type="button"><Sparkles size={16} />오늘 코디 받기</button>
            <button className="world-secondary" onClick={saveLook} type="button"><Save size={16} />룩 저장</button>
            <button className="world-secondary" onClick={() => onComingSoon("고급 스타일 분석")} type="button">고급 분석</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FashionCalendar({ language, savedLooks, wardrobe, fit, setFit, setMood, persist, scores, weather, bodyProfile }) {
  const copy = language === "en"
    ? {
        eyebrow: "Calendar",
        title: "Fashion Calendar",
        note: "Record what you wore and recreate past looks.",
        month: "Month",
        week: "Week",
        search: "Search outfits",
        season: "Season",
        color: "Color",
        category: "Category",
        mood: "Style",
        detail: "Outfit detail",
        recreate: "Wear this look",
        timeline: "Timeline",
        favorites: "Favorites",
        stats: "Most worn",
        streak: "day streak",
        empty: "No outfit record yet",
      }
    : {
        eyebrow: "캘린더",
        title: "패션 캘린더",
        note: "매일 입은 룩을 기록하고 다시 입을 수 있는 패션 다이어리",
        month: "월간",
        week: "주간",
        search: "지난 룩 검색",
        season: "계절",
        color: "색상",
        category: "카테고리",
        mood: "스타일",
        detail: "룩 상세",
        recreate: "이 룩 다시 입기",
        timeline: "타임라인",
        favorites: "좋아한 룩",
        stats: "많이 입은 옷",
        streak: "일 연속 기록",
        empty: "아직 기록된 룩이 없어요",
      };
  const today = new Date();
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState({ season: "all", color: "all", category: "all", mood: "all" });
  const safeFit = normalizeFit(fit, wardrobe);
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const entries = useMemo(() => buildCalendarEntries(savedLooks, safeFit, safeWardrobe, scores, weather), [savedLooks, safeFit, safeWardrobe, scores, weather]);
  const filteredEntries = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const haystack = `${entry.name} ${entry.memo} ${entry.items.map((item) => item?.name).join(" ")}`.toLowerCase();
      const categoryMatch = filter.category === "all" || entry.items.some((item) => item?.category === filter.category);
      const colorMatch = filter.color === "all" || entry.items.some((item) => normalizeColorName(item?.color) === filter.color);
      const seasonMatch = filter.season === "all" || entry.season === filter.season || entry.items.some((item) => item?.season === filter.season);
      const moodMatch = filter.mood === "all" || entry.style === filter.mood;
      return (!cleanQuery || haystack.includes(cleanQuery)) && categoryMatch && colorMatch && seasonMatch && moodMatch;
    });
  }, [entries, query, filter]);
  const entryMap = new Map(filteredEntries.map((entry) => [entry.date, entry]));
  const selectedEntry = entryMap.get(selectedDate) || entries.find((entry) => entry.date === selectedDate) || filteredEntries[0] || entries[0];
  const days = view === "week" ? buildWeekDays(today) : buildMonthDays(today);
  const mostWorn = getMostWorn(entries);
  const recreateLook = () => {
    if (!selectedEntry?.fit) return;
    setFit(selectedEntry.fit);
    setMood(selectedEntry.style || "moodLuxury");
    persist?.({ fit: selectedEntry.fit, mood: selectedEntry.style || "moodLuxury" });
  };

  return (
    <section className="world-room fashion-calendar-v3">
      <RoomHeader eyebrow={copy.eyebrow} title={copy.title} comment={copy.note} />
      <div className="calendar-toolbar-v3">
        <div className="calendar-view-toggle-v3">
          <button className={view === "month" ? "active" : ""} type="button" onClick={() => setView("month")}>{copy.month}</button>
          <button className={view === "week" ? "active" : ""} type="button" onClick={() => setView("week")}>{copy.week}</button>
        </div>
        <label className="calendar-search-v3"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
      </div>
      <div className="calendar-filter-row-v3">
        <select value={filter.season} onChange={(event) => setFilter((current) => ({ ...current, season: event.target.value }))} aria-label={copy.season}>
          {["all", "spring", "summer", "autumn", "winter"].map((value) => <option key={value} value={value}>{value === "all" ? copy.season : seasonLabel(value, language)}</option>)}
        </select>
        <select value={filter.color} onChange={(event) => setFilter((current) => ({ ...current, color: event.target.value }))} aria-label={copy.color}>
          {["all", "cream", "black", "blue", "pink", "brown", "gray"].map((value) => <option key={value} value={value}>{value === "all" ? copy.color : colorLabel(value, language)}</option>)}
        </select>
        <select value={filter.category} onChange={(event) => setFilter((current) => ({ ...current, category: event.target.value }))} aria-label={copy.category}>
          <option value="all">{copy.category}</option>
          {fashionCategories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select value={filter.mood} onChange={(event) => setFilter((current) => ({ ...current, mood: event.target.value }))} aria-label={copy.mood}>
          <option value="all">{copy.mood}</option>
          {moods.slice(0, 6).map((key) => <option key={key} value={key}>{key.replace("mood", "")}</option>)}
        </select>
      </div>
      <div className="calendar-shell-v3">
        <div className="calendar-main-v3">
          <div className={`calendar-grid-v3 ${view}`}>
            {days.map((day) => {
              const entry = entryMap.get(day.key);
              return (
                <button className={`calendar-day-v3 ${entry ? "has-look" : ""} ${selectedDate === day.key ? "selected" : ""}`} key={day.key} type="button" onClick={() => setSelectedDate(day.key)}>
                  <span className="calendar-date-v3">{day.day}</span>
                  {entry ? (
                    <>
                      <div className="calendar-thumb-v3">
                        {entry.thumbnail ? <img src={entry.thumbnail} alt="" /> : <FashionAvatar fit={entry.fit} bodyProfile={bodyProfile} />}
                      </div>
                      <strong>{entry.name}</strong>
                      <small>{entry.weatherIcon} {entry.moodIcon} {entry.score}점</small>
                    </>
                  ) : <em>{copy.empty}</em>}
                </button>
              );
            })}
          </div>
          <div className="calendar-heatmap-v3" aria-label="fashion activity heatmap">
            {days.map((day) => <span key={day.key} className={entryMap.has(day.key) ? "active" : ""} />)}
          </div>
        </div>
        <aside className="calendar-detail-v3">
          <p className="eyebrow">{copy.detail}</p>
          {selectedEntry ? (
            <>
              <div className="calendar-detail-avatar-v3">
                <FashionAvatar fit={selectedEntry.fit} bodyProfile={bodyProfile} />
              </div>
              <h3>{selectedEntry.name}</h3>
              <p>{selectedEntry.memo}</p>
              <div className="score-strip-v3"><span>{selectedEntry.weatherIcon} {selectedEntry.weather}</span><span>{selectedEntry.score}점</span><span>{selectedEntry.moodIcon}</span></div>
              <div className="calendar-garment-grid-v3">
                {selectedEntry.items.map((item) => <GarmentThumb item={item} key={item?.id || item?.category || Math.random()} />)}
              </div>
              <button className="world-primary" type="button" onClick={recreateLook}>{copy.recreate}</button>
            </>
          ) : <p>{copy.empty}</p>}
        </aside>
      </div>
      <div className="calendar-bottom-grid-v3">
        <article className="calendar-stats-v3"><strong>{entries.length || 1}{copy.streak}</strong><p>Outfit streak</p></article>
        <article className="calendar-stats-v3"><strong>{copy.stats}</strong>{mostWorn.map((item) => <span key={item.id}>{item.name}</span>)}</article>
        <article className="favorite-strip-v3"><strong>{copy.favorites}</strong>{filteredEntries.slice(0, 4).map((entry) => <button key={entry.id} type="button" onClick={() => setSelectedDate(entry.date)}>{entry.name}</button>)}</article>
        <article className="timeline-v3"><strong>{copy.timeline}</strong>{entries.slice(0, 4).map((entry) => <p key={entry.id}>{entry.date.slice(5)} · {entry.name}</p>)}</article>
      </div>
    </section>
  );
}

function GarmentThumb({ item }) {
  if (!item) return null;
  return (
    <article className="garment-thumb-v3">
      {item.image ? <img src={item.image} alt="" /> : <span className={`fabric pattern-${item.pattern || "plain"}`} style={{ "--fabric": item.color || "#eadcc7" }} />}
      <strong>{item.name}</strong>
      <small>{fashionText(item.category)} · {fashionText(item.subcategory || item.clothingType || item.fitType)}</small>
    </article>
  );
}

function buildCalendarEntries(savedLooks, fit, wardrobe, scores, weather) {
  const safeLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const today = new Date();
  const baseFit = normalizeFit(fit, wardrobe);
  const baseItems = fitItems(baseFit);
  const fallback = {
    id: "today-look",
    date: today.toISOString().slice(0, 10),
    name: "오늘의 코디",
    memo: "현재 입은 룩을 바로 기록해둘 수 있어요.",
    fit: baseFit,
    items: baseItems,
    thumbnail: baseItems.find((item) => item?.image)?.image || "",
    moodIcon: "♡",
    weatherIcon: weatherIconFor(weather),
    weather,
    score: scores?.total || 88,
    season: seasonByMonth(today.getMonth() + 1),
    style: "moodLuxury",
  };
  const entries = safeLooks.map((look, index) => {
    const date = new Date(look.createdAt || today);
    date.setDate(date.getDate() - index);
    const lookFit = normalizeFit(look.fit, wardrobe);
    const items = fitItems(lookFit);
    return {
      id: look.id || `look-${index}`,
      date: date.toISOString().slice(0, 10),
      name: look.recommendation?.name || `저장 룩 ${index + 1}`,
      memo: look.recommendation?.explanation || "저장된 코디 기록",
      fit: lookFit,
      items,
      thumbnail: items.find((item) => item?.image)?.image || "",
      moodIcon: "♡",
      weatherIcon: weatherIconFor(weather),
      weather,
      score: scores?.total || 88,
      season: seasonByMonth(date.getMonth() + 1),
      style: look.mood || "moodLuxury",
    };
  });
  return [fallback, ...entries].filter((entry, index, list) => list.findIndex((target) => target.date === entry.date && target.name === entry.name) === index);
}

function buildMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 35 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return { key: current.toISOString().slice(0, 10), day: current.getDate(), currentMonth: current.getMonth() === month };
  });
}

function buildWeekDays(date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return { key: current.toISOString().slice(0, 10), day: current.getDate(), currentMonth: true };
  });
}

function fitItems(fit) {
  const safeFit = normalizeFit(fit);
  return ["tops", "outerwear", "bottoms", "shoes", "bags", "accessories"].map((key) => safeFit[key]).filter(Boolean);
}

function getMostWorn(entries) {
  const countMap = new Map();
  entries.forEach((entry) => entry.items.forEach((item) => {
    if (!item?.id) return;
    const current = countMap.get(item.id) || { ...item, count: 0 };
    countMap.set(item.id, { ...current, count: current.count + 1 });
  }));
  return [...countMap.values()].sort((a, b) => b.count - a.count).slice(0, 3);
}

function weatherIconFor(weather = "") {
  const clean = weather.toLowerCase();
  if (clean.includes("rain") || clean.includes("비")) return "☔";
  if (clean.includes("snow") || clean.includes("눈")) return "❄";
  if (clean.includes("cloud") || clean.includes("흐")) return "☁";
  return "☀";
}

function seasonByMonth(month) {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function seasonLabel(value, language) {
  const ko = { spring: "봄", summer: "여름", autumn: "가을", winter: "겨울" };
  return language === "en" ? capitalize(value) : ko[value] || value;
}

function colorLabel(value, language) {
  const ko = { cream: "크림", black: "블랙", blue: "블루", pink: "핑크", brown: "브라운", gray: "그레이" };
  return language === "en" ? capitalize(value) : ko[value] || value;
}

function normalizeColorName(color = "") {
  const clean = color.toLowerCase();
  if (clean.includes("000") || clean.includes("101") || clean.includes("black")) return "black";
  if (clean.includes("466") || clean.includes("blue")) return "blue";
  if (clean.includes("f7") || clean.includes("pink")) return "pink";
  if (clean.includes("8c") || clean.includes("brown")) return "brown";
  if (clean.includes("ccc") || clean.includes("gray")) return "gray";
  return "cream";
}

function FashionLab({ onUpload, wardrobe, onComingSoon }) {
  const sample = Array.isArray(wardrobe) ? wardrobe.find((item) => item.image) : null;
  return (
    <section className="world-room fashion-lab-v3">
      <RoomHeader eyebrow="사진" title="패션 분석실" comment="업로드한 사진과 분석 결과가 중심인 공간" />
      <div className="photo-lab-layout-v3">
        <div className="upload-polaroid">
          <div className="photo-placeholder">{sample?.image ? <img src={sample.image} alt="" /> : <Camera size={56} />}</div>
          <button className="world-primary" onClick={onUpload} type="button"><Upload size={16} />사진 업로드</button>
        </div>
        <div className="analysis-board">
          <MetricPill label="색상" value="Cream / Navy" />
          <MetricPill label="패턴" value="Stripe" />
          <MetricPill label="핏" value="Relaxed" />
          <MetricPill label="무드" value="Casual" />
          <p>고급 사진 분석 API는 준비중입니다. 지금은 미리보기 분석만 제공해요.</p>
          <button className="world-secondary" onClick={() => onComingSoon("사진 기반 AI 분석")} type="button">베타 알림 받기</button>
        </div>
      </div>
    </section>
  );
}
function ProfilePage({ t, game, fit, mood, bodyProfile, wardrobe, savedLooks, profileName, profilePhoto, onRenameProfile, onProfilePhoto }) {
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  return (
    <section className="world-room profile-page-v3">
      <RoomHeader eyebrow="프로필" title="프로필" comment="내 스타일 성장과 보상을 한눈에 보는 공간" />
      <div className="profile-layout-v3">
        <article className="profile-avatar-card-v3">
          <div className="profile-id-photo-v3">
            {profilePhoto ? <img src={profilePhoto} alt="프로필 사진" /> : <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />}
          </div>
          <label className="profile-photo-button"><input type="file" accept="image/*" onChange={onProfilePhoto} />프로필 사진 변경</label>
          <form onSubmit={onRenameProfile} className="profile-name-form">
            <input name="profileName" defaultValue={profileName} aria-label="프로필 이름" />
            <button type="submit">20코인으로 이름 변경</button>
          </form>
        </article>
        <article className="profile-stats-card-v3">
          <h3>{profileName}</h3>
          <MetricPill label="레벨" value={`Lv.${game.level}`} />
          <MetricPill label="XP" value={game.xp} />
          <MetricPill label="코인" value={game.coins} />
          <MetricPill label="옷장" value={`${safeWardrobe.length}개`} />
          <MetricPill label="저장 룩" value={`${safeSavedLooks.length}개`} />
        </article>
      </div>
    </section>
  );
}
function MissionPage({ award, game }) {
  const missions = [
    ["create-outfit", "코디 1개 만들기", 30, 6],
    ["add-clothes", "옷장에 옷 등록하기", 45, 12],
    ["save-look", "추천 룩 저장하기", 35, 10],
  ];
  return (
    <section className="world-room mission-page-v3">
      <RoomHeader eyebrow="미션" title="데일리 미션" comment="미션을 완료하고 XP와 코인을 받을개" />
      <div className="mission-grid-v3">
        {missions.map(([key, title, xp, coins]) => (
          <article className="mission-card-v3" key={key}>
            <Check size={18} />
            <strong>{title}</strong>
            <p>보상 {xp} XP · {coins} 코인</p>
            <button type="button" onClick={() => award(title, xp, coins, key)}>완료</button>
          </article>
        ))}
      </div>
      <div className="level-card-v3"><strong>현재 Lv.{game.level}</strong><p>{game.xp} XP · {game.coins} 코인</p></div>
    </section>
  );
}
function CoinShop({ game, buyShopItem }) {
  return (
    <section className="world-room shop-page-v3">
      <RoomHeader eyebrow="상점" title="코인 상점" comment="모은 코인으로 포즈, 헤어, 표정을 얻을 수 있어요" />
      <div className="coin-balance-v3"><Coins size={18} /><strong>{game.coins}코인</strong></div>
      <div className="shop-grid-v3">
        {shopItems.map((item) => (
          <article className="shop-item-v3" key={item.id}>
            <Gift size={20} />
            <strong>{item.name}</strong>
            <p>{item.copy}</p>
            <button type="button" onClick={() => buyShopItem(item)}>{item.price}코인</button>
          </article>
        ))}
      </div>
    </section>
  );
}
function MoodVillageMap({ setActivePanel, session, game, onEvent, onComingSoon }) {
  const places = [
    ["이벤트 광장", "축제와 보상을 여는 공간", "v3-home", <Gift size={22} />],
    ["날씨 센터", "날씨 기반 코디를 확인", "v3-style", <Sun size={22} />],
    ["스타일 도감", "저장한 룩과 점수", "v3-ranking", <Trophy size={22} />],
    ["미션", "XP와 코인 획득", "v3-mission", <Check size={22} />],
    ["골라줄개 하우스", "프로필과 상점", "v3-profile", <UserRound size={22} />],
    ["패션 캘린더", "입은 룩을 날짜별로 기록", "v3-calendar", <CalendarDays size={22} />],
  ];
  return (
    <section className="world-room map-page-v3">
      <RoomHeader eyebrow="지도" title="무드 빌리지" comment="같은 세계 안에서 기능을 이동해요" />
      <div className="map-grid-v3">
        {places.map(([name, copy, panel, icon]) => (
          <button key={name} type="button" onClick={() => panel === "coming" ? onComingSoon(name) : setActivePanel(panel)}>
            {icon}<strong>{name}</strong><span>{copy}</span>
          </button>
        ))}
      </div>
      <p className="tiny-copy">{session?.username || "MoodFit"} · Lv.{game.level} · {game.coins}코인</p>
    </section>
  );
}
function RoomHeader({ eyebrow, title, comment }) {
  return (
    <header className="room-header-v3">
      <div><p className="world-eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      <p className="room-note-v3">{comment}</p>
    </header>
  );
}

function AssistantNote({ text, tone = "small" }) {
  return <p className={`assistant-note-v3 ${tone}`}>{text}</p>;
}

function WorldCard({ className = "", icon, title, note, children }) {
  return (
    <article className={`world-card ${className}`}>
      <header><span>{icon}</span><div><strong>{title}</strong><small>{note}</small></div></header>
      {children}
    </article>
  );
}

function EventCard({ title, label, copy, onClick }) {
  return (
    <button className="event-card-v3" type="button" onClick={onClick}>
      <span className="event-card-v3__label">{label}</span>
      <strong>{title}</strong>
      <small>{copy}</small>
      <em>자세히 보기</em>
    </button>
  );
}

function MetricPill({ label, value }) {
  return <span className="metric-pill-v3"><small>{label}</small><b>{value}</b></span>;
}

function ItemEditor({ item, onClose, onSave }) {
  if (!item) return null;
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave(item.id, {
      name: sanitizeInput(form.get("name")) || item.name,
      fitType: form.get("fitType") || item.fitType,
      fabric: form.get("fabric") || item.fabric,
      pattern: form.get("pattern") || item.pattern,
      color: sanitizeInput(form.get("color")) || item.color,
      season: sanitizeInput(form.get("season")) || item.season,
    });
    onClose();
  };
  return (
    <div className="modal-backdrop">
      <form className="item-composer glass" onSubmit={submit}>
        <div className="section-head"><div><p className="eyebrow">옷 편집</p><h2>{item.name}</h2></div><button type="button" className="round-button" onClick={onClose}><X size={18} /></button></div>
        <div className="composer-grid">
          <label><span>이름</span><input name="name" defaultValue={item.name} /></label>
          <label><span>핏</span><select name="fitType" defaultValue={item.fitType || "Regular Fit"}>{fitOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
          <label><span>소재</span><select name="fabric" defaultValue={item.fabric || "Cotton"}>{fabricOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
          <label><span>패턴</span><select name="pattern" defaultValue={item.pattern || "Solid"}>{patternOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
          <label><span>색상</span><input name="color" type="color" defaultValue={item.color || "#eadcc7"} /></label>
          <label><span>계절</span><input name="season" defaultValue={item.season || "all"} /></label>
        </div>
        <div className="modal-actions"><button className="secondary" type="button" onClick={onClose}>취소</button><button className="primary" type="submit">저장</button></div>
      </form>
    </div>
  );
}
function ConfirmModal({ title, copy, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <section className="confirm-modal glass">
        <h3>{title}</h3>
        <p>{copy}</p>
        <div className="modal-actions"><button className="secondary" onClick={onCancel} type="button">취소</button><button className="primary" onClick={onConfirm} type="button">확인</button></div>
      </section>
    </div>
  );
}

function EventPopup({ onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="event-popup glass">
        <button className="round-button" onClick={onClose} type="button" aria-label="닫기"><X size={18} /></button>
        <img className="sketch-reference" src={assetPath("main-banner-closet.png")} alt="골라줄개 이벤트" />
        <div>
          <p className="eyebrow">EVENT</p>
          <h2>시즌 코디 챌린지</h2>
          <p>옷장 아이템으로 오늘의 무드를 완성하면 XP와 코인을 받을 수 있어요.</p>
          <button className="primary" onClick={onClose} type="button">참여하기</button>
        </div>
      </section>
    </div>
  );
}
function StyleResultCard({ title = "추천 결과", recommendation, scores, onClick }) {
  return (
    <article className="style-result-card" onClick={onClick}>
      <p className="eyebrow">{title}</p>
      <strong>{recommendation.name}</strong>
      <p>{recommendation.explanation}</p>
      <div className="score-strip-v3"><span>총점 {scores.total}</span><span>컬러 {scores.color}</span><span>편안함 {scores.comfort}</span></div>
      <small>AI 추천 기능은 준비중입니다. 기본 추천은 바로 사용할 수 있어요.</small>
    </article>
  );
}

function ComingSoonModal({ feature, title, subtitle, onClose, onExplore }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="coming-soon-modal glass">
        <button className="round-button" onClick={onClose} type="button" aria-label="닫기"><X size={18} /></button>
        <div className="coming-soon-mascot"><Sparkles size={22} /></div>
        <p className="eyebrow">{feature}</p>
        <h2>{title}</h2>
        <strong>{subtitle}</strong>
        <p>현재 이 기능은 개발 중이에요. 조금만 기다려주시면 더 좋은 추천을 해드릴게요!</p>
        <div className="coming-soon-preview"><span>미리보기</span><b>기본 추천은 지금 바로 사용할 수 있어요</b><small>AI 추천 기능은 준비중입니다</small></div>
        <div className="coming-soon-actions"><button className="secondary" onClick={onClose} type="button">확인</button><button className="primary" onClick={onExplore} type="button">다른 기능 보러가기</button><button className="text-button" onClick={onClose} type="button">베타 알림 받기</button></div>
      </section>
    </div>
  );
}

function PhotoTryOnPage({ t, onUpload, wardrobe, onComingSoon = () => {} }) {
  const sample = Array.isArray(wardrobe) ? wardrobe[0] : null;
  return (
    <section className="soft-page photo-page panel-view">
      <div className="soft-page-copy">
        <p className="eyebrow">photo try-on</p>
        <h2>사진을 넣으면 색, 핏, 패턴, 분위기를 읽어줘요.</h2>
        <p>업로드한 옷 사진을 바탕으로 옷장 아이템과 어울리는 스타일을 제안해요.</p>
        <button className="primary" onClick={() => onComingSoon("AI 사진 분석")} type="button"><Upload size={17} />사진 올리기</button>
      </div>
      <div className="before-after">
        <article><span>before</span><div className="photo-placeholder">{sample?.image ? <img src={sample.image} alt="" /> : <Camera size={44} />}</div><p>사진 분석 대기</p></article>
        <article><span>after</span><div className="photo-placeholder styled"><Sparkles size={44} /></div><p>패턴 · 색감 · 무드 추천</p></article>
      </div>
    </section>
  );
}

function RankingBoard({ game, scores, wardrobe, savedLooks }) {
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const ranking = [
    ["오늘의 무드 장인", scores.total, "선글라스"],
    ["컬러 조합 천재", scores.color, "핑크 스카프"],
    ["옷장 수집가", safeWardrobe.length * 12, "구름 코인"],
    ["룩북 스타", safeSavedLooks.length * 25 + 40, "XP"],
  ].sort((a, b) => b[1] - a[1]);
  return (
    <section className="soft-page ranking-page panel-view">
      <div className="soft-page-copy"><p className="eyebrow">ranking & challenge</p><h2>스타일 점수와 주간 챌린지를 모으는 공간이에요.</h2><p>코디를 저장하고 옷장을 채울수록 배지와 코인이 늘어나요.</p></div>
      <div className="ranking-list">{ranking.map(([name, score, reward], index) => <article key={name}><b>{index + 1}</b><strong>{name}</strong><span>{score}점</span><em>{reward}</em></article>)}</div>
    </section>
  );
}
function CustomizePanel({ t, theme, setTheme, mood, setMood, fit, bodyProfile, setBodyProfile, persist }) {
  return (
    <section className="customize panel-view">
      <div className="custom-avatar">
        <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />
      </div>
      <ProfileFields t={t} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />
    </section>
  );
}

function ProfileDock({ t, bodyProfile, setBodyProfile, persist }) {
  return (
    <section className="profile-dock glass">
      <ProfileFields t={t} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} compact />
    </section>
  );
}

function ProfileFields({ t, bodyProfile, setBodyProfile, persist, compact = false }) {
  const profile = normalizeBodyProfile(bodyProfile);
  const update = (patch) => {
    const next = normalizeBodyProfile({ ...profile, ...patch });
    setBodyProfile(next);
    persist({ bodyProfile: next });
  };
  return (
    <div className={compact ? "profile-fields compact-profile" : "profile-fields"}>
      <Segment label="성별" items={[["neutral", "중성"], ["female", "여성"], ["male", "남성"]]} value={profile.gender} onChange={(value) => update({ gender: value })} />
      <Segment label="체형 프리셋" items={[["slim", "슬림"], ["regular", "평균"], ["athletic", "운동형"], ["curvy", "통통"], ["model", "모델형"], ["zepeto", "패션핏"]]} value={profile.bodyType} onChange={(value) => update(bodyPreset(value))} />
      <Segment label="피부톤" items={[["bright", "밝음"], ["medium", "보통"], ["warm", "웜"], ["cool", "쿨"], ["deep", "딥"]]} value={profile.skinTone} onChange={(value) => update({ skinTone: value })} />
      <Segment label="헤어" items={[["short", "숏"], ["medium", "미디엄"], ["long", "롱"], ["wavy", "웨이브"], ["straight", "스트레이트"], ["ponytail", "포니테일"], ["bangs", "앞머리"]]} value={profile.hairStyle} onChange={(value) => update({ hairStyle: value })} />
      <Segment label="헤어 컬러" items={[["black", "블랙"], ["brown", "브라운"], ["blonde", "블론드"], ["ash", "애쉬"]]} value={profile.hairColor} onChange={(value) => update({ hairColor: value })} />
      <RangeControl label="키" min="140" max="210" value={profile.height} onChange={(value) => update({ height: Number(value) })} />
      <RangeControl label="머리 크기" min="82" max="118" value={profile.headSize} onChange={(value) => update({ headSize: Number(value) })} />
      <RangeControl label="목 길이" min="72" max="118" value={profile.neckLength} onChange={(value) => update({ neckLength: Number(value) })} />
      <RangeControl label="어깨 넓이" min="30" max="56" value={profile.shoulderWidth} onChange={(value) => update({ shoulderWidth: Number(value), shoulder: Number(value) })} />
      <RangeControl label="허리 굵기" min="22" max="42" value={profile.waistWidth} onChange={(value) => update({ waistWidth: Number(value), waist: Number(value) })} />
      <RangeControl label="골반 넓이" min="32" max="60" value={profile.hipWidth} onChange={(value) => update({ hipWidth: Number(value) })} />
      <RangeControl label="팔 길이" min="72" max="116" value={profile.armLength} onChange={(value) => update({ armLength: Number(value) })} />
      <RangeControl label="상체 길이" min="44" max="70" value={profile.torsoLength} onChange={(value) => update({ torsoLength: Number(value) })} />
      <RangeControl label="다리 길이" min="72" max="120" value={profile.legLength} onChange={(value) => update({ legLength: Number(value) })} />
    </div>
  );
}
function ItemComposer({ t, mood, onClose, onSubmit }) {
  const [category, setCategory] = useState("tops");
  return (
    <div className="modal-backdrop">
      <form className="item-composer glass" onSubmit={onSubmit}>
        <div className="section-head"><div><p className="eyebrow">옷 등록</p><h2>새 옷 추가하기</h2></div><button className="round-button" onClick={onClose} type="button"><X size={18} /></button></div>
        <div className="composer-grid">
          <label><span>카테고리</span><select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>{fashionCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>세부 종류</span><select name="subcategory">{(subcategoryOptions[category] || subcategoryOptions.other).map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
          <label><span>이름</span><input name="name" placeholder="예: 네이비 후디" /></label>
          <label><span>핏</span><select name="fitType">{fitOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
          <label><span>소재</span><select name="fabric">{fabricOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
          <label><span>패턴</span><select name="pattern">{patternOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
          <label><span>색상</span><input name="primaryColor" type="color" defaultValue="#eadcc7" /></label>
          <label><span>보조색</span><input name="secondaryColor" type="color" defaultValue="#ffffff" /></label>
          <label><span>계절</span><input name="season" placeholder="봄, 여름, all" /></label>
          <label><span>무드</span><input name="vibe" defaultValue={mood} /></label>
          <label className="wide-field"><span>스타일 태그</span><input name="styleCategory" placeholder="미니멀, 스트릿, 꾸안꾸" /></label>
          <label className="wide-field"><span>사진</span><input name="photo" type="file" accept="image/*" /></label>
        </div>
        <div className="modal-actions"><button className="secondary" type="button" onClick={onClose}>취소</button><button className="primary" type="submit">저장</button></div>
      </form>
    </div>
  );
}
function ReferenceFashionAvatar({ fit, bodyProfile }) {
  const svgId = useId().replace(/:/g, "");
  const profile = normalizeBodyProfile(bodyProfile);
  const safeFit = normalizeFit(fit);
  const skin = avatarVariables(profile)["--avatar-skin"];
  const hair = avatarVariables(profile)["--avatar-hair"];
  const top = safeFit.tops || {};
  const outer = safeFit.outerwear || {};
  const bottom = safeFit.bottoms || {};
  const shoes = safeFit.shoes || {};
  const accessory = safeFit.accessories || {};
  const topColor = top.color || top.primaryColor || "#f1dfc8";
  const outerColor = outer.color || outer.primaryColor || "";
  const bottomColor = bottom.color || bottom.primaryColor || "#6f83a0";
  const shoeColor = shoes.color || shoes.primaryColor || "#f7f3ea";
  const gender = profile.gender || "neutral";
  const heightScale = Math.max(.92, Math.min(1.12, profile.height / 165));
  const headRx = Math.max(28, Math.min(43, 35 + profile.headWidth * .12 + (profile.headSize - 100) * .18));
  const headRy = Math.max(34, Math.min(50, 42 + profile.headHeight * .13 + (profile.headSize - 100) * .18));
  const shoulder = Math.max(48, Math.min(78, 60 + (profile.shoulderWidth - 42) * 1.25 + profile.clavicleWidth * .12 + (gender === "male" ? 8 : 0)));
  const waist = Math.max(28, Math.min(58, 42 + (profile.waistWidth - 28) * 1.35 + profile.abdomenVolume * .1 + profile.weightMass * .1));
  const hip = Math.max(42, Math.min(78, 54 + (profile.hipWidth - 42) * 1.18 + profile.hipVolume * .12 + (gender === "female" ? 9 : 0)));
  const chest = Math.max(48, Math.min(76, shoulder - 8 + profile.chestVolume * .12 + (gender === "male" ? 6 : gender === "female" ? 3 : 0)));
  const legLength = Math.max(128, Math.min(178, 146 + (profile.legLength - 92) * .78 + (profile.height - 165) * .52));
  const armLength = Math.max(116, Math.min(166, 134 + (profile.armLength - 90) * .72 + (profile.height - 165) * .18));
  const armWidth = Math.max(13, Math.min(24, 16 + profile.upperArmWidth * .05 + profile.muscleMass * .04));
  const calfWidth = Math.max(14, Math.min(28, 18 + profile.calfWidth * .06 + profile.bodyFat * .04));
  const thighWidth = Math.max(20, Math.min(36, 25 + profile.thighWidth * .07 + profile.bodyFat * .05));
  const cx = 140;
  const headCy = 62;
  const neckTop = headCy + headRy - 2;
  const neckBottom = neckTop + 25 + (profile.neckLength - 96) * .15;
  const shoulderY = neckBottom + 20;
  const waistY = shoulderY + 82 + profile.waistHeight * .14;
  const hipY = waistY + 56;
  const footY = hipY + legLength;
  const leftShoulder = cx - shoulder;
  const rightShoulder = cx + shoulder;
  const leftChest = cx - chest;
  const rightChest = cx + chest;
  const leftWaist = cx - waist;
  const rightWaist = cx + waist;
  const leftHip = cx - hip;
  const rightHip = cx + hip;
  const isHoodie = /hood/i.test(top.subcategory || top.clothingType || "");
  const isShirt = /shirt|oxford|dress|linen/i.test(top.subcategory || top.clothingType || "");
  const isCoat = /coat|padding|cardigan|jacket/i.test(outer.subcategory || outer.clothingType || "");
  const isSkirt = /skirt/i.test(bottom.subcategory || bottom.clothingType || "");
  const isWide = /wide|baggy|cargo|jogger/i.test(bottom.subcategory || bottom.clothingType || bottom.fitType || "");
  const torsoPath = `M${leftShoulder} ${shoulderY} C${leftChest} ${shoulderY + 22} ${leftWaist} ${waistY - 8} ${leftWaist} ${waistY} C${leftWaist - 3} ${waistY + 36} ${leftHip} ${hipY - 8} ${leftHip} ${hipY} C${cx - 34} ${hipY + 16} ${cx + 34} ${hipY + 16} ${rightHip} ${hipY} C${rightHip} ${hipY - 8} ${rightWaist + 3} ${waistY + 36} ${rightWaist} ${waistY} C${rightWaist} ${waistY - 8} ${rightChest} ${shoulderY + 22} ${rightShoulder} ${shoulderY} C${cx + 36} ${shoulderY - 18} ${cx - 36} ${shoulderY - 18} ${leftShoulder} ${shoulderY}Z`;
  const topPath = `M${leftShoulder - (isHoodie ? 8 : 0)} ${shoulderY + 6} C${leftChest} ${shoulderY + 18} ${leftWaist - (isHoodie ? 12 : 4)} ${waistY + 18} ${leftWaist - (isHoodie ? 16 : 7)} ${hipY - 8} C${cx - 18} ${hipY + 8} ${cx + 18} ${hipY + 8} ${rightWaist + (isHoodie ? 16 : 7)} ${hipY - 8} C${rightWaist + (isHoodie ? 12 : 4)} ${waistY + 18} ${rightChest} ${shoulderY + 18} ${rightShoulder + (isHoodie ? 8 : 0)} ${shoulderY + 6} C${cx + 34} ${shoulderY - 8} ${cx - 34} ${shoulderY - 8} ${leftShoulder - (isHoodie ? 8 : 0)} ${shoulderY + 6}Z`;
  const pantsPath = isWide
    ? `M${leftHip + 3} ${hipY - 2} H${rightHip - 3} L${rightHip + 14} ${footY - 18} C${rightHip + 6} ${footY - 6} ${cx + 24} ${footY - 6} ${cx + 11} ${footY - 18} L${cx + 3} ${hipY + 40} L${cx - 10} ${footY - 18} C${cx - 24} ${footY - 6} ${leftHip - 6} ${footY - 6} ${leftHip - 14} ${footY - 18}Z`
    : `M${leftHip + 9} ${hipY - 2} H${rightHip - 9} L${rightHip - 2} ${footY - 18} C${rightHip - 12} ${footY - 6} ${cx + 20} ${footY - 6} ${cx + 8} ${footY - 18} L${cx + 2} ${hipY + 38} L${cx - 8} ${footY - 18} C${cx - 20} ${footY - 6} ${leftHip + 12} ${footY - 6} ${leftHip + 2} ${footY - 18}Z`;
  const skirtPath = `M${leftHip - 4} ${hipY - 4} C${cx - 32} ${hipY + 12} ${cx + 32} ${hipY + 12} ${rightHip + 4} ${hipY - 4} L${rightHip + 20} ${hipY + 88} C${cx + 32} ${hipY + 108} ${cx - 32} ${hipY + 108} ${leftHip - 20} ${hipY + 88}Z`;
  const armLeft = `M${leftShoulder + 6} ${shoulderY + 11} C${leftShoulder - 22} ${shoulderY + 46} ${leftShoulder - 25} ${shoulderY + armLength - 22} ${leftShoulder - 12} ${shoulderY + armLength} C${leftShoulder + 2} ${shoulderY + armLength + 8} ${leftShoulder + armWidth} ${shoulderY + armLength + 2} ${leftShoulder + armWidth - 2} ${shoulderY + armLength - 14} C${leftShoulder + armWidth - 5} ${shoulderY + 80} ${leftShoulder + armWidth + 12} ${shoulderY + 34} ${leftShoulder + 19} ${shoulderY + 10}Z`;
  const armRight = `M${rightShoulder - 6} ${shoulderY + 11} C${rightShoulder + 24} ${shoulderY + 46} ${rightShoulder + 27} ${shoulderY + armLength - 22} ${rightShoulder + 14} ${shoulderY + armLength} C${rightShoulder} ${shoulderY + armLength + 8} ${rightShoulder - armWidth} ${shoulderY + armLength + 2} ${rightShoulder - armWidth + 2} ${shoulderY + armLength - 14} C${rightShoulder - armWidth + 5} ${shoulderY + 80} ${rightShoulder - armWidth - 12} ${shoulderY + 34} ${rightShoulder - 19} ${shoulderY + 10}Z`;
  const hairPath = `M${cx - headRx * .92} ${headCy - 3} C${cx - headRx * .78} ${headCy - headRy * .98} ${cx + headRx * .72} ${headCy - headRy * 1.02} ${cx + headRx * .98} ${headCy - 4} C${cx + headRx * .44} ${headCy - headRy * .18} ${cx - headRx * .18} ${headCy - headRy * .16} ${cx - headRx * .92} ${headCy - 3}Z`;
  const eyeSize = Math.max(4, Math.min(11, 7 + profile.eyeSize * .08));
  const eyeGap = Math.max(17, Math.min(34, 24 + profile.eyeSpacing * .12));
  const eyeY = headCy + 3 + profile.eyeHeight * .08;
  const leftEyeX = cx - eyeGap;
  const rightEyeX = cx + eyeGap;
  const noseY = headCy + 18;
  const noseSize = Math.max(5, Math.min(13, 8 + profile.noseSize * .06));
  const mouthY = headCy + 35 + profile.mouthHeight * .08;
  const mouthHalf = Math.max(9, Math.min(24, 15 + profile.mouthWidth * .12));
  const eyeShape = {
    soft: (
      <>
        <ellipse cx={leftEyeX} cy={eyeY} rx={eyeSize * .85} ry={eyeSize * 1.1} fill="#4a403a" />
        <ellipse cx={rightEyeX} cy={eyeY} rx={eyeSize * .85} ry={eyeSize * 1.1} fill="#4a403a" />
        <circle cx={leftEyeX - eyeSize * .22} cy={eyeY - eyeSize * .28} r="1.8" fill="#fff" opacity=".9" />
        <circle cx={rightEyeX - eyeSize * .22} cy={eyeY - eyeSize * .28} r="1.8" fill="#fff" opacity=".9" />
      </>
    ),
    round: (
      <>
        <circle cx={leftEyeX} cy={eyeY} r={eyeSize} fill="#4a403a" />
        <circle cx={rightEyeX} cy={eyeY} r={eyeSize} fill="#4a403a" />
        <circle cx={leftEyeX - 2} cy={eyeY - 2} r="2" fill="#fff" opacity=".9" />
        <circle cx={rightEyeX - 2} cy={eyeY - 2} r="2" fill="#fff" opacity=".9" />
      </>
    ),
    cat: (
      <>
        <path d={`M${leftEyeX - eyeSize} ${eyeY} Q${leftEyeX} ${eyeY - eyeSize * .85} ${leftEyeX + eyeSize * 1.25} ${eyeY + 1} Q${leftEyeX} ${eyeY + eyeSize * .9} ${leftEyeX - eyeSize} ${eyeY}Z`} fill="#4a403a" />
        <path d={`M${rightEyeX - eyeSize * 1.25} ${eyeY + 1} Q${rightEyeX} ${eyeY - eyeSize * .85} ${rightEyeX + eyeSize} ${eyeY} Q${rightEyeX} ${eyeY + eyeSize * .9} ${rightEyeX - eyeSize * 1.25} ${eyeY + 1}Z`} fill="#4a403a" />
      </>
    ),
    calm: (
      <>
        <path d={`M${leftEyeX - eyeSize} ${eyeY} Q${leftEyeX} ${eyeY + eyeSize * .45} ${leftEyeX + eyeSize} ${eyeY}`} fill="none" stroke="#4a403a" strokeWidth="3" strokeLinecap="round" />
        <path d={`M${rightEyeX - eyeSize} ${eyeY} Q${rightEyeX} ${eyeY + eyeSize * .45} ${rightEyeX + eyeSize} ${eyeY}`} fill="none" stroke="#4a403a" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  }[profile.eyeStyle] || null;
  return (
    <svg className={`fashion-avatar svg-avatar reference-avatar gender-${gender}`} viewBox="0 0 280 480" role="img" aria-label="MoodFit avatar">
      <defs>
        <linearGradient id={`${svgId}-skin`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#fff3e5" />
          <stop offset="1" stopColor={skin} />
        </linearGradient>
      </defs>
      <g style={{ transform: `translateY(${(1 - heightScale) * 18}px) scale(${heightScale})`, transformOrigin: "140px 250px" }}>
        <ellipse cx="140" cy="452" rx="82" ry="13" fill="rgba(74,64,58,.13)" />
        <path d={torsoPath} fill={`url(#${svgId}-skin)`} stroke="#d4bca8" strokeWidth="2" />
        <path d={armLeft} fill={`url(#${svgId}-skin)`} stroke="#d4bca8" strokeWidth="2" />
        <path d={armRight} fill={`url(#${svgId}-skin)`} stroke="#d4bca8" strokeWidth="2" />
        <path d={`M${cx - 10} ${hipY + 8} C${cx - thighWidth} ${hipY + 44} ${cx - calfWidth} ${footY - 24} ${cx - 27} ${footY} C${cx - 8} ${footY + 9} ${cx - 4} ${footY - 12} ${cx - 1} ${hipY + 52} C${cx + 5} ${footY - 12} ${cx + 9} ${footY + 9} ${cx + 28} ${footY} C${cx + calfWidth} ${footY - 24} ${cx + thighWidth} ${hipY + 44} ${cx + 10} ${hipY + 8}Z`} fill={`url(#${svgId}-skin)`} stroke="#d4bca8" strokeWidth="2" />
        <rect x={cx - Math.max(10, profile.neckWidth * .12 + 11)} y={neckTop} width={Math.max(20, profile.neckWidth * .24 + 22)} height={neckBottom - neckTop + 5} rx="9" fill={`url(#${svgId}-skin)`} />
        <ellipse cx={cx} cy={headCy} rx={headRx} ry={headRy} fill={`url(#${svgId}-skin)`} stroke="#d4bca8" strokeWidth="2" />
        {profile.hairStyle !== "none" && <path d={hairPath} fill={hair} opacity=".95" />}
        {profile.faceDetail !== "faceless" && (
          <g className="reference-avatar-face">
            <path d={`M${leftEyeX - 12} ${eyeY - 12} Q${leftEyeX} ${eyeY - 17} ${leftEyeX + 12} ${eyeY - 12}`} fill="none" stroke="#7a5148" strokeWidth="2" strokeLinecap="round" opacity=".45" />
            <path d={`M${rightEyeX - 12} ${eyeY - 12} Q${rightEyeX} ${eyeY - 17} ${rightEyeX + 12} ${eyeY - 12}`} fill="none" stroke="#7a5148" strokeWidth="2" strokeLinecap="round" opacity=".45" />
            {eyeShape}
            <path d={`M${cx} ${noseY - noseSize} C${cx - noseSize * .5} ${noseY} ${cx - noseSize * .25} ${noseY + noseSize} ${cx + noseSize * .38} ${noseY + noseSize * .8}`} fill="none" stroke="#b47d70" strokeWidth="2" strokeLinecap="round" opacity=".65" />
            <path d={`M${cx - mouthHalf} ${mouthY} Q${cx} ${mouthY + (profile.expression === "calm" ? 3 : 9)} ${cx + mouthHalf} ${mouthY}`} fill="none" stroke="#8f5f57" strokeWidth="3" strokeLinecap="round" />
            {profile.expression === "cute" && <><circle cx={cx - headRx * .52} cy={mouthY - 9} r="6" fill="#f3a5aa" opacity=".35" /><circle cx={cx + headRx * .52} cy={mouthY - 9} r="6" fill="#f3a5aa" opacity=".35" /></>}
          </g>
        )}
        <path d={topPath} fill={topColor} stroke="#7f675c" strokeOpacity=".24" strokeWidth="2" />
        {isHoodie && <path d={`M${cx - 34} ${shoulderY + 5} C${cx - 22} ${shoulderY - 22} ${cx + 24} ${shoulderY - 22} ${cx + 36} ${shoulderY + 5} C${cx + 18} ${shoulderY + 24} ${cx - 18} ${shoulderY + 24} ${cx - 34} ${shoulderY + 5}Z`} fill={topColor} opacity=".9" />}
        {isShirt && <path d={`M${cx - 18} ${shoulderY + 8} L${cx} ${shoulderY + 30} L${cx + 18} ${shoulderY + 8} M${cx} ${shoulderY + 30} V${hipY - 8}`} fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="4" strokeLinecap="round" />}
        {outerColor && <path d={`M${leftShoulder - 10} ${shoulderY + 5} C${leftChest - 10} ${shoulderY + 25} ${leftWaist - 16} ${waistY + 32} ${leftHip - 18} ${isCoat ? hipY + 84 : hipY + 8} C${cx - 16} ${isCoat ? hipY + 98 : hipY + 20} ${cx + 16} ${isCoat ? hipY + 98 : hipY + 20} ${rightHip + 18} ${isCoat ? hipY + 84 : hipY + 8} C${rightWaist + 16} ${waistY + 32} ${rightChest + 10} ${shoulderY + 25} ${rightShoulder + 10} ${shoulderY + 5} C${cx + 34} ${shoulderY - 8} ${cx - 34} ${shoulderY - 8} ${leftShoulder - 10} ${shoulderY + 5}Z`} fill={outerColor} stroke="#7f675c" strokeOpacity=".24" strokeWidth="2" opacity=".92" />}
        {isSkirt ? <path d={skirtPath} fill={bottomColor} stroke="#7f675c" strokeOpacity=".24" strokeWidth="2" /> : <path d={pantsPath} fill={bottomColor} stroke="#7f675c" strokeOpacity=".24" strokeWidth="2" />}
        <ellipse cx={cx - 25} cy={footY + 2} rx={23 + profile.footSize * .04} ry="8" fill={shoeColor} stroke="#d2c3b8" strokeWidth="2" />
        <ellipse cx={cx + 25} cy={footY + 2} rx={23 + profile.footSize * .04} ry="8" fill={shoeColor} stroke="#d2c3b8" strokeWidth="2" />
        {accessory.id && <circle cx={cx + headRx + 15} cy={headCy + 20} r="10" fill="#f7d9d9" stroke="#d4a7a5" strokeWidth="2" />}
      </g>
    </svg>
  );
}

function FashionAvatar({ fit, mood, bodyProfile, t }) {
  return <ReferenceFashionAvatar fit={fit} bodyProfile={bodyProfile} />;
  const svgId = useId().replace(/:/g, "");
  const profile = normalizeBodyProfile(bodyProfile);
  const avatarVars = avatarVariables(profile);
  const skin = avatarVars["--avatar-skin"];
  const hair = avatarVars["--avatar-hair"];
  const safeFit = normalizeFit(fit);
  const top = safeFit.tops || {};
  const outer = safeFit.outerwear || {};
  const bottom = safeFit.bottoms || {};
  const shoes = safeFit.shoes || {};
  const bag = safeFit.bags || {};
  const accessory = safeFit.accessories || {};
  const topColor = top.color || top.primaryColor || "#eadcc7";
  const outerColor = outer.color || outer.primaryColor || "";
  const bottomColor = bottom.color || bottom.primaryColor || "#6d7f91";
  const shoeColor = shoes.color || shoes.primaryColor || "#f5f1e9";
  const isHoodie = /hood/i.test(top.subcategory || top.clothingType || "");
  const isShirt = /shirt|oxford|dress|linen/i.test(top.subcategory || top.clothingType || "");
  const isCoat = /coat|padding|cardigan/i.test(outer.subcategory || outer.clothingType || "");
  const isSkirt = /skirt/i.test(bottom.subcategory || bottom.clothingType || "");
  const isWide = /wide|baggy|cargo/i.test(bottom.subcategory || bottom.clothingType || bottom.fitType || "");
  const pose = profile.pose || "standing";
  const expressionClass = `avatar-expression-${profile.expression || "happy"}`;
  const title = [top.name, outer.name, bottom.name, shoes.name].filter(Boolean).join(" · ") || "MoodFit avatar";
  const genderShape = profile.gender === "male" ? 4 : profile.gender === "female" ? -2 : 0;
  const heightShift = (profile.height - 165) * 0.38;
  const headR = Math.max(25, Math.min(35, profile.headSize * 0.29));
  const headWidthScale = Math.max(0.86, Math.min(1.2, 1 + profile.headWidth / 160));
  const headHeightScale = Math.max(0.9, Math.min(1.22, 1 + profile.headHeight / 170 + profile.faceLength / 240));
  const jawScale = Math.max(0.82, Math.min(1.2, 1 + (profile.jawWidth + profile.jawSize) / 240));
  const faceWide = (profile.faceShape === "softSquare" ? 1.08 : profile.faceShape === "oval" ? 0.92 : profile.faceShape === "heart" ? 1.02 : 1) * headWidthScale;
  const headCx = 135;
  const headCy = 60 - (profile.headSize - 100) * 0.04;
  const headBottom = headCy + headR;
  const neckTop = headBottom - 2;
  const neckHalf = Math.max(9, Math.min(18, 11 + profile.neckWidth * 0.09));
  const neckBottom = headBottom + 14 + (profile.neckLength - 96) * 0.18;
  const shoulderY = neckBottom + 20;
  const volumeBoost = profile.weightMass * 0.08 + profile.bodyFat * 0.07 + profile.muscleMass * 0.05;
  const shoulderHalf = Math.max(37, Math.min(64, profile.shoulderWidth * 1.08 + genderShape + profile.clavicleWidth * 0.08 + profile.muscleMass * 0.08));
  const waistHalf = Math.max(22, Math.min(48, profile.waistWidth * 0.96 + profile.abdomenVolume * 0.08 + volumeBoost * 0.25));
  const hipHalf = Math.max(32, Math.min(63, profile.hipWidth * 0.92 + profile.hipVolume * 0.11 + profile.bodyFat * 0.08));
  const chestHalf = Math.max(34, Math.min(66, shoulderHalf - 4 + profile.chestVolume * 0.12 + profile.backThickness * 0.07));
  const chestY = shoulderY + 42 + profile.chestPosition * 0.18;
  const waistY = shoulderY + 86 + profile.waistHeight * 0.22;
  const torsoBottom = Math.max(220, Math.min(270, shoulderY + 105 + (profile.torsoLength - 54) * 1.25 + heightShift * 0.12));
  const legEnd = Math.max(350, Math.min(410, torsoBottom + 104 + (profile.legLength - 92) * 0.78 + heightShift * 0.55));
  const armEnd = Math.max(224, Math.min(298, shoulderY + 102 + (profile.armLength - 88) * 0.72 + heightShift * 0.18));
  const armStartY = shoulderY + 8;
  const leftShoulder = headCx - shoulderHalf;
  const rightShoulder = headCx + shoulderHalf;
  const leftWaist = headCx - waistHalf;
  const rightWaist = headCx + waistHalf;
  const leftHip = headCx - hipHalf;
  const rightHip = headCx + hipHalf;
  const armTilt = pose === "mirror" ? 10 : pose === "bag" ? -6 : 0;
  const legStep = pose === "walking" ? 7 : 0;
  const facePath = profile.faceShape === "softSquare"
    ? `M${headCx - headR * faceWide} ${headCy - headR * .2} C${headCx - headR * faceWide} ${headCy - headR * .88 * headHeightScale} ${headCx + headR * faceWide} ${headCy - headR * .88 * headHeightScale} ${headCx + headR * faceWide} ${headCy - headR * .2} L${headCx + headR * jawScale} ${headCy + headR * .72 * headHeightScale} C${headCx + headR * .42 * jawScale} ${headCy + headR * 1.08 * headHeightScale} ${headCx - headR * .42 * jawScale} ${headCy + headR * 1.08 * headHeightScale} ${headCx - headR * jawScale} ${headCy + headR * .72 * headHeightScale}Z`
    : `M${headCx} ${headCy - headR * headHeightScale} C${headCx + headR * faceWide} ${headCy - headR * headHeightScale} ${headCx + headR * 1.08 * faceWide} ${headCy + headR * .58} ${headCx} ${headCy + headR * (profile.faceShape === "oval" ? 1.2 : 1.05) * headHeightScale} C${headCx - headR * 1.08 * faceWide} ${headCy + headR * .58} ${headCx - headR * faceWide} ${headCy - headR * headHeightScale} ${headCx} ${headCy - headR * headHeightScale}Z`;
  const eyes = {
    dot: <><circle cx="124" cy={headCy + 5} r="3.4" fill="#4a403a" /><circle cx="156" cy={headCy + 5} r="3.4" fill="#4a403a" /></>,
    smile: <><path d={`M119 ${headCy + 5} Q124 ${headCy} 130 ${headCy + 5}`} fill="none" stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /><path d={`M151 ${headCy + 5} Q156 ${headCy} 162 ${headCy + 5}`} fill="none" stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /></>,
    calm: <><path d={`M119 ${headCy + 5} H130`} stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /><path d={`M151 ${headCy + 5} H162`} stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /></>,
    star: <><path d={`M124 ${headCy} L126 ${headCy + 4} L130 ${headCy + 5} L126 ${headCy + 7} L124 ${headCy + 11} L122 ${headCy + 7} L118 ${headCy + 5} L122 ${headCy + 4}Z`} fill="#4a403a" /><path d={`M156 ${headCy} L158 ${headCy + 4} L162 ${headCy + 5} L158 ${headCy + 7} L156 ${headCy + 11} L154 ${headCy + 7} L150 ${headCy + 5} L154 ${headCy + 4}Z`} fill="#4a403a" /></>,
  }[profile.eyeStyle] || <><circle cx="124" cy={headCy + 5} r="3.4" fill="#4a403a" /><circle cx="156" cy={headCy + 5} r="3.4" fill="#4a403a" /></>;
  const smilePath = {
    confident: `M130 ${headCy + 21} Q142 ${headCy + 25} 155 ${headCy + 18}`,
    calm: `M132 ${headCy + 21} Q143 ${headCy + 23} 154 ${headCy + 21}`,
    excited: `M130 ${headCy + 18} Q143 ${headCy + 31} 158 ${headCy + 18}`,
    cute: `M131 ${headCy + 19} Q143 ${headCy + 30} 157 ${headCy + 19}`,
    happy: `M131 ${headCy + 19} Q143 ${headCy + 30} 157 ${headCy + 19}`,
  }[profile.expression] || `M131 ${headCy + 19} Q143 ${headCy + 30} 157 ${headCy + 19}`;
  const hairTop = headCy - headR - 4;
  const hairPath = {
    short: `M${headCx - headR * 1.02} ${headCy - 2} C${headCx - headR} ${hairTop + 8} ${headCx - headR * .35} ${hairTop - 7} ${headCx + 2} ${hairTop - 4} C${headCx + headR * .82} ${hairTop + 1} ${headCx + headR * 1.06} ${headCy - 1} ${headCx + headR * .92} ${headCy + 7} C${headCx + headR * .42} ${headCy - 6} ${headCx - headR * .18} ${headCy - 1} ${headCx - headR * 1.02} ${headCy - 2}Z`,
    medium: `M${headCx - headR * 1.08} ${headCy + 6} C${headCx - headR} ${hairTop + 2} ${headCx - headR * .28} ${hairTop - 9} ${headCx + 2} ${hairTop - 5} C${headCx + headR * .94} ${hairTop} ${headCx + headR * 1.16} ${headCy + 13} ${headCx + headR * .9} ${headCy + headR * 1.15} C${headCx + headR * .28} ${headCy + headR * .46} ${headCx - headR * .36} ${headCy + headR * .45} ${headCx - headR * 1.08} ${headCy + 6}Z`,
    long: `M${headCx - headR * 1.18} ${headCy + 5} C${headCx - headR * 1.06} ${hairTop} ${headCx - headR * .28} ${hairTop - 12} ${headCx + 2} ${hairTop - 7} C${headCx + headR} ${hairTop - 2} ${headCx + headR * 1.25} ${headCy + 15} ${headCx + headR * 1.04} ${headCy + headR * 2.05} C${headCx + headR * .34} ${headCy + headR * 1.78} ${headCx - headR * .42} ${headCy + headR * 1.78} ${headCx - headR * 1.18} ${headCy + 5}Z`,
    wavy: `M${headCx - headR * 1.18} ${headCy + 5} C${headCx - headR * 1.03} ${hairTop} ${headCx - headR * .28} ${hairTop - 12} ${headCx + 2} ${hairTop - 7} C${headCx + headR} ${hairTop - 2} ${headCx + headR * 1.25} ${headCy + 15} ${headCx + headR} ${headCy + headR * 1.8} C${headCx + headR * .64} ${headCy + headR * 1.35} ${headCx + headR * .2} ${headCy + headR * 1.96} ${headCx - headR * .2} ${headCy + headR * 1.45} C${headCx - headR * .54} ${headCy + headR * 1.98} ${headCx - headR * 1.18} ${headCy + headR * 1.52} ${headCx - headR * 1.18} ${headCy + 5}Z`,
    straight: `M${headCx - headR * 1.08} ${headCy + 5} C${headCx - headR} ${hairTop + 1} ${headCx - headR * .3} ${hairTop - 10} ${headCx + 1} ${hairTop - 6} C${headCx + headR * .94} ${hairTop - 1} ${headCx + headR * 1.14} ${headCy + 12} ${headCx + headR} ${headCy + headR * 1.72} C${headCx + headR * .4} ${headCy + headR * 1.56} ${headCx - headR * .42} ${headCy + headR * 1.56} ${headCx - headR * 1.08} ${headCy + 5}Z`,
    ponytail: `M${headCx - headR * 1.02} ${headCy - 1} C${headCx - headR} ${hairTop + 4} ${headCx - headR * .3} ${hairTop - 9} ${headCx + 2} ${hairTop - 5} C${headCx + headR * .86} ${hairTop - 1} ${headCx + headR * 1.05} ${headCy + 3} ${headCx + headR * .84} ${headCy + 12} C${headCx + headR * 1.55} ${headCy + 34} ${headCx + headR * 1.25} ${headCy + headR * 1.88} ${headCx + headR * .78} ${headCy + headR * 1.64} C${headCx + headR * .96} ${headCy + headR * .72} ${headCx + headR * .42} ${headCy + 2} ${headCx - headR * 1.02} ${headCy - 1}Z`,
    bangs: `M${headCx - headR * 1.04} ${headCy + 1} C${headCx - headR} ${hairTop + 2} ${headCx - headR * .25} ${hairTop - 11} ${headCx + 2} ${hairTop - 6} C${headCx + headR * .92} ${hairTop - 1} ${headCx + headR * 1.1} ${headCy + 6} ${headCx + headR * .9} ${headCy + 14} C${headCx + headR * .28} ${headCy - 1} ${headCx - headR * .28} ${headCy + 14} ${headCx - headR * 1.04} ${headCy + 1}Z`,
  }[profile.hairStyle] || `M${headCx - headR * 1.08} ${headCy + 6} C${headCx - headR} ${hairTop + 2} ${headCx - headR * .28} ${hairTop - 9} ${headCx + 2} ${hairTop - 5} C${headCx + headR * .94} ${hairTop} ${headCx + headR * 1.16} ${headCy + 13} ${headCx + headR * .9} ${headCy + headR * 1.15} C${headCx + headR * .28} ${headCy + headR * .46} ${headCx - headR * .36} ${headCy + headR * .45} ${headCx - headR * 1.08} ${headCy + 6}Z`;
  const upperArmWidth = 9 + profile.upperArmWidth * 0.04 + profile.muscleMass * 0.04 + volumeBoost * 0.08;
  const lowerArmWidth = 7 + profile.lowerArmWidth * 0.035 + profile.muscleMass * 0.025 + volumeBoost * 0.05;
  const thighWidth = 12 + profile.thighWidth * 0.08 + profile.bodyFat * 0.06 + profile.muscleMass * 0.05;
  const calfWidth = 9 + profile.calfWidth * 0.06 + profile.muscleMass * 0.05;
  const bodyBasePath = `M${headCx - neckHalf} ${neckTop} H${headCx + neckHalf} L${headCx + neckHalf + 3} ${neckBottom} C${headCx + 28} ${shoulderY - 4} ${rightShoulder - 12} ${shoulderY - 1} ${rightShoulder} ${shoulderY + 8} C${rightShoulder + upperArmWidth + 7} ${shoulderY + 34} ${rightShoulder + lowerArmWidth + 12 + armTilt} ${armEnd - 24} ${rightShoulder + lowerArmWidth + 8 + armTilt} ${armEnd} C${rightShoulder + lowerArmWidth + 5 + armTilt} ${armEnd + 14} ${rightShoulder - 3 + armTilt} ${armEnd + 16} ${rightShoulder - lowerArmWidth + armTilt} ${armEnd + 4} C${rightShoulder - upperArmWidth + armTilt} ${armEnd - 30} ${rightShoulder - 14} ${shoulderY + 44} ${rightShoulder - 20} ${shoulderY + 20} C${rightShoulder - 13} ${chestY} ${rightWaist + 7} ${waistY} ${rightHip} ${torsoBottom} L${rightHip + thighWidth + legStep} ${torsoBottom + 70} C${rightHip + calfWidth + legStep} ${legEnd - 40} ${rightHip + calfWidth + legStep} ${legEnd - 12} ${headCx + 11 + legStep} ${legEnd + 5} C${headCx + 4 + legStep} ${legEnd + 11} ${headCx - 2 + legStep} ${legEnd + 10} ${headCx + 2} ${torsoBottom + 30} L${headCx - 3} ${legEnd + 5} C${headCx - 11 - legStep} ${legEnd + 11} ${leftHip - calfWidth - legStep} ${legEnd - 12} ${leftHip - calfWidth - legStep} ${legEnd - 40} L${leftHip - thighWidth - legStep} ${torsoBottom + 70} L${leftHip} ${torsoBottom} C${leftWaist - 7} ${waistY} ${leftShoulder + 13} ${chestY} ${leftShoulder + 20} ${shoulderY + 20} C${leftShoulder + 14} ${shoulderY + 44} ${leftShoulder + upperArmWidth - armTilt} ${armEnd - 30} ${leftShoulder + lowerArmWidth - armTilt} ${armEnd + 4} C${leftShoulder + 3 - armTilt} ${armEnd + 16} ${leftShoulder - lowerArmWidth - 5 - armTilt} ${armEnd + 14} ${leftShoulder - lowerArmWidth - 8 - armTilt} ${armEnd} C${leftShoulder - lowerArmWidth - 12 - armTilt} ${armEnd - 24} ${leftShoulder - upperArmWidth - 7 - armTilt} ${shoulderY + 34} ${leftShoulder} ${shoulderY + 8} C${leftShoulder + 12} ${shoulderY - 1} ${headCx - 28} ${shoulderY - 4} ${headCx - neckHalf - 3} ${neckBottom}Z`;
  const torsoPath = `M${leftShoulder + 7} ${shoulderY + 8} C${leftShoulder + 21} ${shoulderY - 5} 122 ${shoulderY - 9} 136 ${shoulderY - 9} C151 ${shoulderY - 9} ${rightShoulder - 21} ${shoulderY - 5} ${rightShoulder - 7} ${shoulderY + 8} L${rightWaist + 7} ${torsoBottom} C151 ${torsoBottom + 12} 120 ${torsoBottom + 12} ${leftWaist - 7} ${torsoBottom}Z`;
  const outerPath = isCoat
    ? `M${leftShoulder - 9} ${shoulderY + 5} C111 ${shoulderY - 8} 122 ${shoulderY - 9} 136 ${shoulderY} C151 ${shoulderY - 9} 164 ${shoulderY - 8} ${rightShoulder + 9} ${shoulderY + 5} L${rightHip + 16} ${Math.min(334, torsoBottom + 62)} C164 344 108 344 ${leftHip - 16} ${Math.min(334, torsoBottom + 62)}Z`
    : `M${leftShoulder - 8} ${shoulderY + 7} C111 ${shoulderY - 7} 122 ${shoulderY - 7} 136 ${shoulderY + 2} C151 ${shoulderY - 7} 164 ${shoulderY - 7} ${rightShoulder + 8} ${shoulderY + 7} L${rightWaist + 14} ${torsoBottom + 24} C158 ${torsoBottom + 34} 113 ${torsoBottom + 34} ${leftWaist - 14} ${torsoBottom + 24}Z`;
  const pantsPath = isWide
    ? `M${leftHip} ${torsoBottom - 2} H${rightHip} L${rightHip + 14} ${legEnd} C171 ${legEnd + 8} 155 ${legEnd + 8} 143 ${legEnd} L136 ${torsoBottom + 24} L127 ${legEnd} C114 ${legEnd + 8} 98 ${legEnd + 8} ${leftHip - 14} ${legEnd}Z`
    : `M${leftHip + 6} ${torsoBottom - 2} H${rightHip - 6} L${rightHip + 1} ${legEnd} C160 ${legEnd + 7} 149 ${legEnd + 7} 138 ${legEnd} L135 ${torsoBottom + 25} L130 ${legEnd} C119 ${legEnd + 7} 108 ${legEnd + 7} ${leftHip - 1} ${legEnd}Z`;
  const skirtPath = `M${leftHip - 5} ${torsoBottom - 2} C120 ${torsoBottom + 10} 151 ${torsoBottom + 10} ${rightHip + 5} ${torsoBottom - 2} L${rightHip + 18} ${Math.min(344, torsoBottom + 68)} C158 ${Math.min(356, torsoBottom + 82)} 112 ${Math.min(356, torsoBottom + 82)} ${leftHip - 18} ${Math.min(344, torsoBottom + 68)}Z`;

  return (
    <svg className={`fashion-avatar svg-avatar ${mood} gender-${profile.gender} body-${profile.bodyType} pose-${pose} ${expressionClass}`} viewBox="0 0 270 430" role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id={`${svgId}-skin`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={colorMixFallback(skin, "#ffffff")} />
          <stop offset="100%" stopColor={skin} />
        </linearGradient>
        <filter id={`${svgId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#6d574f" floodOpacity=".16" />
        </filter>
      </defs>
      <ellipse cx="135" cy="414" rx="92" ry="16" fill="rgba(74,64,58,.14)" />
      <g filter={`url(#${svgId}-shadow)`}>
        <path d={bodyBasePath} fill={`url(#${svgId}-skin)`} stroke="#6d574f" strokeOpacity=".14" strokeWidth="2" strokeLinejoin="round" />
        {profile.hairStyle !== "none" && <path d={hairPath} fill={hair} />}
        <path d={facePath} fill={`url(#${svgId}-skin)`} stroke="#6d574f" strokeOpacity=".08" strokeWidth="1.5" />
        {profile.faceDetail !== "faceless" && <g className="svg-face">
          {eyes}
          <path d="M142 104 Q139 111 143 112" fill="none" stroke="#9b6d5f" strokeWidth="2" strokeLinecap="round" />
          <path d={smilePath} fill="none" stroke="#8b5f54" strokeWidth="3" strokeLinecap="round" />
          {profile.expression === "cute" && <><circle cx="116" cy="113" r="5" fill="#f0a7a9" opacity=".55" /><circle cx="168" cy="113" r="5" fill="#f0a7a9" opacity=".55" /></>}
        </g>}
        {profile.faceDetail === "faceless" && <path d={`M${headCx - headR * .18} ${headCy + headR * .18} C${headCx - 5} ${headCy + headR * .44} ${headCx + 6} ${headCy + headR * .45} ${headCx + headR * .16} ${headCy + headR * .2}`} fill="none" stroke="#d9c7b6" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />}
        {isHoodie && <path d={`M${leftShoulder + 6} ${shoulderY + 6} C106 ${shoulderY - 20} 128 ${shoulderY - 28} 148 ${shoulderY - 22} C166 ${shoulderY - 17} 176 ${shoulderY - 5} ${rightShoulder - 4} ${shoulderY + 13} L160 ${shoulderY + 26} C151 ${shoulderY + 12} 125 ${shoulderY + 10} 112 ${shoulderY + 26}Z`} fill={topColor} opacity=".92" />}
        <path d={torsoPath} fill={topColor} stroke="#6d574f" strokeOpacity=".22" strokeWidth="2" />
        {isShirt && <path d="M118 151 L136 169 L154 151 M136 169 L136 273" fill="none" stroke="#ffffff" strokeOpacity=".78" strokeWidth="4" strokeLinecap="round" />}
        {top.pattern === "Stripe" && <g opacity=".55" stroke="#fff" strokeWidth="5"><path d="M99 184 H176" /><path d="M97 218 H178" /><path d="M97 252 H176" /></g>}
        {outerColor && <path d={outerPath} fill={outerColor} stroke="#6d574f" strokeOpacity=".22" strokeWidth="2" opacity=".9" />}
        <path d={`M${leftShoulder - 2} ${armStartY + 13} C${leftShoulder - 14} ${armStartY + 37} ${leftShoulder - 18} ${armEnd - 30} ${leftShoulder - 16} ${armEnd} C${leftShoulder - 15} ${armEnd + 13} ${leftShoulder - 2} ${armEnd + 14} ${leftShoulder + 3} ${armEnd + 2} C${leftShoulder + 9} ${armEnd - 30} ${leftShoulder + 12} ${armStartY + 42} ${leftShoulder + 17} ${armStartY + 16}Z`} fill={skin} stroke="#6d574f" strokeOpacity=".14" strokeWidth="2" />
        <path d={`M${rightShoulder + 2} ${armStartY + 13} C${rightShoulder + 16} ${armStartY + 37} ${rightShoulder + 21} ${armEnd - 30} ${rightShoulder + 19} ${armEnd} C${rightShoulder + 18} ${armEnd + 13} ${rightShoulder + 5} ${armEnd + 14} ${rightShoulder} ${armEnd + 2} C${rightShoulder - 6} ${armEnd - 30} ${rightShoulder - 10} ${armStartY + 42} ${rightShoulder - 17} ${armStartY + 16}Z`} fill={skin} stroke="#6d574f" strokeOpacity=".14" strokeWidth="2" />
        <path d={`M${leftShoulder + 4} ${shoulderY + 8} C${leftShoulder - 6} ${shoulderY + 25} ${leftShoulder - 6} ${shoulderY + 49} ${leftShoulder + 9} ${shoulderY + 59} C${leftShoulder + 21} ${shoulderY + 43} ${leftShoulder + 22} ${shoulderY + 20} ${leftShoulder + 12} ${shoulderY + 8}Z`} fill={topColor} stroke="#6d574f" strokeOpacity=".16" strokeWidth="2" />
        <path d={`M${rightShoulder - 4} ${shoulderY + 8} C${rightShoulder + 8} ${shoulderY + 25} ${rightShoulder + 8} ${shoulderY + 49} ${rightShoulder - 8} ${shoulderY + 59} C${rightShoulder - 20} ${shoulderY + 43} ${rightShoulder - 21} ${shoulderY + 20} ${rightShoulder - 12} ${shoulderY + 8}Z`} fill={topColor} stroke="#6d574f" strokeOpacity=".16" strokeWidth="2" />
        {isSkirt
          ? <path d={skirtPath} fill={bottomColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />
          : <path d={pantsPath} fill={bottomColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />}
        {isSkirt && <>
          <path d={`M104 ${legEnd - 34} C112 ${legEnd - 28} 122 ${legEnd - 28} 130 ${legEnd - 34} L128 ${legEnd + 13} C120 ${legEnd + 19} 108 ${legEnd + 19} 99 ${legEnd + 12}Z`} fill={skin} />
          <path d={`M142 ${legEnd - 34} C150 ${legEnd - 28} 160 ${legEnd - 28} 168 ${legEnd - 34} L175 ${legEnd + 12} C166 ${legEnd + 19} 154 ${legEnd + 19} 146 ${legEnd + 13}Z`} fill={skin} />
        </>}
        <path d={`M86 ${legEnd + 8} C105 ${legEnd + 2} 122 ${legEnd + 4} 133 ${legEnd + 17} C124 ${legEnd + 29} 93 ${legEnd + 29} 79 ${legEnd + 19}Z`} fill={shoeColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />
        <path d={`M139 ${legEnd + 17} C151 ${legEnd + 4} 169 ${legEnd + 2} 188 ${legEnd + 8} L195 ${legEnd + 19} C181 ${legEnd + 29} 150 ${legEnd + 29} 139 ${legEnd + 17}Z`} fill={shoeColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />
        {bag.id && <path d="M198 221 C223 227 229 270 210 292 C193 285 188 244 198 221Z" fill={bag.color || "#8c5a38"} stroke="#6d574f" strokeOpacity=".25" strokeWidth="2" />}
        {accessory.id && <path d="M121 142 Q136 156 153 142" fill="none" stroke={accessory.color || "#d8d8d6"} strokeWidth="5" strokeLinecap="round" />}
      </g>
    </svg>
  );
}

function Info({ title, value }) {
  return <article className="info-card"><small>{title}</small><p>{value}</p></article>;
}

function Segment({ label, items, value, onChange }) {
  return <div className="segment"><span>{label}</span>{items.map(([key, text]) => <button key={key} className={value === key ? "active" : ""} onClick={() => onChange(key)} type="button">{text}</button>)}</div>;
}

function RangeControl({ label, min, max, value, onChange }) {
  return (
    <label className="range-control">
      <span>{label}<strong>{value}</strong></span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MiniFit({ fit }) {
  const safeFit = normalizeFit(fit);
  return <span className="mini-fit">{["tops", "outerwear", "bottoms", "shoes"].map((key) => <i key={key} style={{ "--c": safeFit[key]?.color || "#ddd" }} />)}</span>;
}

function AvatarWardrobe({ t, fit, wardrobe, wear }) {
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeFit = normalizeFit(fit, safeWardrobe);
  const [selected, setSelected] = useState(safeWardrobe[0] || null);
  const slots = ["tops", "outerwear", "bottoms", "shoes", "bags", "accessories"];
  return (
    <aside className="avatar-wardrobe">
      <div className="avatar-wardrobe-head">
        <p className="eyebrow">{t("avatarWardrobe")}</p>
        <strong>{t("wearingNow")}</strong>
      </div>
      <div className="wearing-details">
        {slots.map((slot) => (
          <div className="wearing-detail" key={slot}>
            <span style={{ "--swatch": safeFit[slot]?.color || "#ddd" }} />
            <div>
              <small>{t(`part${capitalize(slot)}`) || t(slot)}</small>
              <strong>{safeFit[slot]?.name || t(slot)}</strong>
              <em>{safeFit[slot] ? `${t(safeFit[slot].fitType || "regularFit")} · ${safeFit[slot].season || "all"}` : t("emptyWardrobe")}</em>
            </div>
          </div>
        ))}
      </div>
      <div className="avatar-closet-list">
        {safeWardrobe.map((item) => (
          <button className={selected?.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelected(item)} type="button">
            {item.image ? <img src={item.image} alt="" /> : <span style={{ "--swatch": item.color }} />}
            <div>
              <strong>{item.name}</strong>
              <small>{t(item.category)} · {t(item.mood)}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="selected-garment-detail">
        <p className="eyebrow">{t("itemDetail")}</p>
        {selected ? (
          <>
            <div className="detail-swatch" style={{ "--swatch": selected.color }}>
              {selected.image && <img src={selected.image} alt="" />}
            </div>
            <strong>{selected.name}</strong>
            <dl>
              <div><dt>{t("category")}</dt><dd>{t(selected.category)}</dd></div>
              <div><dt>{t("fitType")}</dt><dd>{t(selected.fitType || "regularFit")}</dd></div>
              <div><dt>{t("season")}</dt><dd>{selected.season || "all"}</dd></div>
              <div><dt>{t("vibe")}</dt><dd>{selected.vibe || t(selected.mood)}</dd></div>
            </dl>
            <button className="primary detail-dress-button" onClick={() => wear(selected)} type="button">{t("dressOnAvatar")}</button>
          </>
        ) : <p>{t("noItemSelected")}</p>}
      </div>
    </aside>
  );
}

function SettingsModal({ t, language, setLanguage, theme, setTheme, session, logout, onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="settings-modal glass">
        <div className="section-head">
          <div><p className="eyebrow">{t("settingsTitle")}</p><h2>{t("openSettings")}</h2></div>
          <button className="round-button" onClick={onClose} type="button" aria-label={t("closeSettings")}><X size={18} /></button>
        </div>
        <div className="settings-modal-grid">
          <Segment label={t("languageSetting")} items={[["ko", t("korean")], ["en", t("english")]]} value={language} onChange={setLanguage} />
          <Segment label={t("themeSetting")} items={themes.map((item) => [item, t(`theme${capitalize(item)}`)])} value={theme} onChange={setTheme} />
          <article className="account-card">
            <small>{t("accountSetting")}</small>
            <strong>{session?.mode === "guest" ? t("guestStatus") : t("accountStatus")}</strong>
            <p>{session?.mode === "guest" ? t("localOnly") : t("protectedCopy")}</p>
            {session?.mode === "account" && <button className="secondary" onClick={logout} type="button"><LogOut size={16} />{t("logout")}</button>}
          </article>
        </div>
      </section>
    </div>
  );
}

function scoreOutfit({ fit, weather, mood, eventType }) {
  const safeFit = normalizeFit(fit);
  const items = Object.values(safeFit).filter(Boolean);
  const colorNames = items.map((item) => `${item.colorName || item.color || ""}`.toLowerCase());
  const hasOuter = Boolean(safeFit.outerwear);
  const hasShoes = Boolean(safeFit.shoes);
  const weatherText = `${weather || ""}`.toLowerCase();
  const moodText = `${mood || ""}`.toLowerCase();
  const eventText = `${eventType || ""}`.toLowerCase();
  const isRain = weatherText.includes("rain") || weatherText.includes("비");
  const isCold = weatherText.includes("cold") || weatherText.includes("추") || weatherText.includes("winter");
  const hasLightDarkBalance =
    colorNames.some((color) => color.includes("black") || color.includes("navy") || color.includes("brown") || color.includes("dark")) &&
    colorNames.some((color) => color.includes("white") || color.includes("ivory") || color.includes("cream") || color.includes("beige"));
  const patternWords = ["stripe", "striped", "check", "checkered", "plaid", "floral", "graphic", "denim"];
  const patternItems = items.filter((item) =>
    patternWords.some((pattern) =>
      `${item.pattern || ""} ${item.clothingType || ""} ${item.vibe || ""} ${item.styleCategory || ""}`.toLowerCase().includes(pattern)
    )
  );
  const patternWarning = patternItems.length > 1;
  const coverageBonus = Math.min(12, items.length * 3);
  const color = Math.max(54, Math.min(97, 72 + coverageBonus + (hasLightDarkBalance ? 10 : 3) - (patternWarning ? 9 : 0)));
  const comfort = Math.max(
    52,
    Math.min(96, 66 + coverageBonus + (hasShoes ? 8 : 0) + (hasOuter ? 7 : 0) + (isRain ? (hasOuter ? 4 : -7) : 3) + (isCold ? (hasOuter ? 5 : -5) : 0))
  );
  const confidence = Math.max(58, Math.min(98, 70 + coverageBonus + (moodText.includes("luxury") || moodText.includes("chic") ? 9 : 5) + (eventText ? 5 : 0)));
  const total = Math.round((color + comfort + confidence) / 3);
  return { total, color, comfort, confidence, patternWarning };
}

function token(value, fallback = "basic") {
  return String(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function fashionText(value) {
  return fashionLabelMap[value] || value || "";
}

function inferSubcategory(category, clothingType) {
  const text = String(clothingType || "").toLowerCase();
  if (text.includes("hood")) return "Pullover Hoodie";
  if (text.includes("shirt")) return "Basic T-Shirt";
  if (text.includes("jean")) return "Straight Jeans";
  if (text.includes("coat")) return "Long Coat";
  if (text.includes("jacket")) return "Denim Jacket";
  return subcategoryOptions[category]?.[0] || "Fashion Item";
}

function inferFabric(subcategory, pattern) {
  const text = `${subcategory || ""} ${pattern || ""}`.toLowerCase();
  if (text.includes("denim") || text.includes("jeans")) return "Denim";
  if (text.includes("leather")) return "Leather";
  if (text.includes("wool") || text.includes("coat")) return "Wool";
  if (text.includes("linen")) return "Linen";
  if (text.includes("fleece") || text.includes("hoodie")) return "Fleece";
  if (text.includes("knit") || text.includes("turtleneck")) return "Cashmere";
  return "Cotton";
}

function inferNeckType(subcategory) {
  const text = String(subcategory || "").toLowerCase();
  if (text.includes("turtleneck")) return "Turtleneck";
  if (text.includes("shirt")) return "Collar";
  if (text.includes("v neck")) return "V Neck";
  return "Round Neck";
}

function inferSleeveType(subcategory) {
  const text = String(subcategory || "").toLowerCase();
  if (text.includes("short sleeve") || text.includes("shorts")) return "Short Sleeve";
  if (text.includes("sleeveless")) return "Sleeveless";
  return "Long Sleeve";
}

function inferLayer(category) {
  if (category === "outerwear") return "Outer Layer";
  if (category === "tops") return "Inner Layer";
  return "Base Layer";
}

function clothingVisuals(item = {}, slot = "tops") {
  const subcategory = item?.subcategory || item?.clothingType || inferSubcategory(slot, "");
  const fitType = item?.fitType || "Regular Fit";
  const fabric = item?.fabric || inferFabric(subcategory, item?.pattern);
  const pattern = item?.pattern || "Solid";
  const primary = item?.primaryColor || item?.color || "#eadcc7";
  const secondary = item?.secondaryColor || colorMixFallback(primary, "#ffffff");
  const accent = item?.accentColor || "#f7d9d9";
  const typeClass = `garment-type-${token(subcategory)}`;
  const fitClass = `garment-fit-${token(fitType)}`;
  const fabricClass = `garment-fabric-${token(fabric)}`;
  const patternClass = `garment-pattern-${token(pattern)}`;
  const neckClass = `neck-${token(item?.neckType || inferNeckType(subcategory))}`;
  const sleeveClass = `sleeve-${token(item?.sleeveType || inferSleeveType(subcategory))}`;
  const base = `wear-part ${fitClass} ${fabricClass} ${typeClass} ${patternClass} ${neckClass} ${sleeveClass}`;
  const dims = visualDimensions({ slot, subcategory, fitType, fabric });
  const style = {
    "--cloth": primary,
    "--cloth-secondary": secondary,
    "--cloth-accent": accent,
    ...dims,
  };

  if (slot === "outerwear") return { leftClassName: `outer left ${base}`, rightClassName: `outer right ${base}`, style };
  if (slot === "bottoms") return { className: `bottom ${base}`, style };
  if (slot === "shoes") return { leftClassName: `shoe left ${base}`, rightClassName: `shoe right ${base}`, style };
  return { className: `torso ${base}`, style };
}

function visualDimensions({ slot, subcategory, fitType, fabric }) {
  const sub = String(subcategory || "").toLowerCase();
  const fit = String(fitType || "").toLowerCase();
  const fab = String(fabric || "").toLowerCase();
  const oversized = fit.includes("oversized");
  const slim = fit.includes("slim") || sub.includes("skinny");
  const wide = fit.includes("wide") || fit.includes("baggy") || sub.includes("wide") || sub.includes("baggy") || sub.includes("cargo");
  const cropped = fit.includes("cropped") || sub.includes("short cardigan");
  const puffy = fab.includes("fleece") || fab.includes("wool") || fab.includes("padding") || sub.includes("padding");
  const stiff = fab.includes("denim") || fab.includes("leather") || fab.includes("corduroy");

  if (slot === "bottoms") {
    return {
      "--bottom-width": slim ? "104px" : wide ? "172px" : "138px",
      "--bottom-height": sub.includes("shorts") || sub.includes("skirt") ? "72px" : wide ? "118px" : "96px",
      "--leg-opening": slim ? "22px" : wide ? "58px" : "38px",
    };
  }
  if (slot === "outerwear") {
    return {
      "--outer-width": oversized || wide ? "98px" : slim ? "66px" : "82px",
      "--outer-height": sub.includes("long") || sub.includes("trench") ? "252px" : sub.includes("padding") ? "214px" : "192px",
      "--sleeve-volume": puffy ? "1.18" : stiff ? ".98" : "1",
    };
  }
  if (slot === "shoes") {
    return {
      "--shoe-width": sub.includes("boot") ? "76px" : sub.includes("sandal") ? "58px" : "68px",
      "--shoe-height": sub.includes("boot") ? "34px" : "23px",
    };
  }
  return {
    "--top-width": oversized || wide ? "174px" : slim ? "112px" : "140px",
    "--top-height": cropped ? "118px" : oversized ? "188px" : puffy ? "178px" : "154px",
    "--top-radius": stiff ? "28px 28px 20px 20px" : puffy ? "58px 58px 38px 38px" : "42px 42px 26px 26px",
    "--shoulder-drop": oversized ? "18px" : slim ? "-3px" : "6px",
  };
}

function colorMixFallback(color, fallback) {
  return color && color !== fallback ? fallback : "#ddebf3";
}

function GameScorePanel({ t, scores }) {
  const items = [
    [t("outfitScore"), scores.total],
    [t("colorScore"), scores.color],
    [t("comfortScore"), scores.comfort],
    [t("confidenceScore"), scores.confidence],
  ];
  return (
    <div className="score-panel">
      {items.map(([label, value]) => (
        <article key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
          <i style={{ "--score": `${value}%` }} />
        </article>
      ))}
      <p><b>{t("patternAnalysis")}</b> {scores.patternWarning ? t("patternWarning") : t("patternGood")}</p>
    </div>
  );
}

function GameLayer({ t, game, wardrobe, savedLooks }) {
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const level = game.level || levelFromXp(game.xp);
  const progress = Math.min(100, (game.xp / Math.max(100, level * 250)) * 100);
  const missions = [
    ["missionBright", "Color", 30],
    ["missionMonochrome", "Tone", 40],
    ["missionUpload", "Closet", 45],
    ["missionOldItem", "Memory", 35],
  ];
  const badges = ["badgeMinimal", "badgeColor", "badgeRain", "badgeCampus"];
  const unlocked = Math.min(4, Math.max(1, Math.floor((safeWardrobe.length + safeSavedLooks.length) / 2)));
  return (
    <section className="game-layer glass">
      <div className="game-intro">
        <div className="game-orb"><UserRound size={19} /></div>
        <p className="eyebrow">{t("gameTitle")}</p>
        <h2>{t("gameLead")}</h2>
      </div>
      <div className="game-stats">
        <article><Trophy size={18} /><span>{t("styleLevel")}</span><strong>{level}</strong></article>
        <article><Sparkles size={18} /><span>{t("fashionXp")}</span><strong>{game.xp}</strong><i style={{ "--xp": `${progress}%` }} /></article>
        <article><Coins size={18} /><span>{t("styleCoins")}</span><strong>{game.coins}</strong></article>
        <article><UserRound size={18} /><span>{t("petLevel")}</span><strong>{game.petLevel}</strong></article>
      </div>
      <div className="mission-board">
        <div>
          <p className="eyebrow">{t("dailyMissions")}</p>
          {missions.map(([key, tag, xp]) => (
            <article className="mission" key={key}>
              <Check size={16} />
              <span>{t(key)}</span>
              <em>+{xp} XP</em>
              <small>{tag}</small>
            </article>
          ))}
        </div>
        <div>
          <p className="eyebrow">{t("achievements")}</p>
          <div className="badge-grid">
            {badges.map((badge, index) => <span key={badge} className={index < unlocked ? "unlocked" : ""}><Medal size={16} />{t(badge)}</span>)}
          </div>
          <div className="collection-card">
            <Gift size={18} />
            <strong>{t("collectionTitle")}</strong>
            <p>{t("collectionLead")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureShowcase({ t }) {
  const cards = [
    ["featureReply", "featureReplyCopy", Mail],
    ["featureSummary", "featureSummaryCopy", Search],
    ["featureSchedule", "featureScheduleCopy", Settings],
    ["featureMood", "featureMoodCopy", Moon],
    ["featureFashion", "featureFashionCopy", Shirt],
  ];
  return (
    <section className="feature-showcase glass">
      <div className="feature-intro">
        <p className="eyebrow">{t("tagline")}</p>
        <h2>{t("featureSectionTitle")}</h2>
        <p>{t("featureSectionLead")}</p>
      </div>
      <div className="feature-cards">
        {cards.map(([title, copy, Icon]) => (
          <article className="feature-card" key={title}>
            <span><Icon size={18} /></span>
            <h3>{t(title)}</h3>
            <p>{t(copy)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RealLifeExamples({ t }) {
  return (
    <section className="real-examples">
      <div className="examples-copy glass">
        <p className="eyebrow">{t("examplesTitle")}</p>
        <h2>{t("examplesLead")}</h2>
      </div>
      <article className="example-card chat-example glass">
        <span className="example-label">{t("exampleChatTitle")}</span>
        <div className="chat-preview">
          <p>{t("exampleChatMessage")}</p>
          <p>{t("exampleChatReply")}</p>
        </div>
        <strong>{t("exampleChatOutfit")}</strong>
      </article>
      <article className="example-card glass">
        <span className="example-label">{t("exampleMoodTitle")}</span>
        <p>{t("exampleMoodCopy")}</p>
        <div className="mood-track"><i /><i /><i /><i /></div>
      </article>
      <article className="example-card glass">
        <span className="example-label">{t("examplePlanTitle")}</span>
        <p>{t("examplePlanCopy")}</p>
        <div className="plan-strip"><span>09:30</span><span>18:00</span><span>20:30</span></div>
      </article>
    </section>
  );
}

function TrustSection({ t }) {
  const items = ["trustLocal", "trustNoPassword", "trustDelete", "trustPrivate"];
  return (
    <section className="trust-section glass">
      <div>
        <p className="eyebrow">{t("trustTitle")}</p>
        <h2>{t("trustLead")}</h2>
      </div>
      <div className="trust-grid">
        {items.map((item) => <article key={item}>{t(item)}</article>)}
      </div>
    </section>
  );
}

function PlatformLayer({ t, wardrobe, savedLooks, fit }) {
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const safeFit = normalizeFit(fit, safeWardrobe);
  const palette = Object.values(safeFit).filter(Boolean).map((item) => item.color).slice(0, 5);
  const topCategory = safeWardrobe.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const strongestCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "tops";

  const cards = [
    {
      title: t("styleDnaTitle"),
      copy: t("styleDnaCopy"),
      stat: `${safeWardrobe.filter((item) => item.checklist?.favorite || item.source === "scanned").length + safeSavedLooks.length} signals`,
      visual: <div className="dna-rings"><i /><i /><i /></div>,
    },
    {
      title: t("fashionFeedTitle"),
      copy: t("fashionFeedCopy"),
      stat: fashionText(strongestCategory),
      visual: <div className="feed-preview">{palette.map((color, index) => <span key={`${color}-${index}`} style={{ "--tone": color }} />)}</div>,
    },
    {
      title: t("smartShoppingTitle"),
      copy: t("smartShoppingCopy"),
      stat: "price · quality · fit",
      visual: <div className="shopping-preview"><span>$72</span><span>$128</span><span>$210</span></div>,
    },
    {
      title: t("outfitCalendarTitle"),
      copy: t("outfitCalendarCopy"),
      stat: `${safeSavedLooks.length || 0} saved looks`,
      visual: <div className="calendar-preview"><i>Mon</i><i>Thu</i><i>Sun</i></div>,
    },
    {
      title: t("premiumTitle"),
      copy: t("premiumCopy"),
      stat: "Free · Premium · Marketplace",
      visual: <div className="premium-preview"><strong>MF+</strong></div>,
    },
  ];

  return (
    <section className="platform-layer glass">
      <div className="platform-intro">
        <p className="eyebrow">{t("platformTitle")}</p>
        <h2>{t("platformLead")}</h2>
      </div>
      <div className="platform-grid">
        {cards.map((card) => (
          <article className="platform-card" key={card.title}>
            {card.visual}
            <span>{card.stat}</span>
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildRecommendation({ t, mood, fit, brief, weather, schedule, eventType, aesthetic }) {
  const safeFit = normalizeFit(fit);
  const pieces = [safeFit.tops, safeFit.outerwear, safeFit.bottoms, safeFit.shoes].filter(Boolean).map((item) => item.name);
  const pieceText = pieces.length ? pieces.join(", ") : t("wardrobeTitle");
  return {
    name: `${t(mood)} Atelier ${eventType || "Look"}`,
    explanation: t("recommendationSentence").replace("{schedule}", schedule || t("schedule")).replace("{pieces}", pieceText),
    colors: [safeFit.tops?.color, safeFit.outerwear?.color, safeFit.bottoms?.color].filter(Boolean).join(" · "),
    avoid: t("avoidSentence").replace("{weather}", weather || t("weather")),
    tips: `${t("tipSentence").replace("{aesthetic}", aesthetic || t("aesthetic"))}${brief ? ` ${sanitizeInput(brief)}` : ""}`,
  };
}

function detectMood(text, fallback) {
  const value = text.toLowerCase();
  if (value.includes("street") || value.includes("campus") || value.includes("denim") || value.includes("스트릿")) return "moodStreet";
  if (value.includes("date") || value.includes("데이트")) return "moodDate";
  if (value.includes("office") || value.includes("오피스")) return "moodOffice";
  if (value.includes("luxury") || value.includes("chic") || value.includes("럭셔리") || value.includes("시크")) return "moodLuxury";
  if (value.includes("cozy") || value.includes("코지")) return "moodCozy";
  if (value.includes("clean") || value.includes("클린")) return "moodClean";
  return fallback;
}

function levelFromXp(xp = 0) {
  if (xp >= 1000) return 4 + Math.floor((xp - 1000) / 500);
  if (xp >= 500) return 3;
  if (xp >= 250) return 2;
  if (xp >= 100) return 1;
  return 1;
}

function titleForLevel(level = 1) {
  if (level >= 9) return "런웨이 디렉터";
  if (level >= 7) return "스타일 고수";
  if (level >= 5) return "컬러 마스터";
  if (level >= 4) return "트렌드 마스터";
  if (level >= 3) return "옷장 큐레이터";
  if (level >= 2) return "패션 탐험가";
  return "패션 입문자";
}

function normalizeGame(game = {}) {
  const xp = Number(game.xp ?? 420);
  const coins = Number(game.coins ?? 86);
  const level = Number(game.level) || levelFromXp(xp);
  return {
    xp,
    coins,
    level,
    petLevel: Number(game.petLevel) || level,
    streak: Number(game.streak) || 1,
    completedMissions: Array.isArray(game.completedMissions) ? game.completedMissions : [],
    ownedShopItems: Array.isArray(game.ownedShopItems) ? game.ownedShopItems : [],
  };
}

function buildWardrobeAnalytics(wardrobe = []) {
  const source = Array.isArray(wardrobe) ? wardrobe : [];
  const active = source.filter((item) => !item.archived);
  const colorCounts = countBy(active, "color");
  const categoryCounts = countBy(active, "category");
  return {
    total: active.length,
    unused30: active.filter((_, index) => index % 3 === 0).length,
    unused60: active.filter((_, index) => index % 5 === 0).length,
    mostWorn: active.slice(0, 3).map((item) => item.name).join(", ") || "없음",
    leastWorn: active.slice(-3).map((item) => item.name).join(", ") || "없음",
    favoriteColor: Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "cream",
    favoriteCategory: Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "tops",
    valueEstimate: `${Math.max(1, active.length * 4)}만원`,
  };
}

function countBy(items, key) {
  const source = Array.isArray(items) ? items : [];
  return source.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function buildAchievements({ game, wardrobe, savedLooks }) {
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const level = game.level || levelFromXp(game.xp);
  return [
    { name: "패션 입문자", unlocked: game.xp >= 100 },
    { name: "옷장 정리러", unlocked: safeWardrobe.length >= 5 },
    { name: "패션 탐험가", unlocked: level >= 2 },
    { name: "옷장 큐레이터", unlocked: level >= 3 },
    { name: "트렌드 마스터", unlocked: level >= 4 },
    { name: "컬러 마스터", unlocked: level >= 5 },
    { name: "날씨 스타일러", unlocked: safeSavedLooks.length >= 2 },
    { name: "스타일 고수", unlocked: level >= 7 },
    { name: "100룩 크리에이터", unlocked: safeSavedLooks.length >= 100 },
  ];
}

function loadStoredState() {
  return pruneClientState(safeJsonParse(localStorage.getItem(storageKey), {}));
}

function normalizeBodyProfile(profile = {}) {
  const bodyTypeMap = { balanced: "regular", upper: "athletic", lower: "curvy", softCurve: "curvy" };
  const hairStyleMap = { bob: "medium", wave: "wavy" };
  const bodyType = bodyTypeMap[profile.bodyType] || profile.bodyType || "regular";
  const shoulderWidth = Number(profile.shoulderWidth ?? profile.shoulder) || (bodyType === "athletic" ? 50 : bodyType === "slim" ? 36 : 42);
  const waistWidth = Number(profile.waistWidth ?? profile.waist) || (bodyType === "curvy" ? 31 : bodyType === "slim" ? 24 : 28);
  const hipWidth = Number(profile.hipWidth) || (bodyType === "curvy" ? 52 : bodyType === "slim" ? 36 : 42);
  const armLength = Number(profile.armLength) || 90;
  const headSize = Number(profile.headSize) || 100;
  const neckLength = Number(profile.neckLength) || 96;
  const metric = (key, fallback = 0) => Number(profile[key] ?? fallback);
  return {
    gender: profile.gender || "neutral",
    bodyType,
    height: Number(profile.height) || 165,
    shoulder: shoulderWidth,
    waist: waistWidth,
    shoulderWidth,
    waistWidth,
    hipWidth,
    armLength,
    headSize,
    neckLength,
    headWidth: metric("headWidth"),
    headHeight: metric("headHeight"),
    jawSize: metric("jawSize"),
    jawWidth: metric("jawWidth"),
    faceLength: metric("faceLength"),
    neckWidth: metric("neckWidth"),
    clavicleWidth: metric("clavicleWidth"),
    chestVolume: metric("chestVolume"),
    chestPosition: metric("chestPosition"),
    waistHeight: metric("waistHeight"),
    abdomenVolume: metric("abdomenVolume"),
    backThickness: metric("backThickness"),
    upperArmWidth: metric("upperArmWidth"),
    lowerArmWidth: metric("lowerArmWidth"),
    handSize: metric("handSize"),
    fingerLength: metric("fingerLength"),
    hipVolume: metric("hipVolume"),
    thighWidth: metric("thighWidth"),
    calfWidth: metric("calfWidth"),
    kneeHeight: metric("kneeHeight"),
    footSize: metric("footSize"),
    weightMass: metric("weightMass"),
    muscleMass: metric("muscleMass"),
    bodyFat: metric("bodyFat"),
    torsoLength: Number(profile.torsoLength) || 54,
    legLength: Number(profile.legLength) || 92,
    legRatio: Number(profile.legRatio) || 52,
    skinTone: profile.skinTone || "medium",
    faceShape: profile.faceShape || "round",
    hairStyle: hairStyleMap[profile.hairStyle] || profile.hairStyle || "none",
    hairColor: profile.hairColor || "brown",
    eyeStyle: profile.eyeStyle || "soft",
    eyeSize: metric("eyeSize"),
    eyeSpacing: metric("eyeSpacing"),
    eyeHeight: metric("eyeHeight"),
    noseSize: metric("noseSize"),
    mouthWidth: metric("mouthWidth"),
    mouthHeight: metric("mouthHeight"),
    pose: profile.pose || "standing",
    expression: profile.expression || "happy",
    faceDetail: profile.faceDetail || "detailed",
  };
}

function bodyPreset(type) {
  const presets = {
    slim: { bodyType: "slim", height: 170, headSize: 96, neckLength: 98, shoulderWidth: 36, waistWidth: 24, hipWidth: 36, armLength: 88, legLength: 102, torsoLength: 52, legRatio: 55 },
    regular: { bodyType: "regular", height: 165, headSize: 100, neckLength: 96, shoulderWidth: 42, waistWidth: 28, hipWidth: 42, armLength: 90, legLength: 94, torsoLength: 54, legRatio: 52 },
    curvy: { bodyType: "curvy", height: 164, headSize: 103, neckLength: 94, shoulderWidth: 42, waistWidth: 31, hipWidth: 52, armLength: 90, legLength: 94, torsoLength: 54, legRatio: 51 },
    athletic: { bodyType: "athletic", height: 172, headSize: 98, neckLength: 98, shoulderWidth: 50, waistWidth: 29, hipWidth: 42, armLength: 94, legLength: 98, torsoLength: 55, legRatio: 53, muscleMass: 28, chestVolume: 12, thighWidth: 12 },
    model: { bodyType: "model", height: 180, headSize: 94, neckLength: 102, shoulderWidth: 40, waistWidth: 24, hipWidth: 38, armLength: 98, legLength: 112, torsoLength: 52, legRatio: 58, weightMass: -18 },
    zepeto: { bodyType: "zepeto", height: 168, headSize: 104, neckLength: 94, shoulderWidth: 39, waistWidth: 25, hipWidth: 42, armLength: 88, legLength: 96, torsoLength: 52, legRatio: 54, bodyFat: -6 },
  };
  return normalizeBodyProfile(presets[type] || presets.regular);
}

function readImageFile(file) {
  if (!(file instanceof File) || !file.size) return Promise.resolve("");
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function avatarVariables(profile) {
  profile = normalizeBodyProfile(profile);
  const bodyType = profile.bodyType;
  const genderBoost = profile.gender === "male" ? 10 : profile.gender === "female" ? -2 : 0;
  const shoulderBoost = (bodyType === "athletic" ? 24 : bodyType === "slim" ? -12 : bodyType === "curvy" ? 6 : 0) + genderBoost;
  const hipBoost = bodyType === "curvy" ? 22 : bodyType === "slim" ? -10 : profile.gender === "male" ? -4 : 0;
  const heightScale = Math.min(1.13, Math.max(0.9, profile.height / 165));
  const torsoHeight = 150 + (profile.torsoLength - 54) * 2.2;
  const waistWidth = 92 + (profile.waist - 27) * 3.1;
  const legHeight = 104 + (profile.legRatio - 50) * 1.5 + (profile.legLength - 92) * 1.25;
  const skinMap = {
    bright: "#f0b789",
    medium: "#d98b5d",
    deep: "#8f5942",
    cool: "#d8a3a0",
    warm: "#df9361",
  };
  const hairMap = {
    black: "#2f2927",
    brown: "#6d4b3f",
    blonde: "#c9a06b",
    ash: "#83756f",
  };
  return {
    "--avatar-scale": heightScale,
    "--avatar-shoulder": `${126 + shoulderBoost + (profile.shoulder - 42) * 2}px`,
    "--avatar-waist": `${Math.min(140, Math.max(82, waistWidth))}px`,
    "--avatar-torso": `${Math.min(184, Math.max(132, torsoHeight))}px`,
    "--avatar-hip": `${130 + hipBoost + (profile.waist - 27) * 1.2}px`,
    "--avatar-leg": `${Math.min(136, Math.max(96, legHeight))}px`,
    "--avatar-skin": skinMap[profile.skinTone] || skinMap.medium,
    "--avatar-hair": hairMap[profile.hairColor] || hairMap.brown,
  };
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "알 수 없는 화면 오류",
    };
  }

  componentDidCatch(error, info) {
    console.error("[MoodFit 화면 오류]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-shell app-shell--fallback">
        <section className="soft-card fallback-card">
          <p className="eyebrow">MOODFIT SAFE MODE</p>
          <h1>화면을 다시 정리하고 있어요</h1>
          <p>
            일시적인 화면 오류가 감지됐어요. 새로고침하면 저장된 옷장과 캐릭터 정보는 유지된 상태로 다시 열립니다.
          </p>
          <button className="primary" type="button" onClick={() => window.location.reload()}>
            다시 열기
          </button>
          <small>{this.state.message}</small>
        </section>
      </main>
    );
  }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

createRoot(document.getElementById("root")).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

