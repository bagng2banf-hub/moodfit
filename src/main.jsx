import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Camera,
  Check,
  ChevronRight,
  Coins,
  Gift,
  Globe2,
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
import { canRequestAi, sanitizeInput } from "./lib/security";
import { categories, defaultFit, moods, seedWardrobe, themes } from "./lib/data";
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
  { id: "pose-walk", name: "런웨이 포즈", type: "pose", value: "walking", price: 45, copy: "살짝 걷는 듯한 자연스러운 포즈" },
  { id: "pose-bag", name: "쇼핑백 포즈", type: "pose", value: "bag", price: 55, copy: "외출룩이 더 살아나는 포즈" },
  { id: "hair-wavy", name: "웨이브 헤어", type: "hairStyle", value: "wavy", price: 35, copy: "부드러운 패션 일러스트 헤어" },
  { id: "hair-ash", name: "애쉬 헤어 컬러", type: "hairColor", value: "ash", price: 30, copy: "차분한 애쉬 브라운 톤" },
  { id: "face-confident", name: "자신감 표정", type: "expression", value: "confident", price: 25, copy: "오늘 코디가 더 멋져 보이는 표정" },
];
const fashionLabelMap = {
  tops: "상의",
  bottoms: "하의",
  outerwear: "아우터",
  shoes: "신발",
  bags: "가방",
  accessories: "액세서리",
  other: "기타",
  "Basic T-Shirt": "기본 티셔츠",
  "Oversized T-Shirt": "오버핏 티셔츠",
  "Slim Fit T-Shirt": "슬림핏 티셔츠",
  "Graphic T-Shirt": "그래픽 티셔츠",
  "Long Sleeve T-Shirt": "긴팔 티셔츠",
  "Oxford Shirt": "옥스포드 셔츠",
  "Dress Shirt": "드레스 셔츠",
  "Short Sleeve Shirt": "반팔 셔츠",
  "Denim Shirt": "데님 셔츠",
  "Linen Shirt": "린넨 셔츠",
  "Pullover Hoodie": "후드티",
  "Zip-Up Hoodie": "집업 후드",
  "Oversized Hoodie": "오버핏 후드",
  Crewneck: "맨투맨",
  "Oversized Crewneck": "오버핏 맨투맨",
  "Knit Sweater": "니트",
  Turtleneck: "터틀넥",
  "Cable Knit": "케이블 니트",
  "Skinny Jeans": "스키니 진",
  "Straight Jeans": "일자 청바지",
  "Wide Jeans": "와이드 진",
  "Baggy Jeans": "배기 진",
  Slacks: "슬랙스",
  Chinos: "치노 팬츠",
  "Cargo Pants": "카고 팬츠",
  Joggers: "조거 팬츠",
  "Denim Shorts": "데님 반바지",
  "Athletic Shorts": "운동 반바지",
  "Casual Shorts": "캐주얼 반바지",
  "Mini Skirt": "미니 스커트",
  "Midi Skirt": "미디 스커트",
  "Long Skirt": "롱 스커트",
  "Denim Jacket": "데님 재킷",
  "Leather Jacket": "가죽 재킷",
  Bomber: "봄버 재킷",
  Harrington: "해링턴 재킷",
  "Trench Coat": "트렌치코트",
  "Long Coat": "롱코트",
  "Wool Coat": "울 코트",
  "Short Padding": "숏패딩",
  "Long Padding": "롱패딩",
  "Short Cardigan": "숏 가디건",
  "Long Cardigan": "롱 가디건",
  Sneakers: "스니커즈",
  Loafers: "로퍼",
  Boots: "부츠",
  Slingback: "슬링백",
  Sandals: "샌들",
  "Shoulder Bag": "숄더백",
  "Tote Bag": "토트백",
  Backpack: "백팩",
  "Mini Bag": "미니백",
  Glasses: "안경",
  Scarf: "스카프",
  Necklace: "목걸이",
  Hat: "모자",
  "Fashion Item": "패션 아이템",
  Cotton: "코튼",
  Linen: "린넨",
  Denim: "데님",
  Wool: "울",
  Cashmere: "캐시미어",
  Polyester: "폴리에스터",
  Nylon: "나일론",
  Leather: "가죽",
  Corduroy: "코듀로이",
  Fleece: "플리스",
  Silk: "실크",
  "Slim Fit": "슬림핏",
  "Regular Fit": "레귤러핏",
  "Relaxed Fit": "릴랙스핏",
  Oversized: "오버핏",
  "Wide Fit": "와이드핏",
  "Baggy Fit": "배기핏",
  "Cropped Fit": "크롭핏",
  Solid: "무지",
  Stripe: "스트라이프",
  Check: "체크",
  Plaid: "플래드",
  Floral: "플라워",
  Graphic: "그래픽",
  "Round Neck": "라운드넥",
  "V Neck": "브이넥",
  Collar: "카라",
  "Short Sleeve": "반팔",
  "Long Sleeve": "긴팔",
  Sleeveless: "민소매",
  Raglan: "래글런",
  "Inner Layer": "이너",
  "Middle Layer": "미들 레이어",
  "Outer Layer": "아우터 레이어",
};

function App() {
  const stored = loadStoredState();
  const [language, setLanguage] = useState(stored.language || null);
  const [session, setSession] = useState(loadSession());
  const [entryStep, setEntryStep] = useState("auth");
  const [activePanel, setActivePanel] = useState("v3-home");
  const [theme, setTheme] = useState(stored.theme || "white");
  const [mood, setMood] = useState(stored.mood || "moodLuxury");
  const [wardrobe, setWardrobe] = useState(stored.wardrobe || seedWardrobe);
  const [fit, setFit] = useState(stored.fit || defaultFit(stored.wardrobe || seedWardrobe));
  const [savedLooks, setSavedLooks] = useState(stored.savedLooks || []);
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

  useEffect(() => {
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, [activePanel]);

  function persist(next = {}) {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
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
      })
    );
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
    const username = sanitizeInput(form.get("username")) || "moodfit";
    const password = String(form.get("password") || "");
    if (username.length < 3) return showToast("아이디는 3글자 이상 입력해줘");
    if (password && password.length < 8) return showToast(t("invalidPassword"));
    const nextSession = await signInWithEmail({ email: `${username}@moodfit.local`, username });
    setSession(nextSession);
    setEntryStep("app");
    showToast(t("mockSession"));
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

  function openComingSoon(feature = "더 똑똑한 기능") {
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
      showToast("이미 오늘 보상을 받았을개");
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
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      localStorage.setItem(storageKey, JSON.stringify({ ...saved, game: next }));
      return next;
    });
    showToast(`${reason} +${xp} XP · +${coins} 코인`);
  }

  function buyShopItem(item) {
    const safe = normalizeGame(game);
    if (safe.ownedShopItems.includes(item.id)) return showToast("이미 갖고 있는 아이템일개");
    if (safe.coins < item.price) return showToast(`${item.price - safe.coins}코인이 더 필요할개`);
    const nextGame = { ...safe, coins: safe.coins - item.price, ownedShopItems: [...safe.ownedShopItems, item.id] };
    const nextProfile = { ...bodyProfile, [item.type]: item.value };
    setGame(nextGame);
    setBodyProfile(nextProfile);
    persist({ game: nextGame, bodyProfile: nextProfile });
    showToast(`${item.name} 장착했을개 · -${item.price} 코인`);
  }

  function changeProfileName(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextName = sanitizeInput(form.get("profileName"));
    if (!nextName) return showToast("바꿀 이름을 입력해줘");
    if (game.coins < 20) return showToast("이름 변경에는 20코인이 필요해");
    const nextGame = { ...game, coins: game.coins - 20 };
    setGame(nextGame);
    setProfileName(nextName);
    persist({ game: nextGame, profileName: nextName });
    showToast("이름 바꿨을개 · -20 코인");
  }

  async function changeProfilePhoto(event) {
    const file = event.target.files?.[0];
    const image = await readImageFile(file);
    event.target.value = "";
    if (!image) return showToast("프로필 사진을 다시 골라줘");
    setProfilePhoto(image);
    persist({ profilePhoto: image });
    showToast("프로필 사진 바꿨을개");
  }

  function generateStyling() {
    if (!canRequestAi(lastRequestAt)) return showToast(t("rateReady"));
    const cleanBrief = sanitizeInput(brief);
    setBrief(cleanBrief);
    setLastRequestAt(Date.now());
    const nextMood = detectMood(cleanBrief, mood);
    const nextFit = { ...fit };
    for (const category of ["tops", "outerwear", "bottoms", "shoes", "bags", "accessories"]) {
      const match = wardrobe.find((item) => item.category === category && item.mood === nextMood);
      if (match) nextFit[category] = match;
    }
    setMood(nextMood);
    setFit(nextFit);
    persist({ mood: nextMood, fit: nextFit, brief: cleanBrief });
    award(t("generate"), 30, 8);
    openComingSoon("고급 AI 코디 추천");
  }

  function wear(item) {
    if (item.archived) return showToast("보관된 옷은 복원 후 입을 수 있어요");
    const nextFit = { ...fit, [item.category]: item };
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
    const category = categories[wardrobe.length % categories.length];
    const selectedCategory = form.get("category") || category;
    const subcategory = sanitizeInput(form.get("subcategory")) || inferSubcategory(selectedCategory, form.get("clothingType"));
    const fabric = sanitizeInput(form.get("fabric")) || inferFabric(subcategory, form.get("pattern"));
    const fitType = form.get("fitType") || "Regular Fit";
    const primaryColor = sanitizeInput(form.get("primaryColor")) || sanitizeInput(form.get("color")) || ["#eadcc7", "#101010", "#46627d", "#f5f1e9", "#8c5a38"][wardrobe.length % 5];
    const item = {
      id: crypto.randomUUID(),
      name: sanitizeInput(form.get("name")) || `${t("scannedItem")} ${wardrobe.length + 1}`,
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
    const nextWardrobe = [item, ...wardrobe];
    setWardrobe(nextWardrobe);
    wear(item);
    persist({ wardrobe: nextWardrobe });
    setComposerOpen(false);
    award(t("addItem"), 45, 12);
  }

  function saveLook() {
    const look = { id: crypto.randomUUID(), mood, fit, recommendation, createdAt: new Date().toISOString() };
    const nextLooks = [look, ...savedLooks].slice(0, 8);
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
    const nextWardrobe = wardrobe.map((item) => item.id === itemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
    const nextFit = Object.fromEntries(Object.entries(fit).map(([slot, item]) => [slot, item?.id === itemId ? { ...item, ...patch } : item]));
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
    const nextWardrobe = wardrobe.filter((item) => item.id !== pendingDelete.id);
    const nextFit = Object.fromEntries(Object.entries(fit).map(([slot, item]) => [slot, item?.id === pendingDelete.id ? null : item]));
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

  return (
    <main className={`app moodfit-game theme-${theme} mood-${mood} panel-${activePanel} view-${viewMode}`}>
      <div className="ambient" aria-hidden="true" />
      <input ref={fileInputRef} className="hidden-input" type="file" accept="image/*" onChange={scanPhoto} />
      <header className="topbar">
        <button className="brand sketch-home-button" onClick={() => setActivePanel("v3-home")} type="button">
          <span className="brand-mark">🐾</span>
          <span><strong>골라줄개</strong><small>당신의 무드를 정해줄개</small></span>
        </button>
        <nav className="nav main-tabs" aria-label="Main">
          <button className={activePanel === "v3-character" ? "active" : ""} onClick={() => setActivePanel("v3-character")} type="button"><UserRound size={16} />캐릭터</button>
          <button className={activePanel === "v3-closet" ? "active" : ""} onClick={() => setActivePanel("v3-closet")} type="button"><Shirt size={16} />옷장</button>
          <button className={activePanel === "v3-style" ? "active" : ""} onClick={() => setActivePanel("v3-style")} type="button"><Sparkles size={16} />스타일</button>
          <button className={activePanel === "v3-photo" ? "active" : ""} onClick={() => setActivePanel("v3-photo")} type="button"><Camera size={16} />사진</button>
          <button className={activePanel === "v3-ranking" ? "active" : ""} onClick={() => setActivePanel("v3-ranking")} type="button"><Trophy size={16} />랭킹</button>
          <button className={activePanel === "v3-shop" ? "active" : ""} onClick={() => setActivePanel("v3-shop")} type="button"><Gift size={16} />상점</button>
          <button className={activePanel === "v3-map" ? "active" : ""} onClick={() => setActivePanel("v3-map")} type="button"><Trees size={16} />마을지도</button>
        </nav>
        <div className="header-actions">
          <div className="view-switch" aria-label="화면 버전 선택">
            <button className={viewMode === "desktop" ? "active" : ""} onClick={() => changeViewMode("desktop")} type="button">PC</button>
            <button className={viewMode === "mobile" ? "active" : ""} onClick={() => changeViewMode("mobile")} type="button">모바일</button>
          </div>
          <button className="status-pill" onClick={() => setActivePanel("v3-profile")} type="button"><UserRound size={15} />프로필</button>
          <button className="settings-bubble" onClick={() => setActivePanel("settings")} type="button" aria-label="설정"><Settings size={24} /><span>설정</span></button>
        </div>
      </header>

      {activeWorld && (
        <WorldView
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          t={t}
          mood={mood}
          setMood={setMood}
          fit={fit}
          bodyProfile={bodyProfile}
          setBodyProfile={setBodyProfile}
          persist={persist}
          wardrobe={wardrobe}
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
          savedLooks={savedLooks}
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
          {avatarWardrobeOpen && <AvatarWardrobe t={t} fit={fit} wardrobe={wardrobe} wear={wear} />}
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

      {!activeWorld && showAll && <GameLayer t={t} game={game} wardrobe={wardrobe} savedLooks={savedLooks} />}
      {!activeWorld && showAll && <FeatureShowcase t={t} />}
      {!activeWorld && showAll && <RealLifeExamples t={t} />}

      {!activeWorld && (activePanel === "wardrobe" || showAll) && <section id="wardrobe" className="wardrobe glass panel-view">
        <div className="section-head">
          <div><p className="eyebrow">{t("wardrobeTitle")}</p><h2>{t("wardrobeLead")}</h2></div>
          <button className="icon-button" onClick={addItem} type="button"><Shirt size={18} />{t("addItem")}</button>
        </div>
        <div className="wardrobe-grid">
          {wardrobe.length ? wardrobe.map((item) => (
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
        {savedLooks.length ? savedLooks.map((look) => (
          <button className="saved-look glass" key={look.id} onClick={() => { setFit(look.fit); setMood(look.mood); showToast(t("loaded")); }} type="button">
            <MiniFit fit={look.fit} />
            <strong>{look.recommendation.name}</strong>
            <span>{t(look.mood)}</span>
          </button>
        )) : <div className="saved-look glass empty">{t("emptyLooks")}</div>}
      </section>}

      {!activeWorld && activePanel === "customize" && <CustomizePanel t={t} theme={theme} setTheme={setTheme} mood={mood} setMood={setMood} fit={fit} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />}

      {!activeWorld && activePanel === "photo" && <PhotoTryOnPage t={t} onUpload={() => fileInputRef.current?.click()} wardrobe={wardrobe} />}

      {!activeWorld && activePanel === "ranking" && <RankingBoard t={t} game={game} scores={scores} wardrobe={wardrobe} savedLooks={savedLooks} />}

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
            <button onClick={() => setLanguage("ko")} type="button"><Globe2 />{t("korean")}</button>
            <button onClick={() => setLanguage("en")} type="button"><Globe2 />{t("english")}</button>
          </div>
        </div>
        <form className="auth-form" onSubmit={onAccount}>
          <p className="eyebrow">MOODFIT START</p>
          <h2>골라줄개 시작하기</h2>
          <label><span>아이디</span><input name="username" type="text" autoComplete="username" placeholder="moodfit_id" /></label>
          <label><span>{t("password")}</span><input name="password" type="password" autoComplete="current-password" /></label>
          <button className="primary start-button" type="submit"><Sparkles size={16} />시작할개</button>
          <button className="secondary" type="submit">회원가입</button>
          <button className="text-button" type="button">{t("resetPassword")}</button>
          <button className="guest-button" onClick={onGuest} type="button">{t("guestMode")}</button>
          <p className="notice">{t("secureNotice")}</p>
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
    "v3-profile": <ProfilePage {...props} />,
    "v3-mission": <MissionPage {...props} />,
    "v3-ranking": <HallOfFame {...props} />,
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
  const banner = mainBannerOptions.find((item) => item.id === homeBanner) || mainBannerOptions[0];
  const missions = [
    ["색 조합 저장하기", "보상 30 XP"],
    ["안 입은 옷 코디하기", "보상 12 코인"],
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
        <WorldCard className="home-outfit-card" icon={<Sparkles size={20} />} title="오늘의 스타일 추천" note="오늘 뭐 입을지 3초 안에 볼 수 있게">
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
                {Object.values(fit).filter(Boolean).slice(0, 5).map((item) => <i key={item.id} style={{ "--swatch": item.color }} />)}
              </div>
            </div>
          </div>
        </WorldCard>
        <WorldCard className="home-medium-card" icon={<Sun size={20} />} title="날씨 추천" note="날씨에 맞춰 가볍게">
          <div className="metric-row"><MetricPill label="날씨" value={weather} /><MetricPill label="습도" value="62%" /><MetricPill label="UV" value="보통" /></div>
          <p className="tiny-copy">비 오는데 흰 운동화는 위험할개!</p>
        </WorldCard>
        <WorldCard className="home-medium-card" icon={<Shirt size={20} />} title="옷장 요약" note="오늘 활용할 아이템">
          <div className="mini-closet-row">
            {wardrobe.slice(0, 4).map((item) => <span key={item.id} style={{ "--fabric": item.color }}>{item.name}</span>)}
          </div>
          <p className="tiny-copy">저장한 룩 {savedLooks.length}개, 옷장 아이템 {wardrobe.length}개</p>
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
          <div className="level-card-v3"><strong>패션 Lv.{Math.max(1, game.petLevel + 9)}</strong><span style={{ "--xp": `${Math.min(100, (game.xp % 1000) / 10)}%` }} /><p>{game.xp} XP · {game.coins} 코인</p></div>
        </WorldCard>
      </div>
    </section>
  );
}

function CharacterRoom({ t, mood, setMood, fit, bodyProfile, setBodyProfile, persist }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const updateProfile = (patch) => {
    const next = { ...bodyProfile, ...patch };
    setBodyProfile(next);
    persist({ bodyProfile: next });
  };

  return (
    <section className="world-room room-split character-room-v3">
      <RoomHeader eyebrow="캐릭터" title="아바타 스튜디오" comment="사람 형태의 패션 모델을 취향대로 만드는 공간" />
      <div className="avatar-dressing-stage avatar-studio-stage" style={{ "--studio-zoom": zoom / 100, "--studio-rotate": `${rotation}deg` }}>
        <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />
        <div className="studio-stage-actions">
          <button type="button" onClick={() => setRotation((value) => value - 8)}>왼쪽</button>
          <button type="button" onClick={() => setRotation(0)}>정면</button>
          <button type="button" onClick={() => setRotation((value) => value + 8)}>오른쪽</button>
        </div>
      </div>
      <div className="room-panel-v3">
        <h3>아바타 커스터마이징</h3>
        <div className="avatar-studio-tools">
          <Segment label="성별" items={[["female", "여성"], ["male", "남성"], ["neutral", "뉴트럴"]]} value={bodyProfile.gender} onChange={(value) => updateProfile({ gender: value })} />
          <Segment label="체형" items={[["slim", "슬림"], ["regular", "레귤러"], ["curvy", "커브"], ["athletic", "애슬레틱"]]} value={bodyProfile.bodyType} onChange={(value) => updateProfile({ bodyType: value })} />
          <Segment label="포즈" items={[["standing", "스탠딩"], ["walking", "워킹"], ["mirror", "거울"], ["bag", "쇼핑백"], ["sitting", "시팅"]]} value={bodyProfile.pose} onChange={(value) => updateProfile({ pose: value })} />
          <Segment label="표정" items={[["happy", "해피"], ["confident", "자신감"], ["calm", "차분"], ["excited", "반짝"], ["cute", "러블리"]]} value={bodyProfile.expression} onChange={(value) => updateProfile({ expression: value })} />
          <Segment label="헤어" items={[["short", "숏"], ["medium", "미디엄"], ["long", "롱"], ["wavy", "웨이브"], ["straight", "스트레이트"], ["ponytail", "포니테일"], ["bangs", "앞머리"]]} value={bodyProfile.hairStyle} onChange={(value) => updateProfile({ hairStyle: value })} />
          <Segment label="헤어 컬러" items={[["black", "블랙"], ["brown", "브라운"], ["blonde", "블론드"], ["ash", "애쉬"]]} value={bodyProfile.hairColor} onChange={(value) => updateProfile({ hairColor: value })} />
          <Segment label="얼굴" items={[["round", "라운드"], ["softSquare", "소프트"], ["heart", "하트"], ["oval", "오벌"]]} value={bodyProfile.faceShape} onChange={(value) => updateProfile({ faceShape: value })} />
          <Segment label="눈" items={[["dot", "도트"], ["smile", "스마일"], ["calm", "차분"], ["star", "반짝"]]} value={bodyProfile.eyeStyle} onChange={(value) => updateProfile({ eyeStyle: value })} />
          <RangeControl label="줌" min="86" max="118" value={zoom} onChange={(value) => setZoom(Number(value))} />
        </div>
        <div className="mood-row-v3">
          {moods.map((key) => <button key={key} className={mood === key ? "active" : ""} onClick={() => setMood(key)} type="button">{t(key)}</button>)}
        </div>
        <div className="world-actions">
          <button className="world-secondary" type="button">즐겨입는 룩 저장</button>
          <button className="world-secondary" type="button">스냅샷 찍기</button>
          <button className="world-primary" type="button">비교 모드</button>
        </div>
      </div>
    </section>
  );
}

function MagicCloset({ t, wardrobe, wear, addItem, onEditItem, onArchiveItem, onRestoreItem, onDeleteItem }) {
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
  const activeItems = wardrobe.filter((item) => !item.archived);
  const archivedItems = wardrobe.filter((item) => item.archived);
  const visibleItems = [...activeItems, ...archivedItems].filter((item) => item.category === closetCategory);
  const analytics = buildWardrobeAnalytics(wardrobe);

  return (
    <section className="world-room magic-closet-v3">
      <RoomHeader eyebrow="옷장" title="마법 옷장" comment="수집한 옷과 태그가 먼저 보이는 옷장룸" />
      <div className="wardrobe-analytics-v3">
        <MetricPill label="전체 옷" value={`${analytics.total}개`} />
        <MetricPill label="자주 입는 색" value={analytics.favoriteColor} />
        <MetricPill label="대표 카테고리" value={fashionText(analytics.favoriteCategory)} />
        <MetricPill label="예상 가치" value={analytics.valueEstimate} />
        <MetricPill label="30일 미착용" value={`${analytics.unused30}개`} />
        <MetricPill label="보관함" value={`${archivedItems.length}개`} />
      </div>
      <div className="storybook-closet">
        <aside className="closet-tabs-v3">
          {closetTabs.map(([value, label]) => <button className={closetCategory === value ? "active" : ""} key={value} onClick={() => setClosetCategory(value)} type="button">{label}</button>)}
          <button className="world-primary" onClick={addItem} type="button"><Upload size={16} />옷 등록할개</button>
        </aside>
        <div className="collectible-grid">
          {visibleItems.length ? visibleItems.map((item) => (
            <article className={`collectible-card ${item.archived ? "is-archived" : ""}`} key={item.id}>
              <button className="collectible-wear" onClick={() => wear(item)} type="button" disabled={item.archived}>
              {item.image ? <img src={item.image} alt="" /> : <span className={`fabric pattern-${item.pattern || "plain"}`} style={{ "--fabric": item.color }} />}
              <strong>{item.name}</strong>
              <p>{t(item.category)} · {fashionText(item.subcategory || item.clothingType)} · {fashionText(item.pattern || "Solid")}</p>
              <div><em>{fashionText(item.fitType || "Regular Fit")}</em><em>{fashionText(item.fabric || "Cotton")}</em></div>
              </button>
              <div className="wardrobe-actions-v3">
                <button onClick={() => onEditItem(item)} type="button">편집</button>
                {item.archived
                  ? <button onClick={() => onRestoreItem(item.id)} type="button">복원</button>
                  : <button onClick={() => onArchiveItem(item.id)} type="button">보관</button>}
                <button className="danger" onClick={() => onDeleteItem(item)} type="button">삭제</button>
              </div>
            </article>
          )) : <div className="closet-empty-state"><Shirt size={26} /><strong>{fashionText(closetCategory)} 아이템이 아직 없어요</strong><p>이 카테고리에 맞는 옷을 등록해줘.</p><button className="world-primary" onClick={addItem} type="button">옷 등록할개</button></div>}
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
      <RoomHeader eyebrow="스타일" title="스타일 스튜디오" comment="날씨와 무드, 옷장 데이터를 합쳐 추천하는 공간" />
      <div className="studio-layout-v3">
        <div className="studio-control-book">
          <div className="style-mode-grid-v3">
            {styleModes.map(([label, nextSchedule, ko]) => <button key={label} onClick={() => { setSchedule(nextSchedule); setEventType(label.toLowerCase()); }} type="button">{ko}</button>)}
          </div>
          <label><span>오늘 기분</span><textarea value={brief} placeholder="예: 비 오는 날 카페 데이트, 차분하지만 예쁘게" onChange={(event) => setBrief(event.target.value)} /></label>
          <div className="control-grid-v3">
            <label><span>날씨</span><input value={weather} onChange={(event) => setWeather(event.target.value)} /></label>
            <label><span>일정</span><input value={schedule} onChange={(event) => setSchedule(event.target.value)} /></label>
            <label><span>상황</span><input value={eventType} onChange={(event) => setEventType(event.target.value)} /></label>
            <label><span>무드</span><input value={aesthetic} onChange={(event) => setAesthetic(event.target.value)} /></label>
          </div>
          <div className="mood-row-v3">
            {moods.map((key) => <button key={key} className={mood === key ? "active" : ""} onClick={() => setMood(key)} type="button">{t(key)}</button>)}
          </div>
          <div className="world-actions">
            <button className="world-primary" onClick={generateStyling} type="button"><Sparkles size={18} />AI 코디 만들개</button>
            <button className="world-secondary" onClick={saveLook} type="button"><Save size={18} />룩 저장할개</button>
            <button className="world-secondary" onClick={() => onComingSoon("실시간 트렌드 API")} type="button"><Search size={18} />트렌드 불러오기</button>
            <button className="world-secondary" onClick={() => onComingSoon("날씨 API 자동 연동")} type="button"><Sun size={18} />날씨 자동 동기화</button>
          </div>
        </div>
        <div className="avatar-runway-v3">
          <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />
          <AssistantNote tone="small" text="이 조합은 꽤 센스 있을개!" />
        </div>
        <StyleResultCard title="오늘의 스타일 결과" recommendation={recommendation} scores={scores} />
      </div>
    </section>
  );
}

function FashionLab({ onUpload, wardrobe, onComingSoon }) {
  const latest = wardrobe[0];
  return (
    <section className="world-room fashion-lab-v3">
      <RoomHeader eyebrow="사진" title="패션 분석실" comment="업로드한 사진과 분석 결과가 중심인 실험실" />
      <div className="photo-lab-grid-v3">
        <button className="upload-polaroid" onClick={() => onComingSoon("AI 사진 분석")} type="button">
          <Camera size={34} />
          <strong>사진 올릴개</strong>
          <span>컬러 · 핏 · 패턴 · 바이브 분석</span>
        </button>
        <div className="analysis-board">
          <MetricPill label="color" value={latest?.color || "cream"} />
          <MetricPill label="fit" value={latest?.fitType || "regular"} />
          <MetricPill label="pattern" value={latest?.pattern || "plain"} />
          <MetricPill label="style" value={latest?.vibe || "soft casual"} />
          <p>사진을 올리면 전/후 스타일 제안이 여기 뜰개.</p>
        </div>
        <div className="magazine-strip">
          <span className="fashion-ref ref-one" />
          <span className="fashion-ref ref-two" />
          <span className="fashion-ref ref-three" />
        </div>
      </div>
    </section>
  );
}

function ProfilePage({ t, game, fit, mood, bodyProfile, wardrobe, savedLooks, profileName, profilePhoto, onRenameProfile, onProfilePhoto }) {
  const level = game.level || levelFromXp(game.xp);
  const achievements = buildAchievements({ game, wardrobe, savedLooks });
  const rank = titleForLevel(level);

  return (
    <section className="world-room profile-page-v3">
      <RoomHeader eyebrow="프로필" title="프로필" comment="내 스타일 성장과 보상을 한눈에 보는 공간" />
      <div className="profile-layout-v3">
        <div className="profile-template-card-v3">
          <label className="profile-id-photo-v3">
            <input type="file" accept="image/*" onChange={onProfilePhoto} />
            {profilePhoto ? <img src={profilePhoto} alt="프로필 사진" /> : <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />}
            <span>사진 변경</span>
          </label>
          <div className="profile-template-copy-v3">
            <span>프로필 카드</span>
            <strong>{profileName || "무드핏 스타일러"}</strong>
            <p>{rank} · 패션 Lv.{level} · {game.streak || 1}일 연속</p>
            <form className="profile-rename-v3" onSubmit={onRenameProfile}>
              <input name="profileName" placeholder="새 이름" maxLength="18" />
              <button className="secondary" type="submit"><Coins size={15} />20코인 변경</button>
            </form>
          </div>
        </div>
        <div className="profile-stats-v3">
          <MetricPill label="코인" value={`${game.coins}개`} />
          <MetricPill label="XP" value={`${game.xp} XP`} />
          <MetricPill label="패션 랭크" value={rank} />
          <MetricPill label="선호 스타일" value={t(mood)} />
        </div>
        <div className="achievement-grid-v3">
          {achievements.map((item) => <span className={item.unlocked ? "unlocked" : ""} key={item.name}><Medal size={16} />{item.name}</span>)}
        </div>
      </div>
    </section>
  );
}

function MissionPage({ award, game }) {
  const missions = [
    ["upload-item", "옷 1개 등록", 35, 8],
    ["create-outfit", "코디 1개 만들기", 30, 6],
    ["score-90", "90점 이상 받기", 45, 10],
    ["three-day", "3일 연속 열기", 60, 14],
    ["weather-outfit", "날씨 코디 만들기", 40, 9],
  ];
  const streakMilestones = [1, 3, 7, 14, 30];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="world-room mission-page-v3">
      <RoomHeader eyebrow="미션" title="데일리 미션" comment="매일 열고 싶은 성장 루프를 만드는 공간" />
      <div className="mission-layout-v3">
        <div className="daily-mission-grid-v3">
          {missions.map(([id, title, xp, coins]) => (
            <button className={game.completedMissions?.includes(`${today}:${id}`) ? "completed" : ""} key={id} onClick={() => award(title, xp, coins, id)} type="button">
              <Check size={17} />
              <strong>{title}</strong>
              <span>{game.completedMissions?.includes(`${today}:${id}`) ? "완료" : `+${xp} XP · +${coins} 코인`}</span>
            </button>
          ))}
        </div>
        <aside className="streak-panel-v3">
          <strong>연속 접속 보상</strong>
          <p>현재 {game.streak || 1}일 · 오래 열수록 보상이 커져요.</p>
          <div>{streakMilestones.map((day) => <span className={(game.streak || 1) >= day ? "active" : ""} key={day}>{day}일</span>)}</div>
        </aside>
      </div>
    </section>
  );
}

function CoinShop({ game, buyShopItem }) {
  return (
    <section className="world-room shop-page-v3">
      <RoomHeader eyebrow="상점" title="코인 상점" comment="모은 코인으로 아바타 포즈, 헤어, 표정을 해금하는 공간" />
      <div className="shop-balance-card">
        <div>
          <span>보유 코인</span>
          <strong>{game.coins}개</strong>
        </div>
        <p>미션을 완료하고 코인을 모아 아바타 아이템을 살 수 있을개.</p>
      </div>
      <div className="shop-grid-v3">
        {shopItems.map((item) => {
          const owned = game.ownedShopItems?.includes(item.id);
          return (
            <article className={owned ? "owned" : ""} key={item.id}>
              <div className={`shop-item-preview preview-${item.type}`}><Sparkles size={22} /></div>
              <strong>{item.name}</strong>
              <p>{item.copy}</p>
              <button className="world-primary" onClick={() => buyShopItem(item)} type="button">
                {owned ? "보유중" : `${item.price} 코인`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HallOfFame({ game, scores, wardrobe, savedLooks }) {
  const ranks = [
    ["스타일 마스터", scores.total + 4],
    ["컬러 천재", scores.color],
    ["비 오는 날 스타일리스트", scores.comfort],
    ["미니멀 지니어스", Math.max(86, wardrobe.length + savedLooks.length + 78)],
  ];

  return (
    <section className="world-room hall-v3">
      <RoomHeader eyebrow="랭킹" title="패션 명예의 전당" comment="랭킹, 배지, 챌린지 성장을 한눈에 보는 공간" />
      <div className="hall-layout-v3">
        <div className="trophy-shelf">
          {ranks.map(([name, score], index) => <article key={name}><b>{index + 1}</b><strong>{name}</strong><span>{score}점</span></article>)}
        </div>
        <div className="badge-wall-v3">
          {["패션 탐험가", "컬러 마스터", "비 오는 날 스타일러", "미니멀 천재", "옷장 수집가", "스카프 친구"].map((badge, index) => (
            <span className={index < Math.min(5, game.petLevel) ? "earned" : ""} key={badge}>{badge}</span>
          ))}
        </div>
        <AssistantNote tone="small decorative" text="이번 주도 멋지게 올라갈개!" />
      </div>
    </section>
  );
}

function MoodVillageMap({ setActivePanel, session, game, onEvent, onComingSoon }) {
  const places = [
    ["이벤트 광장", "축제와 보상이 열릴개", "v3-home", <Gift size={22} />],
    ["날씨 센터", "습도 UV 바람까지 볼개", "v3-style", <Sun size={22} />],
    ["스타일 도감", "저장한 룩을 모아둘개", "v3-closet", <Shirt size={22} />],
    ["미션 보드", "매일 조금씩 성장할개", "v3-home", <Check size={22} />],
    ["골라줄개 하우스", "마스코트 아이템 꾸밀개", "v3-character", <UserRound size={22} />],
    ["패션 캘린더", "약속별 코디를 준비할개", "v3-style", <Trees size={22} />],
  ];

  return (
    <section className="world-room village-map-v3">
      <RoomHeader eyebrow="지도" title="무드 마을 지도" comment="어디로 갈지 골라줄개!" />
      <div className="map-grid-v3">
        {places.map(([title, copy, panel, icon], index) => (
          <button key={title} className={`map-place place-${index}`} onClick={() => title === "이벤트 광장" ? onEvent() : title === "날씨 센터" ? onComingSoon("실시간 날씨 API") : setActivePanel(panel)} type="button">
            {icon}<strong>{title}</strong><span>{copy}</span>
          </button>
        ))}
      </div>
      <aside className="user-passport-v3">
        <strong>{session?.mode === "guest" ? "게스트 스타일러" : "MoodFit 스타일러"}</strong>
        <p>패션 Lv.{Math.max(1, game.petLevel + 9)} · {game.coins} 코인</p>
        <AssistantNote tone="brand" text="네 취향 기록은 소중히 지켜줄개!" />
      </aside>
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

function MetricPill({ label, value }) {
  return <span className="metric-pill-v3"><small>{label}</small><b>{value}</b></span>;
}

function ItemEditor({ item, onClose, onSave }) {
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave(item.id, {
      name: sanitizeInput(form.get("name")) || item.name,
      category: sanitizeInput(form.get("category")) || item.category,
      subcategory: sanitizeInput(form.get("subcategory")) || item.subcategory,
      fitType: sanitizeInput(form.get("fitType")) || item.fitType,
      fabric: sanitizeInput(form.get("fabric")) || item.fabric,
      season: sanitizeInput(form.get("season")) || item.season,
      vibe: sanitizeInput(form.get("vibe")) || item.vibe,
      pattern: sanitizeInput(form.get("pattern")) || item.pattern,
      neckType: sanitizeInput(form.get("neckType")) || item.neckType,
      sleeveType: sanitizeInput(form.get("sleeveType")) || item.sleeveType,
      primaryColor: sanitizeInput(form.get("primaryColor")) || item.primaryColor,
      secondaryColor: sanitizeInput(form.get("secondaryColor")) || item.secondaryColor,
      accentColor: sanitizeInput(form.get("accentColor")) || item.accentColor,
      color: sanitizeInput(form.get("primaryColor")) || item.color,
      styleCategory: sanitizeInput(form.get("styleCategory")) || item.styleCategory,
    });
    onClose();
  }
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="옷 편집">
      <form className="item-editor-modal" onSubmit={submit}>
        <button className="close-button" onClick={onClose} type="button"><X size={18} /></button>
        <h3>옷 정보 편집</h3>
        <label><span>이름</span><input name="name" defaultValue={item.name} /></label>
        <label><span>카테고리</span><select name="category" defaultValue={item.category}>{fashionCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>세부 종류</span><select name="subcategory" defaultValue={item.subcategory || item.clothingType}>{Object.values(subcategoryOptions).flat().map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
        <label><span>핏</span><select name="fitType" defaultValue={item.fitType || "Regular Fit"}>{fitOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
        <label><span>소재</span><select name="fabric" defaultValue={item.fabric || "Cotton"}>{fabricOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
        <label><span>시즌</span><input name="season" defaultValue={item.season} /></label>
        <label><span>무드</span><input name="vibe" defaultValue={item.vibe} /></label>
        <label><span>패턴</span><select name="pattern" defaultValue={item.pattern || "Solid"}>{patternOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
        <label><span>목 형태</span><select name="neckType" defaultValue={item.neckType || inferNeckType(item.subcategory)}>{neckOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
        <label><span>소매</span><select name="sleeveType" defaultValue={item.sleeveType || inferSleeveType(item.subcategory)}>{sleeveOptions.map((value) => <option key={value} value={value}>{fashionText(value)}</option>)}</select></label>
        <label><span>메인 색상</span><input name="primaryColor" type="color" defaultValue={item.primaryColor || item.color || "#eadcc7"} /></label>
        <label><span>보조 색상</span><input name="secondaryColor" type="color" defaultValue={item.secondaryColor || "#ddebf3"} /></label>
        <label><span>포인트 색상</span><input name="accentColor" type="color" defaultValue={item.accentColor || "#f7d9d9"} /></label>
        <label><span>스타일</span><input name="styleCategory" defaultValue={item.styleCategory} /></label>
        <button className="primary" type="submit">저장</button>
      </form>
    </div>
  );
}

function ConfirmModal({ title, copy, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <section className="confirm-modal-v3">
        <h3>{title}</h3>
        <p>{copy}</p>
        <div>
          <button className="secondary" onClick={onCancel} type="button">취소</button>
          <button className="primary danger-primary" onClick={onConfirm} type="button">삭제</button>
        </div>
      </section>
    </div>
  );
}

function SketchHome({ setActivePanel, recommendation, scores, game, mood, t, onEvent }) {
  return (
    <section className="sketch-home image-map-home panel-view" aria-label="골라줄개 홈">
      <img className="sketch-reference" src={assetPath("main-banner-closet.png")} alt="골라줄개 메인 화면" />
      <button className="map-hotspot map-event" onClick={onEvent} type="button" aria-label="이벤트 열개" />
    </section>
  );
}

function GollaJulGaeMascot() {
  return <span className="golla-mascot" aria-label="골라줄개" />;
}

function FeatureCard({ title, copy, icon, onClick }) {
  return (
    <button className="feature-card-soft" onClick={onClick} type="button">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{copy}</p>
    </button>
  );
}

function EventCard({ title, label, copy, onClick }) {
  return (
    <button className="event-card-soft" onClick={onClick} type="button">
      <span>♥ {title}</span>
      <strong>{label}</strong>
      <p>{copy}</p>
    </button>
  );
}

function EventPopup({ onClose }) {
  return (
    <div className="event-pop-backdrop" role="dialog" aria-modal="true" aria-label="이벤트">
      <section className="event-pop-card">
        <div className="event-pop-copy">
          <span>♥ 이벤트</span>
          <strong>구름 출석 열개</strong>
          <p>오늘 코디 저장하면 핑크 스카프 조각 줄개</p>
          <div className="event-pop-actions">
            <button className="primary" type="button" onClick={onClose}>받을개</button>
            <button className="secondary" type="button" onClick={onClose}>닫을개</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StyleResultCard({ title, recommendation, scores, onClick }) {
  return (
    <button className="style-result-soft" onClick={onClick} type="button">
      <span>{title}</span>
      <strong>{recommendation.name}</strong>
      <p>{recommendation.explanation}</p>
      <em>{scores.total}점 · 색 {scores.color} · 편안함 {scores.comfort}</em>
    </button>
  );
}

function ComingSoonModal({ feature, title, subtitle, onClose, onExplore }) {
  return (
    <div className="coming-soon-backdrop" role="dialog" aria-modal="true" aria-label="준비중 안내" onMouseDown={onClose}>
      <section className="coming-soon-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="coming-soon-mascot" aria-hidden="true">
          <span className="dog-ear left" />
          <span className="dog-ear right" />
          <span className="dog-face">
            <i />
          </span>
        </div>
        <p className="eyebrow">{feature}</p>
        <h2>{title}</h2>
        <strong>{subtitle}</strong>
        <p>현재 이 기능은 개발 중이에요. 조금만 기다려주시면 더 좋은 추천을 해드릴게요!</p>
        <div className="coming-soon-preview">
          <span>미리보기</span>
          <b>기본 추천은 지금 바로 사용할 수 있어요.</b>
          <small>AI 추천 기능은 준비중입니다</small>
        </div>
        <div className="coming-soon-actions">
          <button className="secondary" onClick={onClose} type="button">확인</button>
          <button className="primary" onClick={onExplore} type="button">다른 기능 보러가기</button>
          <button className="text-button" onClick={onClose} type="button">베타 알림 받기</button>
        </div>
      </section>
    </div>
  );
}

function PhotoTryOnPage({ t, onUpload, wardrobe, onComingSoon }) {
  const sample = wardrobe[0];
  return (
    <section className="soft-page photo-page panel-view">
      <div className="soft-page-copy">
        <p className="eyebrow">photo try-on</p>
        <h2>사진을 넣으면 옷 타입, 색, 패턴, 분위기를 읽어줘요.</h2>
        <p>업로드한 옷 사진을 바탕으로 비슷한 옷장 아이템과 더 잘 어울리는 스타일을 제안해요.</p>
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
  const ranking = [
    ["오늘의 무드 장인", scores.total, "선글라스"],
    ["컬러 조합 천재", scores.color, "핑크 스카프"],
    ["옷장 수집가", wardrobe.length * 12, "구름 코인"],
    ["룩북 스타", savedLooks.length * 25 + 40, "XP"],
  ].sort((a, b) => b[1] - a[1]);
  return (
    <section className="soft-page ranking-page panel-view">
      <div className="soft-page-copy">
        <p className="eyebrow">ranking & challenge</p>
        <h2>스타일 점수, 주간 챌린지, 뱃지를 모으는 공간이에요.</h2>
        <p>코디를 저장하고 옷장을 채울수록 골라줄개 아이템과 코인이 쌓여요.</p>
      </div>
      <div className="ranking-list">
        {ranking.map(([name, score, reward], index) => (
          <article key={name}>
            <strong>{index + 1}</strong>
            <span>{name}</span>
            <em>{score}점</em>
            <small>{reward}</small>
          </article>
        ))}
      </div>
      <div className="reward-card">
        <Gift size={26} />
        <strong>오늘 보상</strong>
        <p>{game.coins} 코인 · {game.xp} XP · 골라줄개 스카프 조각</p>
      </div>
    </section>
  );
}

function CustomizePanel({ t, theme, setTheme, mood, setMood, fit, bodyProfile, setBodyProfile, persist }) {
  return (
    <section className="customize-panel glass panel-view">
      <div className="custom-copy">
        <p className="eyebrow">{t("customTitle")}</p>
        <h2>{t("customLead")}</h2>
        <div className="cloud-buddy" aria-label={t("cloudBuddy")}>
          <span>{t("cloudBuddy")}</span>
          <strong>{t("cloudBuddyLine")}</strong>
        </div>
        <Segment label={t("themeSetting")} items={themes.map((item) => [item, t(`theme${capitalize(item)}`)])} value={theme} onChange={setTheme} />
        <div className="mood-row custom-moods">
          {moods.map((key) => <button key={key} className={mood === key ? "active" : ""} onClick={() => setMood(key)} type="button">{t(key)}</button>)}
        </div>
      </div>
      <div className="custom-avatar">
        <FashionAvatar fit={fit} mood={mood} bodyProfile={bodyProfile} t={t} />
      </div>
      <div className="custom-fields">
        <ProfileFields t={t} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />
      </div>
    </section>
  );
}

function ProfileDock({ t, bodyProfile, setBodyProfile, persist }) {
  return (
    <section className="profile-dock glass">
      <div>
        <p className="eyebrow">{t("styleProfile")}</p>
        <strong>{t("styleProfileLead")}</strong>
      </div>
      <ProfileFields t={t} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />
    </section>
  );
}

function ProfileFields({ t, bodyProfile, setBodyProfile, persist, compact = false }) {
  const update = (patch) => {
    const next = { ...bodyProfile, ...patch };
    setBodyProfile(next);
    persist({ bodyProfile: next });
  };
  return (
    <div className={compact ? "profile-fields compact-profile" : "profile-fields"}>
      <Segment label={t("gender")} items={[
        ["neutral", t("neutral")],
        ["female", t("female")],
        ["male", t("male")],
        ["none", t("none")],
      ]} value={bodyProfile.gender} onChange={(value) => update({ gender: value })} />
      <Segment label={t("bodyType")} items={[
        ["slim", "슬림"],
        ["regular", "레귤러"],
        ["curvy", "커브"],
        ["athletic", "애슬레틱"],
      ]} value={bodyProfile.bodyType} onChange={(value) => update({ bodyType: value })} />
      <Segment label={t("skinTone")} items={[
        ["bright", t("bright")],
        ["medium", t("medium")],
        ["deep", t("deep")],
        ["cool", t("cool")],
        ["warm", t("warm")],
      ]} value={bodyProfile.skinTone} onChange={(value) => update({ skinTone: value })} />
      <Segment label="얼굴형" items={[
        ["round", "동글"],
        ["softSquare", "말랑각"],
        ["heart", "하트"],
        ["oval", "오벌"],
      ]} value={bodyProfile.faceShape} onChange={(value) => update({ faceShape: value })} />
      <Segment label="헤어" items={[
        ["short", "숏"],
        ["medium", "미디엄"],
        ["long", "롱"],
        ["wavy", "웨이브"],
        ["straight", "스트레이트"],
        ["ponytail", "포니테일"],
        ["bangs", "앞머리"],
      ]} value={bodyProfile.hairStyle} onChange={(value) => update({ hairStyle: value })} />
      <Segment label="눈" items={[
        ["dot", "동글눈"],
        ["smile", "웃는눈"],
        ["calm", "차분눈"],
        ["star", "반짝눈"],
      ]} value={bodyProfile.eyeStyle} onChange={(value) => update({ eyeStyle: value })} />
      <RangeControl label={t("height")} min="150" max="190" value={bodyProfile.height} onChange={(value) => update({ height: Number(value) })} />
      <RangeControl label={t("shoulder")} min="34" max="52" value={bodyProfile.shoulder} onChange={(value) => update({ shoulder: Number(value) })} />
      <RangeControl label={t("waist")} min="22" max="40" value={bodyProfile.waist} onChange={(value) => update({ waist: Number(value) })} />
      <RangeControl label={t("torsoLength")} min="46" max="64" value={bodyProfile.torsoLength} onChange={(value) => update({ torsoLength: Number(value) })} />
      <RangeControl label={t("legLength")} min="76" max="112" value={bodyProfile.legLength} onChange={(value) => update({ legLength: Number(value) })} />
      <RangeControl label={t("legRatio")} min="44" max="60" value={bodyProfile.legRatio} onChange={(value) => update({ legRatio: Number(value) })} />
    </div>
  );
}

function ItemComposer({ t, mood, onClose, onSubmit }) {
  const [category, setCategory] = useState("tops");
  const checklist = [
    ["clean", t("checklistClean")],
    ["fit", t("checklistFit")],
    ["layer", t("checklistLayer")],
    ["weather", t("checklistWeather")],
    ["favorite", t("checklistFavorite")],
  ];
  return (
    <div className="modal-backdrop">
      <form className="item-composer glass" onSubmit={onSubmit}>
        <div className="section-head">
          <div><p className="eyebrow">{t("addItem")}</p><h2>{t("checklist")}</h2></div>
          <button className="round-button" onClick={onClose} type="button" aria-label={t("cancel")}><X size={18} /></button>
        </div>
        <div className="composer-grid">
          <label><span>{t("itemName")}</span><input name="name" placeholder="예: 아이보리 니트, 블랙 블레이저" /></label>
          <label><span>카테고리</span><select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>{fashionCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>세부 종류</span><select name="subcategory">{(subcategoryOptions[category] || subcategoryOptions.other).map((item) => <option key={item} value={item}>{fashionText(item)}</option>)}</select></label>
          <label><span>시즌</span><input name="season" placeholder="봄 / 여름 / 가을 / 겨울" /></label>
          <label><span>메인 색상</span><input name="primaryColor" type="color" defaultValue="#eadcc7" /></label>
          <label><span>보조 색상</span><input name="secondaryColor" type="color" defaultValue="#ddebf3" /></label>
          <label><span>포인트 색상</span><input name="accentColor" type="color" defaultValue="#f7d9d9" /></label>
          <label><span>{t("vibe")}</span><input name="vibe" defaultValue={t(mood)} /></label>
          <label><span>{t("occasion")}</span><input name="occasion" placeholder="데일리, 데이트, 출근, 캠퍼스" /></label>
          <label className="wide-field"><span>{t("styleCategory")}</span><input name="styleCategory" placeholder="꾸안꾸, 미니멀, 스트릿, 포근한 무드" /></label>
          <label><span>소재</span><select name="fabric">{fabricOptions.map((item) => <option key={item} value={item}>{fashionText(item)}</option>)}</select></label>
          <label><span>패턴</span><select name="pattern">{patternOptions.map((item) => <option key={item} value={item}>{fashionText(item)}</option>)}</select></label>
          <label><span>목 형태</span><select name="neckType">{neckOptions.map((item) => <option key={item} value={item}>{fashionText(item)}</option>)}</select></label>
          <label><span>소매</span><select name="sleeveType">{sleeveOptions.map((item) => <option key={item} value={item}>{fashionText(item)}</option>)}</select></label>
          <label><span>레이어</span><select name="layerSlot"><option value="Inner Layer">이너</option><option value="Middle Layer">미들 레이어</option><option value="Outer Layer">아우터 레이어</option></select></label>
          <label className="photo-upload wide-field">
            <span><Camera size={18} />{t("upload")}</span>
            <input name="photo" type="file" accept="image/*" />
          </label>
        </div>
        <div className="option-block">
          <strong>{t("fitType")}</strong>
          <div className="icon-options">
            {fitOptions.map((key) => (
              <label key={key}>
                <input name="fitType" type="radio" value={key} defaultChecked={key === "Regular Fit"} />
                <span><Shirt size={16} />{fashionText(key)}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="checklist-grid">
          {checklist.map(([key, label]) => (
            <label className="check-card" key={key}>
              <input name={key} type="checkbox" />
              <span><Check size={16} />{label}</span>
            </label>
          ))}
        </div>
        <div className="action-row compact">
          <button className="secondary" onClick={onClose} type="button">{t("cancel")}</button>
          <button className="primary" type="submit"><Shirt size={17} />{t("saveItem")}</button>
        </div>
      </form>
    </div>
  );
}

function FashionAvatar({ fit, mood, bodyProfile, t }) {
  const svgId = useId().replace(/:/g, "");
  const profile = normalizeBodyProfile(bodyProfile);
  const avatarVars = avatarVariables(profile);
  const skin = avatarVars["--avatar-skin"];
  const hair = avatarVars["--avatar-hair"];
  const top = fit.tops || {};
  const outer = fit.outerwear || {};
  const bottom = fit.bottoms || {};
  const shoes = fit.shoes || {};
  const bag = fit.bags || {};
  const accessory = fit.accessories || {};
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
  const leftLeg = pose === "walking" ? "rotate(-5 112 300)" : "";
  const rightLeg = pose === "walking" ? "rotate(6 158 300)" : "";
  const leftArm = pose === "mirror" ? "rotate(-18 96 172)" : "";
  const rightArm = pose === "bag" ? "rotate(-16 174 172)" : "";
  const expressionClass = `avatar-expression-${profile.expression || "happy"}`;
  const title = [top.name, outer.name, bottom.name, shoes.name].filter(Boolean).join(" · ") || "MoodFit avatar";
  const bodyShape = {
    slim: { shoulder: 36, waist: 50, hip: 62, arm: 19, leg: 24 },
    regular: { shoulder: 46, waist: 62, hip: 72, arm: 22, leg: 28 },
    curvy: { shoulder: 44, waist: 66, hip: 88, arm: 24, leg: 31 },
    athletic: { shoulder: 58, waist: 64, hip: 72, arm: 25, leg: 29 },
  }[profile.bodyType] || { shoulder: 46, waist: 62, hip: 72, arm: 22, leg: 28 };
  const genderShape = profile.gender === "male" ? 6 : profile.gender === "female" ? -2 : 0;
  const shoulder = bodyShape.shoulder + genderShape;
  const waist = bodyShape.waist + (profile.waist - 27) * 1.2;
  const hip = bodyShape.hip + (profile.waist - 27) * 1.1;
  const torsoTop = 136;
  const torsoBottom = 278;
  const leftShoulder = 135 - shoulder;
  const rightShoulder = 135 + shoulder;
  const leftWaist = 135 - waist / 2;
  const rightWaist = 135 + waist / 2;
  const leftHip = 135 - hip / 2;
  const rightHip = 135 + hip / 2;
  const facePath = {
    round: "M112 75 C119 55 152 48 170 63 C185 77 184 109 173 127 C160 147 125 148 111 128 C101 112 102 89 112 75Z",
    softSquare: "M112 75 C119 57 152 50 170 64 C184 75 184 109 175 128 C164 147 123 148 111 128 C102 110 102 89 112 75Z",
    heart: "M112 75 C121 54 153 49 171 65 C187 80 181 113 168 130 C154 148 128 148 113 130 C101 114 101 90 112 75Z",
    oval: "M113 72 C121 52 154 48 171 64 C188 81 183 116 169 134 C155 151 128 151 113 134 C99 116 101 88 113 72Z",
  }[profile.faceShape] || "M112 75 C119 55 152 48 170 63 C185 77 184 109 173 127 C160 147 125 148 111 128 C101 112 102 89 112 75Z";
  const eyes = {
    dot: <><circle cx="126" cy="101" r="3.2" fill="#4a403a" /><circle cx="158" cy="101" r="3.2" fill="#4a403a" /></>,
    smile: <><path d="M121 101 Q126 96 132 101" fill="none" stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /><path d="M153 101 Q158 96 164 101" fill="none" stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /></>,
    calm: <><path d="M121 101 H132" stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /><path d="M153 101 H164" stroke="#4a403a" strokeWidth="2.4" strokeLinecap="round" /></>,
    star: <><path d="M126 96 L128 100 L132 101 L128 103 L126 107 L124 103 L120 101 L124 100Z" fill="#4a403a" /><path d="M158 96 L160 100 L164 101 L160 103 L158 107 L156 103 L152 101 L156 100Z" fill="#4a403a" /></>,
  }[profile.eyeStyle] || <><circle cx="126" cy="101" r="3.2" fill="#4a403a" /><circle cx="158" cy="101" r="3.2" fill="#4a403a" /></>;
  const smilePath = {
    confident: "M132 119 Q144 123 156 116",
    calm: "M134 119 Q144 121 154 119",
    excited: "M132 116 Q144 131 158 116",
    cute: "M132 117 Q144 128 157 117",
    happy: "M132 117 Q144 128 157 117",
  }[profile.expression] || "M132 117 Q144 128 157 117";
  const torsoPath = `M${leftShoulder} 156 C${leftShoulder + 16} 142 122 137 136 137 C152 137 ${rightShoulder - 16} 142 ${rightShoulder} 156 L${rightWaist} ${torsoBottom} C151 288 120 288 ${leftWaist} ${torsoBottom}Z`;
  const outerPath = isCoat
    ? `M${leftShoulder - 14} 154 C101 137 116 138 136 151 C153 137 173 138 ${rightShoulder + 14} 154 L${rightHip + 26} 338 C170 350 105 350 ${leftHip - 26} 338Z`
    : `M${leftShoulder - 12} 158 C100 139 116 139 136 153 C154 139 174 139 ${rightShoulder + 12} 158 L${rightWaist + 18} 270 C169 286 102 286 ${leftWaist - 18} 270Z`;
  const pantsPath = isWide
    ? `M${leftHip} 276 H${rightHip} L${rightHip + 20} 374 C177 382 159 382 144 374 L136 304 L126 374 C111 382 92 382 ${leftHip - 20} 374Z`
    : `M${leftHip + 8} 276 H${rightHip - 8} L${rightHip + 4} 374 C162 381 149 381 137 374 L135 304 L130 374 C118 381 104 381 ${leftHip - 4} 374Z`;
  const skirtPath = `M${leftHip} 276 C120 287 151 287 ${rightHip} 276 L${rightHip + 20} 342 C158 356 112 356 ${leftHip - 20} 342Z`;

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
      <ellipse cx="135" cy="404" rx="92" ry="16" fill="rgba(74,64,58,.14)" />
      <g filter={`url(#${svgId}-shadow)`}>
        <path d="M107 101 C112 78 127 66 144 69 C166 72 180 91 174 118 L102 118 C101 112 102 106 107 101Z" fill={hair} />
        {(profile.hairStyle === "long" || profile.hairStyle === "wavy" || profile.hairStyle === "straight") && <path d="M92 105 C93 68 118 47 143 51 C176 56 190 90 184 151 C178 177 158 185 135 181 C111 185 91 170 92 105Z" fill={hair} opacity=".96" />}
        {profile.hairStyle === "ponytail" && <path d="M178 104 C207 118 205 170 182 193 C181 160 176 130 164 110Z" fill={hair} />}
        <path d={facePath} fill={`url(#${svgId}-skin)`} />
        <path d="M109 82 C125 58 158 55 176 79 C165 74 148 75 132 80 C122 84 115 87 109 82Z" fill={hair} />
        {profile.hairStyle === "bangs" && <path d="M111 80 C126 68 153 64 177 82 C156 84 139 92 120 101Z" fill={hair} />}
        <rect x="126" y="130" width="24" height="30" rx="10" fill={skin} />
        <g className="svg-face">
          {eyes}
          <path d="M142 104 Q139 111 143 112" fill="none" stroke="#9b6d5f" strokeWidth="2" strokeLinecap="round" />
          <path d={smilePath} fill="none" stroke="#8b5f54" strokeWidth="3" strokeLinecap="round" />
          {profile.expression === "cute" && <><circle cx="116" cy="113" r="5" fill="#f0a7a9" opacity=".55" /><circle cx="168" cy="113" r="5" fill="#f0a7a9" opacity=".55" /></>}
        </g>
        {isHoodie && <path d="M102 158 C106 133 128 125 148 131 C166 136 176 148 178 165 L160 178 C151 164 125 162 112 178Z" fill={topColor} opacity=".92" />}
        <path d={torsoPath} fill={topColor} stroke="#6d574f" strokeOpacity=".22" strokeWidth="2" />
        {isShirt && <path d="M118 151 L136 169 L154 151 M136 169 L136 273" fill="none" stroke="#ffffff" strokeOpacity=".78" strokeWidth="4" strokeLinecap="round" />}
        {top.pattern === "Stripe" && <g opacity=".55" stroke="#fff" strokeWidth="5"><path d="M99 184 H176" /><path d="M97 218 H178" /><path d="M97 252 H176" /></g>}
        {outerColor && <path d={outerPath} fill={outerColor} stroke="#6d574f" strokeOpacity=".22" strokeWidth="2" opacity=".9" />}
        <g transform={leftArm}><path d={`M${leftShoulder} 163 C${leftShoulder - 16} 188 ${leftShoulder - 20} 224 ${leftShoulder - 18} 268 C${leftShoulder - 17} 282 ${leftShoulder - 1} 283 ${leftShoulder + 4} 270 C${leftShoulder + 12} 236 ${leftShoulder + 17} 199 ${leftShoulder + 22} 170Z`} fill={topColor || skin} stroke="#6d574f" strokeOpacity=".18" strokeWidth="2" /></g>
        <g transform={rightArm}><path d={`M${rightShoulder} 163 C${rightShoulder + 18} 188 ${rightShoulder + 24} 224 ${rightShoulder + 21} 268 C${rightShoulder + 20} 282 ${rightShoulder + 4} 283 ${rightShoulder - 1} 270 C${rightShoulder - 9} 236 ${rightShoulder - 14} 199 ${rightShoulder - 21} 170Z`} fill={topColor || skin} stroke="#6d574f" strokeOpacity=".18" strokeWidth="2" /></g>
        {isSkirt
          ? <path d={skirtPath} fill={bottomColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />
          : <path d={pantsPath} fill={bottomColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />}
        <g transform={leftLeg}><path d="M104 340 C112 346 122 346 130 340 L128 387 C120 393 108 393 99 386Z" fill={skin} /></g>
        <g transform={rightLeg}><path d="M142 340 C150 346 160 346 168 340 L175 386 C166 393 154 393 146 387Z" fill={skin} /></g>
        <path d="M86 382 C105 376 122 378 133 391 C124 403 93 403 79 393Z" fill={shoeColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />
        <path d="M139 391 C151 378 169 376 188 382 L195 393 C181 403 150 403 139 391Z" fill={shoeColor} stroke="#6d574f" strokeOpacity=".2" strokeWidth="2" />
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
  return <span className="mini-fit">{["tops", "outerwear", "bottoms", "shoes"].map((key) => <i key={key} style={{ "--c": fit[key]?.color || "#ddd" }} />)}</span>;
}

function AvatarWardrobe({ t, fit, wardrobe, wear }) {
  const [selected, setSelected] = useState(wardrobe[0] || null);
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
            <span style={{ "--swatch": fit[slot]?.color || "#ddd" }} />
            <div>
              <small>{t(`part${capitalize(slot)}`) || t(slot)}</small>
              <strong>{fit[slot]?.name || t(slot)}</strong>
              <em>{fit[slot] ? `${t(fit[slot].fitType || "regularFit")} · ${fit[slot].season || "all"}` : t("emptyWardrobe")}</em>
            </div>
          </div>
        ))}
      </div>
      <div className="avatar-closet-list">
        {wardrobe.map((item) => (
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
  const items = Object.values(fit).filter(Boolean);
  const colorNames = items.map((item) => `${item.colorName || item.color || ""}`.toLowerCase());
  const hasOuter = Boolean(fit.outerwear);
  const hasShoes = Boolean(fit.shoes);
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
  const level = game.level || levelFromXp(game.xp);
  const progress = Math.min(100, (game.xp / Math.max(100, level * 250)) * 100);
  const missions = [
    ["missionBright", "Color", 30],
    ["missionMonochrome", "Tone", 40],
    ["missionUpload", "Closet", 45],
    ["missionOldItem", "Memory", 35],
  ];
  const badges = ["badgeMinimal", "badgeColor", "badgeRain", "badgeCampus"];
  const unlocked = Math.min(4, Math.max(1, Math.floor((wardrobe.length + savedLooks.length) / 2)));
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
  const palette = Object.values(fit).filter(Boolean).map((item) => item.color).slice(0, 5);
  const topCategory = wardrobe.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const strongestCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "tops";

  const cards = [
    {
      title: t("styleDnaTitle"),
      copy: t("styleDnaCopy"),
      stat: `${wardrobe.filter((item) => item.checklist?.favorite || item.source === "scanned").length + savedLooks.length} signals`,
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
      stat: `${savedLooks.length || 0} saved looks`,
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
  const pieces = [fit.tops, fit.outerwear, fit.bottoms, fit.shoes].filter(Boolean).map((item) => item.name);
  const pieceText = pieces.length ? pieces.join(", ") : t("wardrobeTitle");
  return {
    name: `${t(mood)} Atelier ${eventType || "Look"}`,
    explanation: t("recommendationSentence").replace("{schedule}", schedule || t("schedule")).replace("{pieces}", pieceText),
    colors: [fit.tops?.color, fit.outerwear?.color, fit.bottoms?.color].filter(Boolean).join(" · "),
    avoid: t("avoidSentence").replace("{weather}", weather || t("weather")),
    tips: `${t("tipSentence").replace("{aesthetic}", aesthetic || t("aesthetic"))}${brief ? ` ${sanitizeInput(brief)}` : ""}`,
  };
}

function detectMood(text, fallback) {
  const value = text.toLowerCase();
  if (value.includes("street") || value.includes("campus") || value.includes("denim") || value.includes("스트리트")) return "moodStreet";
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
  if (level >= 7) return "스타일 킹";
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
  const active = wardrobe.filter((item) => !item.archived);
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
    valueEstimate: `${Math.max(1, active.length * 4)}만 원`,
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function buildAchievements({ game, wardrobe, savedLooks }) {
  const level = game.level || levelFromXp(game.xp);
  return [
    { name: "패션 입문자", unlocked: game.xp >= 100 },
    { name: "옷장 정리러", unlocked: wardrobe.length >= 5 },
    { name: "패션 탐험가", unlocked: level >= 2 },
    { name: "옷장 큐레이터", unlocked: level >= 3 },
    { name: "트렌드 마스터", unlocked: level >= 4 },
    { name: "컬러 마스터", unlocked: level >= 5 },
    { name: "날씨 스타일러", unlocked: savedLooks.length >= 2 },
    { name: "스타일 킹", unlocked: level >= 7 },
    { name: "100룩 크리에이터", unlocked: savedLooks.length >= 100 },
  ];
}

function loadStoredState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function normalizeBodyProfile(profile = {}) {
  const bodyTypeMap = { balanced: "regular", upper: "athletic", lower: "curvy", softCurve: "curvy" };
  const hairStyleMap = { bob: "medium", wave: "wavy" };
  return {
    gender: profile.gender || "neutral",
    bodyType: bodyTypeMap[profile.bodyType] || profile.bodyType || "regular",
    height: Number(profile.height) || 165,
    shoulder: Number(profile.shoulder) || 42,
    waist: Number(profile.waist) || 27,
    torsoLength: Number(profile.torsoLength) || 54,
    legLength: Number(profile.legLength) || 92,
    legRatio: Number(profile.legRatio) || 52,
    skinTone: profile.skinTone || "medium",
    faceShape: profile.faceShape || "round",
    hairStyle: hairStyleMap[profile.hairStyle] || profile.hairStyle || "medium",
    hairColor: profile.hairColor || "brown",
    eyeStyle: profile.eyeStyle || "dot",
    pose: profile.pose || "standing",
    expression: profile.expression || "happy",
  };
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

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

createRoot(document.getElementById("root")).render(<App />);
