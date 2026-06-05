import React, { useMemo, useRef, useState } from "react";
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
  LayoutGrid,
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
import { canRequestAi, isValidEmail, sanitizeInput } from "./lib/security";
import { categories, defaultFit, moods, seedWardrobe, themes } from "./lib/data";
import "./index.css";

const storageKey = "moodfit-premium-state-v2";

function App() {
  const stored = loadStoredState();
  const [language, setLanguage] = useState(stored.language || null);
  const [session, setSession] = useState(loadSession());
  const [entryStep, setEntryStep] = useState("auth");
  const [activePanel, setActivePanel] = useState("home");
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
  const [avatarWardrobeOpen, setAvatarWardrobeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [game, setGame] = useState(stored.game || { xp: 420, coins: 86, petLevel: 3, streak: 4 });
  const fileInputRef = useRef(null);
  const t = useMemo(() => createTranslator(language || "ko"), [language]);
  const recommendation = useMemo(
    () => buildRecommendation({ t, mood, fit, brief, weather, schedule, eventType, aesthetic }),
    [t, mood, fit, brief, weather, schedule, eventType, aesthetic]
  );
  const scores = useMemo(() => scoreOutfit({ fit, weather, mood, eventType }), [fit, weather, mood, eventType]);
  const showToday = activePanel === "today" || activePanel === "all";
  const showAll = activePanel === "all";

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
    const email = sanitizeInput(form.get("email")) || "hello@moodfit.local";
    const password = String(form.get("password") || "");
    if (!isValidEmail(email)) return showToast(t("invalidEmail"));
    if (password && password.length < 8) return showToast(t("invalidPassword"));
    const nextSession = await signInWithEmail({ email });
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

  function award(reason, xp = 25, coins = 6) {
    const next = {
      xp: game.xp + xp,
      coins: game.coins + coins,
      petLevel: Math.max(game.petLevel, Math.floor((game.xp + xp) / 180) + 1),
      streak: game.streak,
    };
    setGame(next);
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    localStorage.setItem(storageKey, JSON.stringify({ ...saved, game: next }));
    showToast(`${reason} +${xp} XP`);
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
  }

  function wear(item) {
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
    const item = {
      id: crypto.randomUUID(),
      name: sanitizeInput(form.get("name")) || `${t("scannedItem")} ${wardrobe.length + 1}`,
      category: selectedCategory,
      mood,
      season: sanitizeInput(form.get("season")) || "all",
      color: sanitizeInput(form.get("color")) || ["#eadcc7", "#101010", "#46627d", "#f5f1e9", "#8c5a38"][wardrobe.length % 5],
      vibe: sanitizeInput(form.get("vibe")) || "editorial",
      occasion: sanitizeInput(form.get("occasion")) || eventType,
      styleCategory: sanitizeInput(form.get("styleCategory")) || aesthetic,
      fitType: form.get("fitType") || "regularFit",
      clothingType: form.get("clothingType") || "blazer",
      pattern: "plain",
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

  if (entryStep === "auth") {
    return <AuthScreen t={t} onGuest={continueGuest} onAccount={handleAccount} setLanguage={setLanguage} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />;
  }

  return (
    <main className={`app moodfit-game theme-${theme} mood-${mood} panel-${activePanel}`}>
      <div className="ambient" aria-hidden="true" />
      <input ref={fileInputRef} className="hidden-input" type="file" accept="image/*" onChange={scanPhoto} />
      <header className="topbar">
        <button className="brand sketch-home-button" onClick={() => setActivePanel("home")} type="button">
          <span className="brand-mark">🐾</span>
          <span><strong>골라줄개</strong><small>당신의 무드를 정해줄개</small></span>
        </button>
        <nav className="nav main-tabs" aria-label="Main">
          <button className={activePanel === "customize" ? "active" : ""} onClick={() => setActivePanel("customize")} type="button"><UserRound size={16} />캐릭터</button>
          <button className={activePanel === "wardrobe" ? "active" : ""} onClick={() => setActivePanel("wardrobe")} type="button"><Shirt size={16} />옷장</button>
          <button className={activePanel === "today" ? "active" : ""} onClick={() => setActivePanel("today")} type="button"><Sparkles size={16} />스타일</button>
          <button className={activePanel === "photo" ? "active" : ""} onClick={() => setActivePanel("photo")} type="button"><Camera size={16} />사진</button>
          <button className={activePanel === "ranking" ? "active" : ""} onClick={() => setActivePanel("ranking")} type="button"><Trophy size={16} />랭킹</button>
          <button className={activePanel === "all" ? "active" : ""} onClick={() => setActivePanel("all")} type="button"><LayoutGrid size={16} />전체보기</button>
        </nav>
        <div className="header-actions">
          <button className="status-pill" onClick={() => setActivePanel("all")} type="button"><UserRound size={15} />사용자 정보</button>
          <button className="settings-bubble" onClick={() => setActivePanel("settings")} type="button" aria-label="설정"><Settings size={24} /><span>설정</span></button>
        </div>
      </header>

      {activePanel === "home" && (
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

      {showAll && <ProfileDock t={t} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />}

      {showToday && activePanel !== "home" && <section id="studio" className="hero">
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

      {showAll && <GameLayer t={t} game={game} wardrobe={wardrobe} savedLooks={savedLooks} />}
      {showAll && <FeatureShowcase t={t} />}
      {showAll && <RealLifeExamples t={t} />}

      {(activePanel === "wardrobe" || showAll) && <section id="wardrobe" className="wardrobe glass panel-view">
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
      {eventOpen && <EventPopup onClose={() => setEventOpen(false)} />}

      {(activePanel === "looks" || showAll) && <section id="looks" className="lookbook panel-view">
        {savedLooks.length ? savedLooks.map((look) => (
          <button className="saved-look glass" key={look.id} onClick={() => { setFit(look.fit); setMood(look.mood); showToast(t("loaded")); }} type="button">
            <MiniFit fit={look.fit} />
            <strong>{look.recommendation.name}</strong>
            <span>{t(look.mood)}</span>
          </button>
        )) : <div className="saved-look glass empty">{t("emptyLooks")}</div>}
      </section>}

      {activePanel === "customize" && <CustomizePanel t={t} theme={theme} setTheme={setTheme} mood={mood} setMood={setMood} fit={fit} bodyProfile={bodyProfile} setBodyProfile={setBodyProfile} persist={persist} />}

      {activePanel === "photo" && <PhotoTryOnPage t={t} onUpload={() => fileInputRef.current?.click()} wardrobe={wardrobe} />}

      {activePanel === "ranking" && <RankingBoard t={t} game={game} scores={scores} wardrobe={wardrobe} savedLooks={savedLooks} />}

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
      {showAll && <PlatformLayer t={t} wardrobe={wardrobe} savedLooks={savedLooks} fit={fit} />}
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
    <main className="entry-screen">
      <section className="entry-card auth-card">
        <div className="auth-hero">
          <div className="brand-lockup"><span>MF</span><strong>{t("brand")}</strong></div>
          <h1>{t("authTitle")}</h1>
          <p>{t("authLead")}</p>
          <p className="notice">{t("guestNotice")}</p>
          <div className="language-options compact-language">
            <button onClick={() => setLanguage("ko")} type="button"><Globe2 />{t("korean")}</button>
            <button onClick={() => setLanguage("en")} type="button"><Globe2 />{t("english")}</button>
          </div>
        </div>
        <form className="auth-form" onSubmit={onAccount}>
          <p className="eyebrow">{t("accountMode")}</p>
          <label><span>{t("email")}</span><input name="email" type="email" autoComplete="email" /></label>
          <label><span>{t("password")}</span><input name="password" type="password" autoComplete="current-password" /></label>
          <button className="primary" type="submit"><Mail size={16} />{t("signIn")}</button>
          <button className="secondary" type="button">{t("socialLogin")}</button>
          <button className="text-button" type="button">{t("resetPassword")}</button>
          <button className="guest-button" onClick={onGuest} type="button">{t("guestMode")}</button>
          <p className="notice">{t("secureNotice")}</p>
        </form>
      </section>
    </main>
  );
}

function SketchHome({ setActivePanel, recommendation, scores, game, mood, t, onEvent }) {
  return (
    <section className="sketch-home image-map-home panel-view" aria-label="골라줄개 홈">
      <img className="sketch-reference" src="/home-main-art.png" alt="골라줄개 메인 화면" />
      <button className="map-hotspot map-event" onClick={onEvent} type="button" aria-label="이벤트 열개" />
    </section>
  );
}

function GollaJulGaeMascot() {
  return <img className="golla-mascot" src="/gollajulgae-mascot.png" alt="선글라스와 스카프를 한 골라줄개" />;
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
        <img src="/event-cloud-card.png" alt="" />
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

function PhotoTryOnPage({ t, onUpload, wardrobe }) {
  const sample = wardrobe[0];
  return (
    <section className="soft-page photo-page panel-view">
      <div className="soft-page-copy">
        <p className="eyebrow">photo try-on</p>
        <h2>사진을 넣으면 옷 타입, 색, 패턴, 분위기를 읽어줘요.</h2>
        <p>업로드한 옷 사진을 바탕으로 비슷한 옷장 아이템과 더 잘 어울리는 스타일을 제안해요.</p>
        <button className="primary" onClick={onUpload} type="button"><Upload size={17} />사진 올리기</button>
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
        ["balanced", t("balanced")],
        ["slim", t("slim")],
        ["upper", t("upper")],
        ["lower", t("lower")],
        ["softCurve", t("softCurve")],
      ]} value={bodyProfile.bodyType} onChange={(value) => update({ bodyType: value })} />
      <Segment label={t("skinTone")} items={[
        ["bright", t("bright")],
        ["medium", t("medium")],
        ["deep", t("deep")],
        ["cool", t("cool")],
        ["warm", t("warm")],
      ]} value={bodyProfile.skinTone} onChange={(value) => update({ skinTone: value })} />
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
          <label><span>{t("itemName")}</span><input name="name" placeholder="Cashmere knit, satin blazer" /></label>
          <label><span>{t("category")}</span><select name="category">{categories.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></label>
          <label><span>{t("season")}</span><input name="season" placeholder="spring / summer / fall / winter" /></label>
          <label><span>{t("color")}</span><input name="color" type="color" defaultValue="#eadcc7" /></label>
          <label><span>{t("vibe")}</span><input name="vibe" defaultValue={t(mood)} /></label>
          <label><span>{t("occasion")}</span><input name="occasion" placeholder="daily, date, office, campus" /></label>
          <label className="wide-field"><span>{t("styleCategory")}</span><input name="styleCategory" placeholder="quiet luxury, clean fit, street, cozy" /></label>
          <label className="photo-upload wide-field">
            <span><Camera size={18} />{t("upload")}</span>
            <input name="photo" type="file" accept="image/*" />
          </label>
        </div>
        <div className="option-block">
          <strong>{t("fitType")}</strong>
          <div className="icon-options">
            {["regularFit", "slimFit", "oversizedFit", "croppedFit", "wideFit"].map((key) => (
              <label key={key}>
                <input name="fitType" type="radio" value={key} defaultChecked={key === "regularFit"} />
                <span><Shirt size={16} />{t(key)}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="option-block">
          <strong>{t("clothingType")}</strong>
          <div className="icon-options">
            {["knit", "shirt", "blazer", "denim", "skirt", "sneakers"].map((key) => (
              <label key={key}>
                <input name="clothingType" type="radio" value={key} defaultChecked={key === "blazer"} />
                <span><Sparkles size={16} />{t(key)}</span>
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
  const avatarStyle = avatarVariables(bodyProfile);
  const label = (slot, part) => `${t(part)} · ${fit[slot]?.name || t(slot)}`;
  return (
    <div className={`fashion-avatar ${mood} body-${bodyProfile.bodyType}`} style={avatarStyle}>
      <i className="avatar-glow" />
      <i className="head" /><i className="neck" />
      <i className="torso wear-part" data-tooltip={label("tops", "partTops")} style={{ "--cloth": fit.tops?.color }} />
      <i className="outer left wear-part" data-tooltip={label("outerwear", "partOuterwear")} style={{ "--cloth": fit.outerwear?.color }} />
      <i className="outer right wear-part" data-tooltip={label("outerwear", "partOuterwear")} style={{ "--cloth": fit.outerwear?.color }} />
      <i className="arm left" /><i className="arm right" />
      <i className="bottom wear-part" data-tooltip={label("bottoms", "partBottoms")} style={{ "--cloth": fit.bottoms?.color }} />
      <i className="leg left" /><i className="leg right" />
      <i className="shoe left wear-part" data-tooltip={label("shoes", "partShoes")} style={{ "--cloth": fit.shoes?.color }} />
      <i className="shoe right wear-part" data-tooltip={label("shoes", "partShoes")} style={{ "--cloth": fit.shoes?.color }} />
      <i className="floor" />
    </div>
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
  const level = Math.floor(game.xp / 180) + 1;
  const progress = game.xp % 180;
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
        <article><Sparkles size={18} /><span>{t("fashionXp")}</span><strong>{game.xp}</strong><i style={{ "--xp": `${(progress / 180) * 100}%` }} /></article>
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
      stat: strongestCategory,
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

function loadStoredState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function normalizeBodyProfile(profile = {}) {
  return {
    gender: profile.gender || "neutral",
    bodyType: profile.bodyType || "balanced",
    height: Number(profile.height) || 165,
    shoulder: Number(profile.shoulder) || 42,
    waist: Number(profile.waist) || 27,
    torsoLength: Number(profile.torsoLength) || 54,
    legLength: Number(profile.legLength) || 92,
    legRatio: Number(profile.legRatio) || 52,
    skinTone: profile.skinTone || "medium",
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
  const shoulderBoost = (bodyType === "upper" ? 24 : bodyType === "slim" ? -12 : bodyType === "softCurve" ? 8 : 0) + genderBoost;
  const hipBoost = bodyType === "lower" || bodyType === "softCurve" ? 22 : bodyType === "slim" ? -10 : profile.gender === "male" ? -4 : 0;
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
  return {
    "--avatar-scale": heightScale,
    "--avatar-shoulder": `${126 + shoulderBoost + (profile.shoulder - 42) * 2}px`,
    "--avatar-waist": `${Math.min(140, Math.max(82, waistWidth))}px`,
    "--avatar-torso": `${Math.min(184, Math.max(132, torsoHeight))}px`,
    "--avatar-hip": `${130 + hipBoost + (profile.waist - 27) * 1.2}px`,
    "--avatar-leg": `${Math.min(136, Math.max(96, legHeight))}px`,
    "--avatar-skin": skinMap[profile.skinTone] || skinMap.medium,
  };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

createRoot(document.getElementById("root")).render(<App />);
