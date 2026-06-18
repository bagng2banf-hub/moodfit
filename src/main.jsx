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
  ["tops", "\uC0C1\uC758"],
  ["bottoms", "\uD558\uC758"],
  ["outerwear", "\uC544\uC6B0\uD130"],
  ["shoes", "\uC2E0\uBC1C"],
  ["bags", "\uAC00\uBC29"],
  ["accessories", "\uC561\uC138\uC11C\uB9AC"],
  ["other", "\uAE30\uD0C0"],
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
  { id: "dressing", label: "\uB4DC\uB808\uC2F1\uB8F8", src: assetPath("main-banner-dressing.png") },
  { id: "closet", label: "\uC637\uC7A5\uB8F8", src: assetPath("main-banner-closet.png") },
];
const shopItems = [
  { id: "pose-walk", name: "\uC6CC\uD0B9 \uD3EC\uC988", type: "pose", value: "walking", price: 45, copy: "\uC790\uC5F0\uC2A4\uB7FD\uAC8C \uAC77\uB294 \uD328\uC158 \uD3EC\uC988" },
  { id: "pose-bag", name: "\uC1FC\uD551\uBC31 \uD3EC\uC988", type: "pose", value: "bag", price: 55, copy: "\uC190\uC5D0 \uAC00\uBC29\uC744 \uB4E0 \uB8E9\uBD81 \uD3EC\uC988" },
  { id: "hair-wavy", name: "\uC6E8\uC774\uBE0C \uD5E4\uC5B4", type: "hairStyle", value: "wavy", price: 35, copy: "\uBD80\uB4DC\uB7EC\uC6B4 \uC2E4\uB8E8\uC5E3\uC758 \uD5E4\uC5B4" },
  { id: "hair-ash", name: "\uC560\uC26C \uD5E4\uC5B4 \uCEEC\uB7EC", type: "hairColor", value: "ash", price: 30, copy: "\uCC28\uBD84\uD55C \uC560\uC26C \uD1A4\uC758 \uBE0C\uB77C\uC6B4" },
  { id: "face-confident", name: "\uC790\uC2E0\uAC10 \uBB34\uB4DC", type: "expression", value: "confident", price: 25, copy: "\uC624\uB298 \uCF54\uB514\uAC00 \uB354 \uBA4B\uC838 \uBCF4\uC774\uB294 \uBB34\uB4DC" },
];
const fashionLabelMap = {
  tops: "\uC0C1\uC758", bottoms: "\uD558\uC758", outerwear: "\uC544\uC6B0\uD130", shoes: "\uC2E0\uBC1C", bags: "\uAC00\uBC29", accessories: "\uC561\uC138\uC11C\uB9AC", other: "\uAE30\uD0C0",
  "Basic T-Shirt": "\uAE30\uBCF8 \uD2F0\uC154\uCE20", "Oversized T-Shirt": "\uC624\uBC84\uD54F \uD2F0\uC154\uCE20", "Slim Fit T-Shirt": "\uC2AC\uB9BC\uD54F \uD2F0\uC154\uCE20", "Graphic T-Shirt": "\uADF8\uB798\uD53D \uD2F0\uC154\uCE20", "Long Sleeve T-Shirt": "\uAE34\uD314 \uD2F0\uC154\uCE20",
  "Oxford Shirt": "\uC625\uC2A4\uD3EC\uB4DC \uC154\uCE20", "Dress Shirt": "\uB4DC\uB808\uC2A4 \uC154\uCE20", "Short Sleeve Shirt": "\uBC18\uD314 \uC154\uCE20", "Denim Shirt": "\uB370\uB2D8 \uC154\uCE20", "Linen Shirt": "\uB9AC\uB128 \uC154\uCE20",
  "Pullover Hoodie": "\uD480\uC624\uBC84 \uD6C4\uB514", "Zip-Up Hoodie": "\uC9D1\uC5C5 \uD6C4\uB514", "Oversized Hoodie": "\uC624\uBC84\uD54F \uD6C4\uB514", Crewneck: "\uB9E8\uD22C\uB9E8", "Oversized Crewneck": "\uC624\uBC84\uD54F \uB9E8\uD22C\uB9E8",
  "Knit Sweater": "\uB2C8\uD2B8", Turtleneck: "\uD130\uD2C0\uB125", "Cable Knit": "\uCF00\uC774\uBE14 \uB2C8\uD2B8",
  "Skinny Jeans": "\uC2A4\uD0A4\uB2C8 \uC9C4", "Straight Jeans": "\uC2A4\uD2B8\uB808\uC774\uD2B8 \uC9C4", "Wide Jeans": "\uC640\uC774\uB4DC \uC9C4", "Baggy Jeans": "\uBC30\uAE30 \uC9C4",
  Slacks: "\uC2AC\uB799\uC2A4", Chinos: "\uCE58\uB178\uD32C\uCE20", "Cargo Pants": "\uCE74\uACE0\uD32C\uCE20", Joggers: "\uC870\uAC70\uD32C\uCE20", "Denim Shorts": "\uB370\uB2D8 \uC1FC\uCE20", "Athletic Shorts": "\uC2A4\uD3EC\uCE20 \uC1FC\uCE20", "Casual Shorts": "\uCE90\uC8FC\uC5BC \uC1FC\uCE20", "Mini Skirt": "\uBBF8\uB2C8 \uC2A4\uCEE4\uD2B8", "Midi Skirt": "\uBBF8\uB514 \uC2A4\uCEE4\uD2B8", "Long Skirt": "\uB871 \uC2A4\uCEE4\uD2B8",
  "Denim Jacket": "\uB370\uB2D8 \uC790\uCF13", "Leather Jacket": "\uB808\uB354 \uC790\uCF13", Bomber: "\uBD04\uBC84 \uC790\uCF13", Harrington: "\uD574\uB9C1\uD134 \uC790\uCF13", "Trench Coat": "\uD2B8\uB80C\uCE58\uCF54\uD2B8", "Long Coat": "\uB871\uCF54\uD2B8", "Wool Coat": "\uC6B8\uCF54\uD2B8", "Short Padding": "\uC20F\uD328\uB529", "Long Padding": "\uB871\uD328\uB529", "Short Cardigan": "\uC20F \uAC00\uB514\uAC74", "Long Cardigan": "\uB871 \uAC00\uB514\uAC74",
  Sneakers: "\uC6B4\uB3D9\uD654", Loafers: "\uB85C\uD37C", Boots: "\uBD80\uCE20", Slingback: "\uC2AC\uB9C1\uBC31", Sandals: "\uC0CC\uB4E4", "Shoulder Bag": "\uC204\uB354\uBC31", "Tote Bag": "\uD1A0\uD2B8\uBC31", Backpack: "\uBC31\uD329", "Mini Bag": "\uBBF8\uB2C8\uBC31", Glasses: "\uC548\uACBD", Scarf: "\uC2A4\uCE74\uD504", Necklace: "\uBAA9\uAC78\uC774", Hat: "\uBAA8\uC790", "Fashion Item": "\uD328\uC158 \uC544\uC774\uD15C",
  Cotton: "\uBA74", Linen: "\uB9AC\uB128", Denim: "\uB370\uB2D8", Wool: "\uC6B8", Cashmere: "\uCE90\uC2DC\uBBF8\uC5B4", Polyester: "\uD3F4\uB9AC\uC5D0\uC2A4\uD130", Nylon: "\uB098\uC77C\uB860", Leather: "\uB808\uB354", Corduroy: "\uCF54\uB4C0\uB85C\uC774", Fleece: "\uD50C\uB9AC\uC2A4", Silk: "\uC2E4\uD06C",
  "Slim Fit": "\uC2AC\uB9BC\uD54F", "Regular Fit": "\uC815\uD54F", "Relaxed Fit": "\uB9B4\uB799\uC2A4\uD54F", Oversized: "\uC624\uBC84\uD54F", "Wide Fit": "\uC640\uC774\uB4DC\uD54F", "Baggy Fit": "\uBC30\uAE30\uD54F", "Cropped Fit": "\uD06C\uB86D\uD54F",
  Solid: "\uBB34\uC9C0", Stripe: "\uC2A4\uD2B8\uB77C\uC774\uD504", Check: "\uCCB4\uD06C", Plaid: "\uD50C\uB798\uB4DC", Floral: "\uD50C\uB85C\uB7F4", Graphic: "\uADF8\uB798\uD53D", "Round Neck": "\uB77C\uC6B4\uB4DC\uB125", "V Neck": "V\uB125", Collar: "\uCE74\uB77C", "Short Sleeve": "\uBC18\uD314", "Long Sleeve": "\uAE34\uD314", Sleeveless: "\uBBFC\uC18C\uB9E4", Raglan: "\uB798\uAE00\uB7F0", "Inner Layer": "\uC774\uB108", "Middle Layer": "\uBBF8\uB4E4 \uB808\uC774\uC5B4", "Outer Layer": "\uC544\uC6B0\uD130 \uB808\uC774\uC5B4",
};

const styleSurveyOptions = {
  styles: ["\uBBF8\uB2C8\uBA40", "\uCE90\uC8FC\uC5BC", "\uC2A4\uD2B8\uB9BF", "\uC2DC\uD2F0\uBCF4\uC774", "\uC2DC\uD2F0\uAC78", "\uC544\uBA54\uCE74\uC9C0", "\uD074\uB798\uC2DD", "\uB304\uB514", "\uBE44\uC988\uB2C8\uC2A4 \uCE90\uC8FC\uC5BC", "\uACE0\uD504\uCF54\uC5B4", "Y2K", "\uBE48\uD2F0\uC9C0", "\uD799\uD569", "\uC2A4\uD3EC\uCE20\uC6E8\uC5B4", "\uD398\uBBF8\uB2CC", "\uB7EC\uBE14\uB9AC", "\uBAA8\uB358", "\uC62C\uB4DC\uBA38\uB2C8", "\uB188\uCF54\uC5B4", "\uD14C\uD06C\uC6E8\uC5B4"],
  fits: ["\uC624\uBC84\uD54F", "\uC815\uD54F", "\uC2AC\uB9BC\uD54F", "\uC640\uC774\uB4DC\uD54F", "\uD06C\uB86D\uD54F", "\uB871\uD54F"],
  colors: ["\uD654\uC774\uD2B8", "\uBE14\uB799", "\uADF8\uB808\uC774", "\uBCA0\uC774\uC9C0", "\uBE0C\uB77C\uC6B4", "\uCE74\uD0A4", "\uB124\uC774\uBE44", "\uBE14\uB8E8", "\uB808\uB4DC", "\uD551\uD06C", "\uD37C\uD50C", "\uADF8\uB9B0", "\uC610\uB85C\uC6B0"],
  genders: [["male", "\uB0A8\uC131"], ["female", "\uC5EC\uC131"], ["neutral", "\uC911\uC131"], ["private", "\uC120\uD0DD \uC548 \uD568"]],
  bodyTypes: [["slim", "\uB9C8\uB978\uD615"], ["balanced", "\uBCF4\uD1B5\uD615"], ["athletic", "\uADFC\uC721\uD615"], ["curvy", "\uD1B5\uD1B5\uD615"], ["custom", "\uC9C1\uC811 \uCEE4\uC2A4\uD140"]],
  personalColors: ["\uBAA8\uB984", "\uBD04 \uC6DC\uD1A4", "\uC5EC\uB984 \uCFE8\uD1A4", "\uAC00\uC744 \uC6DC\uD1A4", "\uACA8\uC6B8 \uCFE8\uD1A4"],
};

function App() {
  const stored = loadStoredState();
  const initialSession = loadSession();
  const initialStyleProfile = normalizeStyleProfile(stored.styleProfile);
  const [language, setLanguage] = useState(stored.language || null);
  const [session, setSession] = useState(initialSession);
  const [entryStep, setEntryStep] = useState(initialSession ? (initialStyleProfile.completed || initialStyleProfile.skipped ? "app" : "survey") : "auth");
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
  const [styleProfile, setStyleProfile] = useState(initialStyleProfile);
  const fileInputRef = useRef(null);
  const t = useMemo(() => createTranslator(language || "ko"), [language]);
  const recommendation = useMemo(
    () => buildRecommendation({ t, mood, fit, brief, weather, schedule, eventType, aesthetic, styleProfile }),
    [t, mood, fit, brief, weather, schedule, eventType, aesthetic, styleProfile]
  );
  const scores = useMemo(() => scoreOutfit({ fit, weather, mood, eventType, styleProfile }), [fit, weather, mood, eventType, styleProfile]);
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
        styleProfile,
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
    setEntryStep(styleProfile.completed || styleProfile.skipped ? "app" : "survey");
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
      setEntryStep(styleProfile.completed || styleProfile.skipped ? "app" : "survey");
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

  function finishStyleSurvey(nextProfile) {
    const normalized = normalizeStyleProfile({ ...nextProfile, completed: true, skipped: false });
    const nextBody = normalizeBodyProfile({
      ...bodyProfile,
      gender: normalized.gender === "private" ? bodyProfile.gender : normalized.gender,
      bodyType: normalized.bodyType === "custom" ? bodyProfile.bodyType : normalized.bodyType,
    });
    setStyleProfile(normalized);
    setBodyProfile(nextBody);
    setAesthetic(normalized.summary || aesthetic);
    persist({ styleProfile: normalized, bodyProfile: nextBody, aesthetic: normalized.summary || aesthetic });
    setEntryStep("app");
    showToast("취향 분석을 저장했개!");
  }

  function skipStyleSurvey() {
    const skipped = normalizeStyleProfile({ ...styleProfile, skipped: true, completed: false });
    setStyleProfile(skipped);
    persist({ styleProfile: skipped });
    setEntryStep("app");
  }

  function openComingSoon(feature = "\uC900\uBE44\uC911\uC778 \uAE30\uB2A5") {
    setComingSoon({
      feature,
      title: "\uC900\uBE44\uC911\uC785\uB2C8\uB2E4",
      subtitle: "\uB354 \uB611\uB611\uD55C \uAE30\uB2A5\uC73C\uB85C \uACE7 \uB3CC\uC544\uC62C\uAC8C\uC694",
    });
  }

  function award(reason, xp = 25, coins = 6, rewardKey = "") {
    const today = new Date().toISOString().slice(0, 10);
    const completedKey = rewardKey ? `${today}:${rewardKey}` : "";
    if (completedKey && game.completedMissions?.includes(completedKey)) {
      showToast("\uC774\uBBF8 \uC624\uB298 \uBCF4\uC0C1\uC744 \uBC1B\uC558\uC5B4\uC694");
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
    showToast(`${reason} +${xp} XP / +${coins} \uCF54\uC778`);
  }

  function buyShopItem(item) {
    const safe = normalizeGame(game);
    if (safe.ownedShopItems.includes(item.id)) return showToast("\uC774\uBBF8 \uAC16\uACE0 \uC788\uB294 \uC544\uC774\uD15C\uC774\uC5D0\uC694");
    if (safe.coins < item.price) return showToast(`${item.price - safe.coins}\uCF54\uC778\uC774 \uB354 \uD544\uC694\uD574\uC694`);
    const nextGame = { ...safe, coins: safe.coins - item.price, ownedShopItems: [...safe.ownedShopItems, item.id] };
    const nextProfile = { ...bodyProfile, [item.type]: item.value };
    setGame(nextGame);
    setBodyProfile(nextProfile);
    persist({ game: nextGame, bodyProfile: nextProfile });
    showToast(`${item.name}\uC744(\uB97C) \uC0C0\uC5B4\uC694 / -${item.price} \uCF54\uC778`);
  }

  function changeProfileName(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextName = sanitizeInput(form.get("profileName"));
    if (!nextName) return showToast("\uBC14\uAFC0 \uC774\uB984\uC744 \uC785\uB825\uD574\uC918");
    if (game.coins < 20) return showToast("\uC774\uB984 \uBCC0\uACBD\uC5D0\uB294 20\uCF54\uC778\uC774 \uD544\uC694\uD574\uC694");
    const nextGame = { ...game, coins: game.coins - 20 };
    setGame(nextGame);
    setProfileName(nextName);
    persist({ game: nextGame, profileName: nextName });
    showToast("\uC774\uB984\uC744 \uBC14\uAFC8\uC5C8\uC5B4\uC694 / -20 \uCF54\uC778");
  }

  async function changeProfilePhoto(event) {
    const file = event.target.files?.[0];
    const image = await readImageFile(file);
    event.target.value = "";
    if (!image) return showToast("\uD504\uB85C\uD544 \uC0AC\uC9C4\uC744 \uB2E4\uC2DC \uACE8\uB77C\uC918");
    setProfilePhoto(image);
    persist({ profilePhoto: image });
    showToast("\uD504\uB85C\uD544 \uC0AC\uC9C4\uC744 \uBC14\uAFC8\uC5C8\uC5B4\uC694");
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
    openComingSoon("\uACE0\uAE09 AI \uCF54\uB514 \uCD94\uCC9C");
  }

  function wear(item) {
    if (!item || !item.category) return;
    if (item.archived) return showToast("\uBCF4\uAD00\uD55C \uC637\uC740 \uBCF5\uC6D0 \uD6C4 \uC785\uC744 \uC218 \uC788\uC5B4\uC694");
    const nextFit = normalizeFit({ ...fit, [item.category]: item }, wardrobe);
    setFit(nextFit);
    setMood(item.mood || mood);
    persist({ fit: nextFit, mood: item.mood || mood });
    showToast(`${item.name || "\uC120\uD0DD\uD55C \uC637"}\uC744(\uB97C) \uC785\uD614\uC5B4\uC694`);
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
    const nextFit = normalizeFit({ ...fit, [selectedCategory]: item }, nextWardrobe);
    setWardrobe(nextWardrobe);
    setFit(nextFit);
    setMood(item.mood || mood);
    persist({ wardrobe: nextWardrobe, fit: nextFit, mood: item.mood || mood });
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
    event.target.value = "";
    if (!file) return;
    openComingSoon("\uC0AC\uC9C4 AI \uBD84\uC11D");
  }

  function updateWardrobeItem(itemId, patch) {
    const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
    const nextWardrobe = safeWardrobe.map((item) => item.id === itemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
    const nextFit = Object.fromEntries(Object.entries(normalizeFit(fit, safeWardrobe)).map(([slot, item]) => [slot, item?.id === itemId ? { ...item, ...patch } : item]));
    setWardrobe(nextWardrobe);
    setFit(nextFit);
    persist({ wardrobe: nextWardrobe, fit: nextFit });
    showToast("\uC637 \uC815\uBCF4\uB97C \uC800\uC7A5\uD588\uC5B4\uC694");
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
    award("\uC637\uC7A5 \uC815\uB9AC", 10, 2);
  }

  if (entryStep === "auth") {
    return <AuthScreen t={t} onGuest={continueGuest} onAccount={handleAccount} setLanguage={setLanguage} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />;
  }

  if (entryStep === "survey") {
    return <StyleSurveyScreen initialProfile={styleProfile} onSubmit={finishStyleSurvey} onSkip={skipStyleSurvey} />;
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
          styleProfile={styleProfile}
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

function StyleSurveyScreen({ initialProfile, onSubmit, onSkip }) {
  const [profile, setProfile] = useState(normalizeStyleProfile(initialProfile));
  const advice = buildShoppingAdvice(profile);
  const summary = summarizeStyleProfile(profile);

  const toggleList = (key, value, limit = 99) => {
    setProfile((current) => {
      const list = Array.isArray(current[key]) ? current[key] : [];
      const exists = list.includes(value);
      const nextList = exists ? list.filter((item) => item !== value) : [...list, value].slice(0, limit);
      return normalizeStyleProfile({ ...current, [key]: nextList });
    });
  };

  const setSingle = (key, value) => {
    setProfile((current) => normalizeStyleProfile({ ...current, [key]: value }));
  };

  return (
    <main className="entry-screen survey-world">
      <section className="entry-card style-survey-card">
        <div className="survey-copy">
          <p className="eyebrow">STYLE PROFILE</p>
          <h1>취향을 알려주면 더 잘 골라줄개</h1>
          <p>설문은 건너뛸 수 있어요. 참여하면 옷장, 추천, 코디 점수가 내 취향에 더 가깝게 맞춰집니다.</p>
          <div className="survey-preview">
            <span>분석 미리보기</span>
            <strong>{summary || "좋아하는 스타일을 선택해보세요"}</strong>
            <ul>
              {advice.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
        <form className="survey-form" onSubmit={(event) => { event.preventDefault(); onSubmit(profile); }}>
          <SurveyBlock title="좋아하는 스타일" note="복수 선택">
            <div className="survey-option-grid">
              {styleSurveyOptions.styles.map((item) => (
                <button className={profile.styles.includes(item) ? "active" : ""} key={item} onClick={() => toggleList("styles", item)} type="button">{item}</button>
              ))}
            </div>
          </SurveyBlock>
          <SurveyBlock title="좋아하는 핏" note="복수 선택">
            <div className="survey-option-grid compact">
              {styleSurveyOptions.fits.map((item) => (
                <button className={profile.fits.includes(item) ? "active" : ""} key={item} onClick={() => toggleList("fits", item)} type="button">{item}</button>
              ))}
            </div>
          </SurveyBlock>
          <SurveyBlock title="좋아하는 색상" note="최대 5개">
            <div className="survey-color-grid">
              {styleSurveyOptions.colors.map((item) => (
                <button className={profile.colors.includes(item) ? "active" : ""} key={item} onClick={() => toggleList("colors", item, 5)} type="button">
                  <span style={{ "--survey-color": colorTokenToHex(item) }} />
                  {item}
                </button>
              ))}
            </div>
          </SurveyBlock>
          <div className="survey-two-col">
            <SurveyBlock title="성별 선택" note="추천 기준">
              <div className="survey-option-grid compact">
                {styleSurveyOptions.genders.map(([value, label]) => (
                  <button className={profile.gender === value ? "active" : ""} key={value} onClick={() => setSingle("gender", value)} type="button">{label}</button>
                ))}
              </div>
            </SurveyBlock>
            <SurveyBlock title="체형 선택" note="나중에 커마에서 수정 가능">
              <div className="survey-option-grid compact">
                {styleSurveyOptions.bodyTypes.map(([value, label]) => (
                  <button className={profile.bodyType === value ? "active" : ""} key={value} onClick={() => setSingle("bodyType", value)} type="button">{label}</button>
                ))}
              </div>
            </SurveyBlock>
          </div>
          <div className="survey-two-col">
            <label className="survey-field"><span>선호 브랜드</span><input value={profile.brands} onChange={(event) => setSingle("brands", event.target.value)} placeholder="무신사 스탠다드, 나이키, COS" /></label>
            <label className="survey-field"><span>퍼스널 컬러</span><select value={profile.personalColor} onChange={(event) => setSingle("personalColor", event.target.value)}>{styleSurveyOptions.personalColors.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="survey-actions">
            <button className="secondary" type="button" onClick={onSkip}>건너뛰기</button>
            <button className="primary" type="submit"><Sparkles size={16} />스타일 프로필 만들기</button>
          </div>
        </form>
      </section>
    </main>
  );
}

function SurveyBlock({ title, note, children }) {
  return (
    <section className="survey-block">
      <div>
        <strong>{title}</strong>
        <span>{note}</span>
      </div>
      {children}
    </section>
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

function V3Home({ recommendation, scores, game, wardrobe, savedLooks, weather, fit, onEvent, homeBanner, setHomeBanner, styleProfile }) {
  const safeFit = normalizeFit(fit);
  const safeWardrobe = Array.isArray(wardrobe) ? wardrobe : [];
  const safeSavedLooks = Array.isArray(savedLooks) ? savedLooks : [];
  const profile = normalizeStyleProfile(styleProfile);
  const shoppingAdvice = recommendation.shoppingAdvice || buildShoppingAdvice(profile, safeFit, weather);
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
                <span>트렌드 {scores.trend}</span>
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
        <WorldCard className="home-medium-card profile-advice-card" icon={<Palette size={20} />} title="골라줄개 추천" note={profile.summary || "취향 설문으로 더 정확하게"}>
          <p className="tiny-copy strong-copy">{recommendation.colorReason || scores.colorSummary}</p>
          <ul className="advice-list-v3">
            {shoppingAdvice.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
          </ul>
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
function CharacterRoom({ t, mood, setMood, fit, bodyProfile, setBodyProfile, persist, saveLook, styleProfile }) {
  const profile = normalizeBodyProfile(bodyProfile);
  const [zoom, setZoom] = useState(112);
  const [rotation, setRotation] = useState(0);
  const [activeCustomizeTab, setActiveCustomizeTab] = useState("body");
  const [advancedMode, setAdvancedMode] = useState(false);
  const dragState = useRef({ active: false, x: 0, rotation: 0 });
  const profileSummary = normalizeStyleProfile(styleProfile);
  const focusZoom = { face: 1.2, hair: 1.16, body: 1.04, tops: 1.07, bottoms: 1.08, shoes: 1.16, detail: 1.1 }[activeCustomizeTab] || 1;
  const viewportY = { face: "-7%", hair: "-8%", body: "0%", tops: "-2%", bottoms: "4%", shoes: "8%", detail: "-2%" }[activeCustomizeTab] || "0%";
  const genderLabel = { male: "남성", female: "여성", neutral: "뉴트럴" }[profile.gender] || "뉴트럴";
  const silhouetteLabel = profile.legRatio >= 58 ? "롱레그 실루엣" : profile.shoulderWidth >= 48 ? "스트럭처 핏" : profile.hipWidth >= 48 ? "커브 밸런스" : "소프트 밸런스";

  const updateProfile = (patch) => {
    const next = normalizeBodyProfile({ ...profile, ...patch });
    setBodyProfile(next);
    persist({ bodyProfile: next });
  };
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
  const controlGroups = {
    face: {
      note: "얼굴 파츠 없이도 머리와 목 비율로 모델 인상이 달라져요.",
      basic: [["머리 크기", "headSize", 80, 130], ["머리 폭", "headWidth", -50, 50], ["얼굴 길이", "faceLength", -50, 50]],
      advanced: [["머리 높이", "headHeight", -50, 50], ["턱 길이", "jawSize", -50, 50], ["턱 넓이", "jawWidth", -50, 50], ["목 길이", "neckLength", 70, 130], ["목 굵기", "neckWidth", -50, 50]],
    },
    body: {
      note: "가장 자주 쓰는 체형 값만 먼저 보여줘요. 옷 실루엣도 즉시 같이 변합니다.",
      basic: [["키", "height", 140, 210], ["어깨 넓이", "shoulderWidth", 30, 56, { shoulder: true }], ["허리", "waistWidth", 20, 42, { waist: true }], ["골반", "hipWidth", 32, 62], ["다리 길이", "legLength", 70, 130], ["다리 비율", "legRatio", 40, 70]],
      advanced: [["쇄골", "clavicleWidth", -50, 50], ["승모근", "trapSize", -50, 50], ["흉곽", "ribcageSize", -50, 50], ["가슴 볼륨", "chestVolume", 0, 100], ["가슴 위치", "chestPosition", -50, 50], ["등 두께", "backThickness", -50, 50], ["복부 볼륨", "abdomenVolume", -50, 50], ["체중", "weightKg", 40, 150], ["근육량", "muscleMass", 0, 100], ["체지방", "bodyFat", 0, 100]],
    },
    tops: {
      note: "상의와 아우터가 어깨, 가슴, 허리 변화에 맞춰 붙도록 조정해요.",
      basic: [["어깨 넓이", "shoulderWidth", 30, 56, { shoulder: true }], ["가슴 볼륨", "chestVolume", 0, 100], ["허리", "waistWidth", 20, 42, { waist: true }]],
      advanced: [["팔 길이", "armLength", 70, 130], ["상완 굵기", "upperArmWidth", -50, 50], ["전완 굵기", "lowerArmWidth", -50, 50], ["손 크기", "handSize", -50, 50]],
    },
    bottoms: {
      note: "하의는 허리, 골반, 허벅지, 다리 길이에 맞춰 실루엣이 바뀝니다.",
      basic: [["허리", "waistWidth", 20, 42, { waist: true }], ["골반", "hipWidth", 32, 62], ["다리 길이", "legLength", 70, 130], ["허벅지", "thighWidth", -50, 50]],
      advanced: [["골반 높이", "hipHeight", -50, 50], ["엉덩이 볼륨", "hipVolume", -50, 50], ["엉덩이 돌출", "hipProjection", -50, 50], ["종아리", "calfWidth", -50, 50], ["무릎 높이", "kneeHeight", -50, 50]],
    },
    shoes: {
      note: "신발 크기와 발끝 비율을 맞춰 바닥에 자연스럽게 닿게 해요.",
      basic: [["발 크기", "footSize", -50, 50], ["다리 길이", "legLength", 70, 130]],
      advanced: [["종아리 굵기", "calfWidth", -50, 50], ["종아리 길이", "calfLength", -50, 50], ["팔 비율", "armRatio", 10, 25]],
    },
    detail: {
      note: "전체 비율과 저장 기능을 관리해요.",
      basic: [["상체 비율", "torsoRatio", 30, 60], ["머리 비율", "headRatio", 5, 20], ["몸통 길이", "torsoLength", 44, 70]],
      advanced: [["전체 체중감", "weightMass", -50, 50], ["손 크기", "handSize", -50, 50], ["손가락 길이", "fingerLength", -50, 50]],
    },
  };
  const activeGroup = controlGroups[activeCustomizeTab] || controlGroups.body;
  const presetGroups = {
    female: [["슬림", { gender: "female", shoulderWidth: 38, waistWidth: 24, hipWidth: 43, legRatio: 58, chestVolume: 18 }], ["스트레이트", { gender: "female", shoulderWidth: 41, waistWidth: 27, hipWidth: 42, legRatio: 55, chestVolume: 10 }], ["글래머", { gender: "female", shoulderWidth: 42, waistWidth: 25, hipWidth: 52, legRatio: 55, chestVolume: 46 }], ["스포츠", { gender: "female", shoulderWidth: 45, waistWidth: 27, hipWidth: 44, legRatio: 56, muscleMass: 48 }]],
    male: [["슬림", { gender: "male", shoulderWidth: 45, waistWidth: 27, hipWidth: 39, legRatio: 54, muscleMass: 18 }], ["스탠다드", { gender: "male", shoulderWidth: 49, waistWidth: 30, hipWidth: 40, legRatio: 53, muscleMass: 30 }], ["운동형", { gender: "male", shoulderWidth: 54, waistWidth: 29, hipWidth: 41, legRatio: 53, muscleMass: 62 }], ["와이드", { gender: "male", shoulderWidth: 56, waistWidth: 34, hipWidth: 43, legRatio: 51, weightMass: 22 }]],
    neutral: [["밸런스", { gender: "neutral", shoulderWidth: 42, waistWidth: 28, hipWidth: 42, legRatio: 54 }], ["슬림", { gender: "neutral", shoulderWidth: 38, waistWidth: 24, hipWidth: 38, legRatio: 57, weightMass: -18 }], ["롱레그", { gender: "neutral", shoulderWidth: 40, waistWidth: 26, hipWidth: 40, legRatio: 63, legLength: 116 }], ["소프트", { gender: "neutral", shoulderWidth: 39, waistWidth: 29, hipWidth: 45, legRatio: 53, bodyFat: 26 }]],
  };
  const applyPreset = (patch) => updateProfile({ ...patch });
  const randomizeBody = () => {
    updateProfile({
      height: 158 + Math.round(Math.random() * 24),
      headSize: 94 + Math.round(Math.random() * 16),
      shoulderWidth: 37 + Math.round(Math.random() * 14),
      waistWidth: 23 + Math.round(Math.random() * 12),
      hipWidth: 36 + Math.round(Math.random() * 18),
      legRatio: 50 + Math.round(Math.random() * 12),
      chestVolume: Math.round(Math.random() * 48),
      muscleMass: Math.round(Math.random() * 55),
      bodyFat: Math.round(Math.random() * 38),
    });
  };
  const resetBody = () => updateProfile(bodyPreset("regular"));
  const saveBody = () => persist({ bodyProfile: profile });
  const onPointerDown = (event) => {
    dragState.current = { active: true, x: event.clientX, rotation };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!dragState.current.active) return;
    setRotation(dragState.current.rotation + (event.clientX - dragState.current.x) * .5);
  };
  const onPointerUp = () => {
    dragState.current.active = false;
  };
  const onWheel = (event) => {
    event.preventDefault();
    setZoom((value) => clamp(value - event.deltaY * .035, 88, 142));
  };
  const tabItems = [
    ["face", UserRound, "얼굴"],
    ["hair", Sparkles, "헤어"],
    ["body", UserRound, "체형"],
    ["tops", Shirt, "상의"],
    ["bottoms", Trees, "하의"],
    ["shoes", Check, "신발"],
    ["detail", Palette, "디테일"],
  ];

  return (
    <section className="world-room character-room-v3 avatar-studio-premium">
      <header className="avatar-studio-header">
        <div>
          <p className="eyebrow">AVATAR STUDIO</p>
          <h2>패션 아바타 스튜디오</h2>
        </div>
        <aside className="avatar-live-analysis" aria-label="실시간 체형 분석">
          <span>오늘의 체형 분석</span>
          <strong>{genderLabel} · {silhouetteLabel}</strong>
          <p>추천 핏 {profile.shoulderWidth >= 48 ? "세미오버 자켓" : "스트레이트 상의"} · 퍼스널 컬러 {profileSummary.personalColor || "모름"}</p>
        </aside>
      </header>

      <div
        className={`avatar-dressing-stage avatar-studio-stage focus-${activeCustomizeTab}`}
        style={{ "--studio-zoom": (zoom / 100) * focusZoom, "--studio-rotate": `${rotation}deg`, "--studio-pan-y": viewportY }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        role="application"
        aria-label="드래그로 아바타 회전, 마우스 휠로 확대 축소"
      >
        <div className="studio-depth-grid" aria-hidden="true" />
        <FashionAvatar fit={fit} mood={mood} bodyProfile={profile} t={t} />
        <div className="studio-view-hint">드래그 회전 · 휠 줌</div>
      </div>

      <aside className="room-panel-v3 avatar-control-console">
        <div className="studio-console-top">
          <h3>커스터마이징</h3>
          <button className={advancedMode ? "active" : ""} type="button" onClick={() => setAdvancedMode((value) => !value)}>
            {advancedMode ? "고급 닫기" : "고급 모드"}
          </button>
        </div>
        <div className="avatar-icon-tabs" role="tablist" aria-label="아바타 스튜디오 카테고리">
          {tabItems.map(([key, Icon, label]) => (
            <button key={key} className={activeCustomizeTab === key ? "active" : ""} type="button" onClick={() => setActiveCustomizeTab(key)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <Segment label="성별 베이스" items={[["neutral", "뉴트럴"], ["female", "여성"], ["male", "남성"]]} value={profile.gender} onChange={(value) => updateProfile({ gender: value })} />
        <div className="preset-shelf">
          {(presetGroups[profile.gender] || presetGroups.neutral).map(([label, patch]) => (
            <button key={label} type="button" onClick={() => applyPreset(patch)}>{label}</button>
          ))}
        </div>
        {activeCustomizeTab === "hair" ? (
          <div className="custom-tab-panel-v3">
            <Segment label="헤어" items={[["none", "없음"], ["short", "숏컷"], ["medium", "미디엄"], ["long", "롱"], ["wavy", "웨이브"], ["ponytail", "포니테일"], ["bun", "번헤어"]]} value={profile.hairStyle} onChange={(value) => updateProfile({ hairStyle: value })} />
            <Segment label="헤어 컬러" items={[["black", "블랙"], ["brown", "브라운"], ["blonde", "블론드"], ["ash", "애쉬"]]} value={profile.hairColor} onChange={(value) => updateProfile({ hairColor: value })} />
            <Segment label="베이스 컬러" items={[["ivory", "소프트 아이보리"], ["warmGray", "웜 그레이"], ["lightBeige", "라이트 베이지"], ["bright", "밝은 피부"], ["medium", "보통 피부"]]} value={profile.skinTone} onChange={(value) => updateProfile({ skinTone: value })} />
          </div>
        ) : (
          <div className="custom-tab-panel-v3">
            <p className="custom-panel-note-v3">{activeGroup.note}</p>
            <div className="custom-range-grid-v3 primary-ranges">{renderRanges(activeGroup.basic)}</div>
            {advancedMode && <div className="custom-range-grid-v3 advanced-ranges">{renderRanges(activeGroup.advanced)}</div>}
          </div>
        )}
        <div className="studio-save-actions">
          <button type="button" onClick={saveLook}>룩 저장</button>
          <button type="button" onClick={saveBody}>체형 저장</button>
          <button type="button" onClick={randomizeBody}>랜덤 생성</button>
          <button type="button" onClick={resetBody}>초기화</button>
        </div>
      </aside>
    </section>
  );
}
function MagicCloset({ t, wardrobe, wear, addItem, onEditItem, onArchiveItem, onRestoreItem, onDeleteItem, fit, bodyProfile }) {
  const [closetCategory, setClosetCategory] = useState("tops");
  const [lastDressedItem, setLastDressedItem] = useState(null);
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
  const safeFit = normalizeFit(fit, safeWardrobe);
  const handleWear = (item) => {
    if (!item || item.archived) return;
    setLastDressedItem(item);
    wear(item);
  };

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
          <div className="fitting-avatar-frame">
            <FashionAvatar fit={fit} mood="moodLuxury" bodyProfile={bodyProfile} t={t} />
          </div>
          <div className="fitting-copy-v3">
            <span className="fitting-status-v3">{lastDressedItem ? "방금 입힘" : "피팅룸"}</span>
            <strong>{lastDressedItem?.name || "지금 입은 룩"}</strong>
            <p>{lastDressedItem ? `${fashionText(lastDressedItem.category)}가 캐릭터에 적용됐어요. 색과 핏을 바로 확인하세요.` : "옷 카드의 입히기를 누르면 이 캐릭터에 바로 적용돼요."}</p>
          </div>
        </div>
        <div className="wearing-details compact-wearing-v3">
          {["tops", "outerwear", "bottoms", "shoes", "bags", "accessories"].map((slot) => (
            <div className="wearing-detail" key={slot}>
              <span style={{ "--swatch": safeFit[slot]?.color || "#e8e1d9" }} />
              <div>
                <small>{fashionText(slot)}</small>
                <strong>{safeFit[slot]?.name || "비어 있음"}</strong>
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
            <article className={`collectible-card ${item.archived ? "is-archived" : ""} ${safeFit[item.category]?.id === item.id ? "is-wearing" : ""}`} key={item.id}>
              <button className="collectible-wear" onClick={() => handleWear(item)} type="button" disabled={item.archived}>
                {item.image ? <img src={item.image} alt="" /> : <span className={`fabric pattern-${item.pattern || "plain"}`} style={{ "--fabric": item.color }} />}
                <strong>{item.name}</strong>
                <p>{fashionText(item.category)} · {fashionText(item.subcategory || item.clothingType)} · {fashionText(item.pattern || "Solid")}</p>
                <div><em>{fashionText(item.fitType || "Regular Fit")}</em><em>{fashionText(item.fabric || "Cotton")}</em></div>
                <b className="wear-now-label">{safeFit[item.category]?.id === item.id ? "착용 중" : "바로 입히기"}</b>
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
      <div className="score-strip-v3"><span>총점 {scores.total}</span><span>컬러 {scores.color}</span><span>실루엣 {scores.silhouette}</span><span>트렌드 {scores.trend}</span></div>
      <p className="tiny-copy">{recommendation.tips}</p>
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
function lockAvatarModelShape(profile = {}) {
  const safe = normalizeBodyProfile(profile);
  const genderMorph = {
    male: { shoulderWidth: 7, waistWidth: -1, hipWidth: -5, chestVolume: -10, legRatio: -1 },
    female: { shoulderWidth: -2, waistWidth: -3, hipWidth: 8, chestVolume: 24, legRatio: 3 },
    neutral: { shoulderWidth: 0, waistWidth: 0, hipWidth: 0, chestVolume: 4, legRatio: 0 },
  }[safe.gender] || { shoulderWidth: 0, waistWidth: 0, hipWidth: 0, chestVolume: 0, legRatio: 0 };
  return normalizeBodyProfile({
    ...safe,
    shoulderWidth: safe.shoulderWidth + genderMorph.shoulderWidth,
    shoulder: safe.shoulderWidth + genderMorph.shoulderWidth,
    waistWidth: safe.waistWidth + genderMorph.waistWidth,
    waist: safe.waistWidth + genderMorph.waistWidth,
    hipWidth: safe.hipWidth + genderMorph.hipWidth,
    chestVolume: safe.chestVolume + genderMorph.chestVolume,
    legRatio: safe.legRatio + genderMorph.legRatio,
    faceDetail: "faceless",
  });
}

function ReferenceFashionAvatar({ fit, bodyProfile }) {
  const svgId = useId().replace(/:/g, "");
  const profile = lockAvatarModelShape(bodyProfile);
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function MannequinAvatar({ fit, bodyProfile }) {
  const svgId = useId().replace(/:/g, "");
  const profile = lockAvatarModelShape(bodyProfile);
  const safeFit = normalizeFit(fit);
  const top = safeFit.tops || {};
  const outer = safeFit.outerwear || {};
  const bottom = safeFit.bottoms || {};
  const shoes = safeFit.shoes || {};
  const skin = avatarVariables(profile)["--avatar-skin"] || "#efe6dc";
  const hair = avatarVariables(profile)["--avatar-hair"] || "#6d4b3f";
  const topColor = top.color || top.primaryColor || "#f3efe7";
  const outerColor = outer.color || outer.primaryColor || "";
  const bottomColor = bottom.color || bottom.primaryColor || "#9fb0c4";
  const shoeColor = shoes.color || shoes.primaryColor || "#f7f3ea";
  const isHoodie = /hood/i.test(top.subcategory || top.clothingType || "");
  const isShirt = /shirt|oxford|dress|linen/i.test(top.subcategory || top.clothingType || "");
  const isCoat = /coat|padding|cardigan|jacket/i.test(outer.subcategory || outer.clothingType || "");
  const isSkirt = /skirt/i.test(bottom.subcategory || bottom.clothingType || "");
  const isWide = /wide|baggy|cargo|jogger/i.test(bottom.subcategory || bottom.clothingType || bottom.fitType || "");
  const isSlim = /skinny|slim/i.test(bottom.subcategory || bottom.clothingType || bottom.fitType || "");

  const cx = 160;
  const heightScale = clamp(profile.height / 168, .86, 1.2);
  const headRx = clamp(35 + (profile.headSize - 100) * .22 + profile.headWidth * .14, 29, 48);
  const headRy = clamp(47 + (profile.headSize - 100) * .24 + profile.headHeight * .16 + profile.faceLength * .08, 38, 62);
  const headCy = 76;
  const neckW = clamp(19 + profile.neckWidth * .08, 14, 28);
  const neckH = clamp(32 + (profile.neckLength - 100) * .26, 22, 46);
  const shoulderY = headCy + headRy + neckH + 10;
  const shoulderHalf = clamp(58 + (profile.shoulderWidth - 42) * 1.9 + profile.clavicleWidth * .18 + profile.muscleMass * .08, 44, 88);
  const ribHalf = clamp(46 + profile.ribcageSize * .16 + profile.backThickness * .13 + profile.chestVolume * .08, 34, 74);
  const waistHalf = clamp(34 + (profile.waistWidth - 28) * 2.15 + profile.abdomenVolume * .16 + profile.bodyFat * .12 + profile.weightMass * .08, 24, 68);
  const hipHalf = clamp(48 + (profile.hipWidth - 42) * 1.72 + profile.hipVolume * .18 + profile.hipProjection * .08 + profile.bodyFat * .08, 34, 88);
  const chestLift = clamp(profile.chestPosition * .12, -7, 7);
  const torsoH = clamp(154 + (profile.torsoLength - 54) * 3 + (profile.torsoRatio - 45) * 1.2, 124, 220);
  const waistY = shoulderY + torsoH * .55 + profile.waistHeight * .16;
  const hipY = shoulderY + torsoH;
  const legH = clamp(196 + (profile.legLength - 100) * 1.9 + (profile.legRatio - 52) * 4.1 + (profile.height - 168) * .72, 150, 286);
  const footY = hipY + legH;
  const armH = clamp(158 + (profile.armLength - 100) * 1.55 + (profile.armRatio - 18) * 3.2 + (profile.height - 168) * .18, 122, 226);
  const upperArm = clamp(16 + profile.upperArmWidth * .08 + profile.muscleMass * .08 + profile.bodyFat * .04, 11, 28);
  const lowerArm = clamp(13 + profile.lowerArmWidth * .08 + profile.muscleMass * .05 + profile.bodyFat * .03, 9, 23);
  const thigh = clamp(28 + profile.thighWidth * .12 + profile.bodyFat * .09 + profile.muscleMass * .08, 19, 46);
  const calf = clamp(21 + profile.calfWidth * .11 + profile.bodyFat * .06 + profile.muscleMass * .07, 14, 35);
  const foot = clamp(25 + profile.footSize * .12, 18, 38);
  const leftShoulder = cx - shoulderHalf;
  const rightShoulder = cx + shoulderHalf;
  const chestY = shoulderY + 38 + chestLift;
  const leftRib = cx - ribHalf;
  const rightRib = cx + ribHalf;
  const leftWaist = cx - waistHalf;
  const rightWaist = cx + waistHalf;
  const leftHip = cx - hipHalf;
  const rightHip = cx + hipHalf;
  const clothEase = isHoodie ? 13 : /oversized|wide|baggy/i.test(top.fitType || top.subcategory || "") ? 10 : /slim/i.test(top.fitType || top.subcategory || "") ? 1 : 5;
  const topHemY = hipY - (/(crop|cropped)/i.test(top.fitType || top.subcategory || "") ? 38 : 8);
  const topPath = `M${leftShoulder - clothEase} ${shoulderY + 8} C${leftRib - clothEase * .6} ${chestY + 8} ${leftWaist - clothEase} ${waistY + 18} ${leftWaist - clothEase * .8} ${topHemY} C${cx - 26} ${topHemY + 13} ${cx + 26} ${topHemY + 13} ${rightWaist + clothEase * .8} ${topHemY} C${rightWaist + clothEase} ${waistY + 18} ${rightRib + clothEase * .6} ${chestY + 8} ${rightShoulder + clothEase} ${shoulderY + 8} C${cx + 36} ${shoulderY - 8} ${cx - 36} ${shoulderY - 8} ${leftShoulder - clothEase} ${shoulderY + 8}Z`;
  const torsoPath = `M${leftShoulder} ${shoulderY + 6} C${leftRib} ${chestY + 10} ${leftWaist} ${waistY - 4} ${leftWaist} ${waistY} C${leftWaist} ${waistY + 34} ${leftHip} ${hipY - 14} ${leftHip} ${hipY} C${cx - 35} ${hipY + 20} ${cx + 35} ${hipY + 20} ${rightHip} ${hipY} C${rightHip} ${hipY - 14} ${rightWaist} ${waistY + 34} ${rightWaist} ${waistY} C${rightWaist} ${waistY - 4} ${rightRib} ${chestY + 10} ${rightShoulder} ${shoulderY + 6} C${cx + 34} ${shoulderY - 14} ${cx - 34} ${shoulderY - 14} ${leftShoulder} ${shoulderY + 6}Z`;
  const leftArm = `M${leftShoulder + 8} ${shoulderY + 15} C${leftShoulder - 18} ${shoulderY + 44} ${leftShoulder - 20} ${shoulderY + armH - 30} ${leftShoulder - 7} ${shoulderY + armH} C${leftShoulder + 5 + profile.handSize * .05} ${shoulderY + armH + 14} ${leftShoulder + lowerArm + 11} ${shoulderY + armH + 4} ${leftShoulder + lowerArm + 2} ${shoulderY + armH - 12} C${leftShoulder + lowerArm} ${shoulderY + 93} ${leftShoulder + upperArm + 15} ${shoulderY + 38} ${leftShoulder + 23} ${shoulderY + 12}Z`;
  const rightArm = `M${rightShoulder - 8} ${shoulderY + 15} C${rightShoulder + 18} ${shoulderY + 44} ${rightShoulder + 20} ${shoulderY + armH - 30} ${rightShoulder + 7} ${shoulderY + armH} C${rightShoulder - 5 - profile.handSize * .05} ${shoulderY + armH + 14} ${rightShoulder - lowerArm - 11} ${shoulderY + armH + 4} ${rightShoulder - lowerArm - 2} ${shoulderY + armH - 12} C${rightShoulder - lowerArm} ${shoulderY + 93} ${rightShoulder - upperArm - 15} ${shoulderY + 38} ${rightShoulder - 23} ${shoulderY + 12}Z`;
  const legsPath = `M${cx - 10} ${hipY + 8} C${cx - thigh} ${hipY + 58 + profile.thighLength * .12} ${cx - calf} ${footY - 48 - profile.calfLength * .1} ${cx - 29} ${footY} C${cx - 10} ${footY + 12} ${cx - 5} ${footY - 7} ${cx - 2} ${hipY + 54} C${cx + 3} ${footY - 7} ${cx + 10} ${footY + 12} ${cx + 29} ${footY} C${cx + calf} ${footY - 48 - profile.calfLength * .1} ${cx + thigh} ${hipY + 58 + profile.thighLength * .12} ${cx + 10} ${hipY + 8}Z`;
  const pantsLeg = isSlim ? 10 : isWide ? 25 : 17;
  const pantsPath = isWide
    ? `M${leftHip + 4} ${hipY - 3} H${rightHip - 4} L${rightHip + pantsLeg} ${footY - 19} C${cx + 38} ${footY - 8} ${cx + 20} ${footY - 8} ${cx + 11} ${footY - 18} L${cx + 2} ${hipY + 48} L${cx - 11} ${footY - 18} C${cx - 20} ${footY - 8} ${cx - 38} ${footY - 8} ${leftHip - pantsLeg} ${footY - 19}Z`
    : `M${leftHip + 10} ${hipY - 3} H${rightHip - 10} L${cx + pantsLeg} ${footY - 18} C${cx + 19} ${footY - 7} ${cx + 7} ${footY - 7} ${cx + 5} ${footY - 19} L${cx + 1} ${hipY + 48} L${cx - 5} ${footY - 19} C${cx - 7} ${footY - 7} ${cx - 19} ${footY - 7} ${cx - pantsLeg} ${footY - 18}Z`;
  const skirtPath = `M${leftHip - 5} ${hipY - 5} H${rightHip + 5} L${rightHip + 16} ${hipY + 98} C${cx + 34} ${hipY + 114} ${cx - 34} ${hipY + 114} ${leftHip - 16} ${hipY + 98}Z`;
  const hairPath = `M${cx - headRx * .95} ${headCy - 4} C${cx - headRx * .78} ${headCy - headRy * 1.02} ${cx + headRx * .74} ${headCy - headRy * 1.04} ${cx + headRx * .96} ${headCy - 4} C${cx + headRx * .45} ${headCy - headRy * .2} ${cx - headRx * .18} ${headCy - headRy * .18} ${cx - headRx * .95} ${headCy - 4}Z`;

  return (
    <svg className={`fashion-avatar svg-avatar mannequin-avatar gender-${profile.gender || "neutral"}`} viewBox="0 0 320 620" role="img" aria-label="MoodFit faceless fitting avatar">
      <defs>
        <radialGradient id={`${svgId}-skin`} cx="42%" cy="20%" r="76%">
          <stop stopColor="#fffdf8" />
          <stop offset=".56" stopColor={skin} />
          <stop offset="1" stopColor="#cfc7bd" />
        </radialGradient>
        <linearGradient id={`${svgId}-cloth`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#fff" stopOpacity=".36" />
          <stop offset=".45" stopColor={topColor} />
          <stop offset="1" stopColor={topColor} stopOpacity=".88" />
        </linearGradient>
        <filter id={`${svgId}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="13" floodColor="#4a3f3a" floodOpacity=".14" />
        </filter>
      </defs>
      <g filter={`url(#${svgId}-soft)`} style={{ transform: `translateY(${(1 - heightScale) * 28}px) scale(${heightScale})`, transformOrigin: "160px 330px" }}>
        <ellipse cx="160" cy={Math.min(596, footY + 22)} rx="88" ry="15" fill="rgba(74,63,58,.12)" />
        <path d={leftArm} fill={`url(#${svgId}-skin)`} stroke="#cfc7bd" strokeWidth="1.5" />
        <path d={rightArm} fill={`url(#${svgId}-skin)`} stroke="#cfc7bd" strokeWidth="1.5" />
        <path d={legsPath} fill={`url(#${svgId}-skin)`} stroke="#cfc7bd" strokeWidth="1.5" />
        <path d={torsoPath} fill={`url(#${svgId}-skin)`} stroke="#cfc7bd" strokeWidth="1.5" />
        <rect x={cx - neckW} y={headCy + headRy - 1} width={neckW * 2} height={neckH + 11} rx={neckW * .72} fill={`url(#${svgId}-skin)`} />
        <ellipse cx={cx} cy={headCy} rx={headRx} ry={headRy} fill={`url(#${svgId}-skin)`} stroke="#cfc7bd" strokeWidth="1.4" />
        <path d={`M${cx - 52} ${chestY + 4} C${cx - 22} ${chestY + 20} ${cx + 22} ${chestY + 20} ${cx + 52} ${chestY + 4}`} fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth="2" />
        {profile.hairStyle !== "none" && <path d={hairPath} fill={hair} opacity=".9" />}
        <path d={topPath} fill={`url(#${svgId}-cloth)`} stroke="#817268" strokeOpacity=".18" strokeWidth="1.8" />
        {isHoodie && <path d={`M${cx - 37} ${shoulderY + 6} C${cx - 26} ${shoulderY - 22} ${cx + 26} ${shoulderY - 22} ${cx + 37} ${shoulderY + 6} C${cx + 19} ${shoulderY + 23} ${cx - 19} ${shoulderY + 23} ${cx - 37} ${shoulderY + 6}Z`} fill={topColor} opacity=".88" />}
        {isShirt && <path d={`M${cx - 18} ${shoulderY + 9} L${cx} ${shoulderY + 31} L${cx + 18} ${shoulderY + 9} M${cx} ${shoulderY + 31} V${topHemY - 6}`} fill="none" stroke="#fff" strokeOpacity=".78" strokeWidth="3.4" strokeLinecap="round" />}
        {outerColor && <path d={`M${leftShoulder - 11} ${shoulderY + 6} C${leftRib - 14} ${chestY + 8} ${leftWaist - 18} ${waistY + 28} ${leftHip - 18} ${isCoat ? hipY + 92 : hipY + 12} C${cx - 17} ${isCoat ? hipY + 105 : hipY + 24} ${cx + 17} ${isCoat ? hipY + 105 : hipY + 24} ${rightHip + 18} ${isCoat ? hipY + 92 : hipY + 12} C${rightWaist + 18} ${waistY + 28} ${rightRib + 14} ${chestY + 8} ${rightShoulder + 11} ${shoulderY + 6} C${cx + 36} ${shoulderY - 7} ${cx - 36} ${shoulderY - 7} ${leftShoulder - 11} ${shoulderY + 6}Z`} fill={outerColor} stroke="#817268" strokeOpacity=".18" strokeWidth="1.8" opacity=".93" />}
        {isSkirt ? <path d={skirtPath} fill={bottomColor} stroke="#817268" strokeOpacity=".2" strokeWidth="1.8" /> : <path d={pantsPath} fill={bottomColor} stroke="#817268" strokeOpacity=".2" strokeWidth="1.8" />}
        <ellipse cx={cx - 26} cy={footY + 4} rx={foot + 8} ry="9" fill={shoeColor} stroke="#cfc7bd" strokeWidth="1.6" />
        <ellipse cx={cx + 26} cy={footY + 4} rx={foot + 8} ry="9" fill={shoeColor} stroke="#cfc7bd" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

function FashionAvatar({ fit, mood, bodyProfile, t }) {
  return <MannequinAvatar fit={fit} bodyProfile={bodyProfile} />;
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

function scoreOutfit({ fit, weather, mood, eventType, styleProfile }) {
  const safeFit = normalizeFit(fit);
  const items = Object.values(safeFit).filter(Boolean);
  const profile = normalizeStyleProfile(styleProfile);
  const colorAnalysis = buildColorAnalysis(safeFit, profile);
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
  const profileFitBonus = profile.fits.some((fitName) => items.some((item) => fashionText(item.fitType || "").includes(fitName) || String(item.fitType || "").toLowerCase().includes(fitName.toLowerCase().replace("핏", "")))) ? 6 : 0;
  const styleSignalBonus = profile.styles.length ? 4 : 0;
  const color = Math.max(54, Math.min(98, Math.round((72 + coverageBonus + (hasLightDarkBalance ? 10 : 3) - (patternWarning ? 9 : 0) + colorAnalysis.score) / 2)));
  const comfort = Math.max(
    52,
    Math.min(96, 66 + coverageBonus + (hasShoes ? 8 : 0) + (hasOuter ? 7 : 0) + (isRain ? (hasOuter ? 4 : -7) : 3) + (isCold ? (hasOuter ? 5 : -5) : 0))
  );
  const confidence = Math.max(58, Math.min(98, 70 + coverageBonus + (moodText.includes("luxury") || moodText.includes("chic") ? 9 : 5) + (eventText ? 5 : 0) + profileFitBonus));
  const trend = Math.max(60, Math.min(97, 74 + styleSignalBonus + profileFitBonus + (safeFit.outerwear ? 4 : 0)));
  const silhouette = Math.max(58, Math.min(96, 70 + profileFitBonus + (items.length >= 3 ? 8 : 0) + (patternWarning ? -5 : 2)));
  const season = Math.max(58, Math.min(96, comfort + (isCold || isRain ? 0 : 2)));
  const total = Math.round((color + comfort + confidence + trend + silhouette + season) / 6);
  return { total, color, comfort, confidence, trend, silhouette, season, colorSummary: colorAnalysis.summary, patternWarning };
}

function token(value, fallback = "basic") {
  return String(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function fashionText(value) {
  return fashionLabelMap[value] || value || "";
}

function normalizeStyleProfile(profile = {}) {
  const safe = profile && typeof profile === "object" ? profile : {};
  const styles = Array.isArray(safe.styles) ? safe.styles.filter((item) => styleSurveyOptions.styles.includes(item)).slice(0, 8) : [];
  const fits = Array.isArray(safe.fits) ? safe.fits.filter((item) => styleSurveyOptions.fits.includes(item)).slice(0, 4) : [];
  const colors = Array.isArray(safe.colors) ? safe.colors.filter((item) => styleSurveyOptions.colors.includes(item)).slice(0, 5) : [];
  const gender = styleSurveyOptions.genders.some(([value]) => value === safe.gender) ? safe.gender : "neutral";
  const bodyType = styleSurveyOptions.bodyTypes.some(([value]) => value === safe.bodyType) ? safe.bodyType : "balanced";
  const personalColor = styleSurveyOptions.personalColors.includes(safe.personalColor) ? safe.personalColor : "모름";
  const brands = sanitizeInput(safe.brands || "", 240);
  const summary = summarizeStyleProfile({ styles, fits, colors });
  return {
    completed: Boolean(safe.completed),
    skipped: Boolean(safe.skipped),
    styles,
    fits,
    colors,
    gender,
    bodyType,
    brands,
    personalColor,
    summary,
  };
}

function summarizeStyleProfile(profile = {}) {
  const styles = Array.isArray(profile.styles) ? profile.styles.slice(0, 2) : [];
  const fits = Array.isArray(profile.fits) ? profile.fits.slice(0, 1) : [];
  const colors = Array.isArray(profile.colors) ? profile.colors.slice(0, 2) : [];
  return [...styles, ...fits, ...colors].filter(Boolean).join(" + ");
}

function buildShoppingAdvice(profile = {}, fit = {}, weather = "") {
  const safeProfile = normalizeStyleProfile(profile);
  const safeFit = normalizeFit(fit);
  const closetColors = Object.values(safeFit).filter(Boolean).map((item) => normalizeColorName(item.color));
  const favoriteColors = safeProfile.colors.length ? safeProfile.colors : ["화이트", "네이비", "베이지"];
  const favoriteFit = safeProfile.fits[0] || "정핏";
  const favoriteStyle = safeProfile.styles[0] || "캐주얼";
  const weatherText = String(weather || "").toLowerCase();
  const outerAdvice = weatherText.includes("rain") || weatherText.includes("비")
    ? "비 오는 날용 생활 방수 아우터를 하나 두면 활용도가 높을개."
    : "계절감 있는 얇은 아우터를 더하면 코디 완성도가 올라갈개.";
  const colorAdvice = closetColors.includes("black") || closetColors.includes("navy")
    ? `${favoriteColors[0]} 계열 상의를 추가하면 어두운 옷장에 밝은 포인트가 생길개.`
    : `${favoriteColors[0]} 또는 ${favoriteColors[1] || "그레이"} 계열 하의를 더하면 기존 옷과 매치하기 쉬울개.`;
  return [
    `${favoriteStyle} 무드에는 ${favoriteFit} 실루엣의 기본 상의가 먼저 필요할개.`,
    colorAdvice,
    outerAdvice,
    safeProfile.brands ? `${safeProfile.brands.split(",")[0].trim()} 느낌의 베이직 아이템부터 비교해보면 좋을개.` : "브랜드를 입력하면 구매 추천이 더 정확해질개.",
  ];
}

function buildColorAnalysis(fit = {}, profile = {}) {
  const safeFit = normalizeFit(fit);
  const colors = Object.values(safeFit).filter(Boolean).map((item) => normalizeColorName(item.color || item.primaryColor));
  const personalColor = normalizeStyleProfile(profile).personalColor;
  const hasNeutral = colors.some((color) => ["white", "black", "gray", "cream", "beige", "brown"].includes(color));
  const hasBlue = colors.some((color) => ["blue", "navy"].includes(color));
  const hasWarm = colors.some((color) => ["brown", "beige", "pink", "red", "yellow"].includes(color));
  const hasCool = colors.some((color) => ["blue", "navy", "gray", "green"].includes(color));
  const harmony = hasNeutral ? 92 : hasBlue && hasWarm ? 88 : hasCool && hasWarm ? 82 : 76;
  const personalBonus =
    personalColor.includes("겨울") && colors.some((color) => ["black", "white", "navy", "gray"].includes(color)) ? 5 :
    personalColor.includes("여름") && colors.some((color) => ["blue", "gray", "pink"].includes(color)) ? 4 :
    personalColor.includes("가을") && colors.some((color) => ["brown", "beige", "khaki"].includes(color)) ? 4 :
    personalColor.includes("봄") && colors.some((color) => ["cream", "pink", "yellow"].includes(color)) ? 4 : 0;
  const score = Math.min(98, harmony + personalBonus);
  const summary = hasNeutral
    ? "뉴트럴 컬러가 중심을 잡아줘서 안정적이고 고급스럽게 보일개."
    : hasBlue && hasWarm
      ? "차가운 색과 따뜻한 색이 섞여 포인트가 또렷한 조합일개."
      : "톤 차이가 크지 않아 부드럽게 이어지는 조합일개.";
  return { score, summary, colors };
}

function colorTokenToHex(name = "") {
  return {
    화이트: "#ffffff", 블랙: "#24201d", 그레이: "#b7b4ae", 베이지: "#dfc9aa", 브라운: "#8b674a", 카키: "#8f9678",
    네이비: "#1f3556", 블루: "#8bb5dc", 레드: "#d26d68", 핑크: "#f3b7c2", 퍼플: "#b7a3d8", 그린: "#9fc89f", 옐로우: "#f3d271",
  }[name] || "#f7d9d9";
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

function buildRecommendation({ t, mood, fit, brief, weather, schedule, eventType, aesthetic, styleProfile }) {
  const safeFit = normalizeFit(fit);
  const profile = normalizeStyleProfile(styleProfile);
  const pieces = [safeFit.tops, safeFit.outerwear, safeFit.bottoms, safeFit.shoes].filter(Boolean).map((item) => item.name);
  const pieceText = pieces.length ? pieces.join(", ") : t("wardrobeTitle");
  const colorAnalysis = buildColorAnalysis(safeFit, profile);
  const shoppingAdvice = buildShoppingAdvice(profile, safeFit, weather);
  const profileText = profile.summary || "캐주얼 + 정핏";
  return {
    name: `${t(mood)} ${profileText} 룩`,
    explanation: `오늘 일정은 ${schedule || t("schedule")}라서 ${pieceText} 조합이 가장 자연스럽개. ${colorAnalysis.summary}`,
    colors: [safeFit.tops?.color, safeFit.outerwear?.color, safeFit.bottoms?.color].filter(Boolean).join(" · "),
    avoid: t("avoidSentence").replace("{weather}", weather || t("weather")),
    tips: `${shoppingAdvice[0]} ${t("tipSentence").replace("{aesthetic}", aesthetic || profileText)}${brief ? ` ${sanitizeInput(brief)}` : ""}`,
    shoppingAdvice,
    colorReason: colorAnalysis.summary,
    profileText,
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
    shoulderSlope: metric("shoulderSlope"),
    trapSize: metric("trapSize"),
    chestVolume: metric("chestVolume"),
    chestPosition: metric("chestPosition"),
    ribcageSize: metric("ribcageSize"),
    waistHeight: metric("waistHeight"),
    abdomenVolume: metric("abdomenVolume"),
    backThickness: metric("backThickness"),
    upperArmWidth: metric("upperArmWidth"),
    lowerArmWidth: metric("lowerArmWidth"),
    handSize: metric("handSize"),
    fingerLength: metric("fingerLength"),
    hipVolume: metric("hipVolume"),
    hipHeight: metric("hipHeight"),
    hipProjection: metric("hipProjection"),
    thighWidth: metric("thighWidth"),
    thighLength: metric("thighLength"),
    calfWidth: metric("calfWidth"),
    calfLength: metric("calfLength"),
    kneeHeight: metric("kneeHeight"),
    footSize: metric("footSize"),
    weightKg: Number(profile.weightKg) || 58,
    weightMass: metric("weightMass"),
    muscleMass: metric("muscleMass"),
    bodyFat: metric("bodyFat"),
    torsoLength: Number(profile.torsoLength) || 54,
    torsoRatio: Number(profile.torsoRatio) || 45,
    legLength: Number(profile.legLength) || 92,
    legRatio: Number(profile.legRatio) || 52,
    headRatio: Number(profile.headRatio) || 12,
    armRatio: Number(profile.armRatio) || 18,
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
    ivory: "#eee6dd",
    warmGray: "#dfddd8",
    lightBeige: "#e8e3dd",
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

