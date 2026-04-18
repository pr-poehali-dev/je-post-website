import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  login: string;
  password: string;
  isAdmin: boolean;
  avatar: string;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const ADMIN_USER: User = {
  id: "admin",
  name: "Denis Admin",
  login: "denis.121212ww@gmail.com",
  password: "haffoer25",
  isAdmin: true,
  avatar: "D",
};

const DEMO_POSTS: Post[] = [
  {
    id: "post-1",
    authorId: "admin",
    authorName: "Denis Admin",
    authorAvatar: "D",
    title: "Добро пожаловать в JE post!",
    content:
      "JE post — это площадка для свободных мыслей, идей и историй. Публикуй что угодно — от коротких заметок до длинных эссе. Регистрируйся и начинай писать прямо сейчас!",
    tag: "Анонс",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: [],
    comments: [],
  },
  {
    id: "post-2",
    authorId: "admin",
    authorName: "Denis Admin",
    authorAvatar: "D",
    title: "Как писать хорошие посты?",
    content:
      "Хороший пост — это прежде всего искренность. Пиши о том, что тебя по-настоящему волнует. Читатели чувствуют подлинный интерес автора и отвечают на него лайками и комментариями.",
    tag: "Советы",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    likes: [],
    comments: [],
  },
];

const S_USERS = "jepost_users";
const S_POSTS = "jepost_posts";
const S_SESSION = "jepost_session";

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(S_USERS);
    const list: User[] = raw ? JSON.parse(raw) : [];
    if (!list.find((u) => u.id === "admin")) return [ADMIN_USER, ...list];
    return list;
  } catch { return [ADMIN_USER]; }
}

function saveUsers(users: User[]) {
  localStorage.setItem(S_USERS, JSON.stringify(users));
}

function loadPosts(): Post[] {
  try {
    const raw = localStorage.getItem(S_POSTS);
    return raw ? JSON.parse(raw) : DEMO_POSTS;
  } catch { return DEMO_POSTS; }
}

function savePosts(posts: Post[]) {
  localStorage.setItem(S_POSTS, JSON.stringify(posts));
}

function loadSession(): string | null {
  return localStorage.getItem(S_SESSION);
}

function saveSession(id: string | null) {
  if (id) localStorage.setItem(S_SESSION, id);
  else localStorage.removeItem(S_SESSION);
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function avatarGradient(letter: string) {
  const g = ["from-purple-500 to-pink-500","from-cyan-500 to-blue-500","from-orange-500 to-red-500","from-green-500 to-teal-500","from-yellow-500 to-orange-500"];
  return g[letter.charCodeAt(0) % g.length];
}

const TAGS = ["Мысли", "Технологии", "Лайфстайл", "Советы", "Анонс", "Разное"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ letter, size = "md" }: { letter: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-sm" : size === "lg" ? "w-14 h-14 text-2xl" : "w-10 h-10 text-base";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${avatarGradient(letter)} flex items-center justify-center font-bold text-white font-montserrat shrink-0`}>
      {letter.toUpperCase()}
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (u: User) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  function submit() {
    setError("");
    const users = loadUsers();
    if (tab === "login") {
      const user = users.find((u) => u.login.toLowerCase() === login.trim().toLowerCase() && u.password === password);
      if (!user) { setError("Неверный логин или пароль"); return; }
      saveSession(user.id);
      onSuccess(user);
    } else {
      if (!name.trim()) { setError("Введи имя"); return; }
      if (!login.trim()) { setError("Введи email или телефон"); return; }
      if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
      if (users.find((u) => u.login.toLowerCase() === login.trim().toLowerCase())) { setError("Логин уже занят"); return; }
      const newUser: User = { id: generateId(), name: name.trim(), login: login.trim(), password, isAdmin: false, avatar: name.trim()[0] };
      saveUsers([...users, newUser]);
      saveSession(newUser.id);
      onSuccess(newUser);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="gradient-border rounded-2xl p-[1px]">
          <div className="bg-[hsl(240,12%,9%)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-montserrat font-bold text-xl text-white">{tab === "login" ? "Вход в аккаунт" : "Регистрация"}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><Icon name="X" size={20} /></button>
            </div>

            <div className="flex bg-[hsl(240,10%,14%)] rounded-xl p-1 mb-4">
              {(["login","register"] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold font-montserrat transition-all ${tab === t ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white" : "text-gray-400 hover:text-white"}`}>
                  {t === "login" ? "Войти" : "Создать аккаунт"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {tab === "register" && (
                <input className="w-full bg-[hsl(240,10%,14%)] border border-[hsl(240,10%,20%)] rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Твоё имя" value={name} onChange={(e) => setName(e.target.value)} />
              )}
              <input className="w-full bg-[hsl(240,10%,14%)] border border-[hsl(240,10%,20%)] rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Email или номер телефона" value={login} onChange={(e) => setLogin(e.target.value)} />
              <div className="relative">
                <input type={showPass ? "text" : "password"}
                  className="w-full bg-[hsl(240,10%,14%)] border border-[hsl(240,10%,20%)] rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-red-400 text-sm flex items-center gap-1.5"><Icon name="AlertCircle" size={14} />{error}</p>}

            <button onClick={submit} className="w-full mt-5 py-3 rounded-xl btn-neon font-montserrat font-semibold text-sm">
              {tab === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({ user, onClose, onCreated }: { user: User; onClose: () => void; onCreated: (p: Post) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [error, setError] = useState("");

  function create() {
    if (!title.trim()) { setError("Введи заголовок"); return; }
    if (!content.trim()) { setError("Напиши что-нибудь"); return; }
    const post: Post = {
      id: "post-" + generateId(), authorId: user.id, authorName: user.name, authorAvatar: user.avatar,
      title: title.trim(), content: content.trim(), tag,
      createdAt: new Date().toISOString(), likes: [], comments: [],
    };
    const updated = [post, ...loadPosts()];
    savePosts(updated);
    onCreated(post);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="gradient-border rounded-2xl p-[1px]">
          <div className="bg-[hsl(240,12%,9%)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-montserrat font-bold text-xl text-white">Новый пост</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><Icon name="X" size={20} /></button>
            </div>
            <div className="space-y-3">
              <input maxLength={100}
                className="w-full bg-[hsl(240,10%,14%)] border border-[hsl(240,10%,20%)] rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors font-semibold"
                placeholder="Заголовок поста" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea maxLength={2000} rows={6}
                className="w-full bg-[hsl(240,10%,14%)] border border-[hsl(240,10%,20%)] rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none scrollbar-thin"
                placeholder="О чём думаешь сегодня?..." value={content} onChange={(e) => setContent(e.target.value)} />
              <div>
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Тег</p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => (
                    <button key={t} onClick={() => setTag(t)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${tag === t ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]" : "bg-[hsl(240,10%,14%)] text-gray-400 border border-[hsl(240,10%,20%)] hover:border-purple-500"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <p className="mt-3 text-red-400 text-sm flex items-center gap-1.5"><Icon name="AlertCircle" size={14} />{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl btn-outline-neon text-sm font-montserrat">Отмена</button>
              <button onClick={create} className="flex-1 py-3 rounded-xl btn-neon text-sm font-montserrat">Опубликовать</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUser, onLike, onOpen, onCopy, copiedId }: {
  post: Post; currentUser: User | null;
  onLike: (id: string) => void; onOpen: (p: Post) => void;
  onCopy: (id: string) => void; copiedId: string | null;
}) {
  const liked = currentUser ? post.likes.includes(currentUser.id) : false;
  return (
    <div className="gradient-border rounded-2xl card-hover animate-fade-in">
      <div className="bg-[hsl(240,12%,9%)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar letter={post.authorAvatar || post.authorName[0]} size="sm" />
            <div>
              <p className="text-sm font-semibold text-white font-montserrat leading-none">{post.authorName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <span className="tag-badge">{post.tag}</span>
        </div>

        <div onClick={() => onOpen(post)} className="cursor-pointer">
          <h3 className="font-montserrat font-bold text-white text-lg mb-2 leading-snug hover:text-purple-300 transition-colors">{post.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{post.content}</p>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[hsl(240,10%,16%)]">
          <button onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${liked ? "text-pink-400 drop-shadow-[0_0_6px_rgba(244,114,182,0.6)]" : "text-gray-500 hover:text-pink-400"}`}>
            <Icon name="Heart" size={16} /><span>{post.likes.length}</span>
          </button>
          <button onClick={() => onOpen(post)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-cyan-400 transition-colors">
            <Icon name="MessageCircle" size={16} /><span>{post.comments.length}</span>
          </button>
          <div className="ml-auto">
            <button onClick={() => onCopy(post.id)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-400 transition-colors">
              <Icon name={copiedId === post.id ? "Check" : "Link"} size={14} />
              <span>{copiedId === post.id ? "Скопировано!" : "Ссылка"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Detail ──────────────────────────────────────────────────────────────

function PostDetail({ post: init, currentUser, onClose, onLike, onComment, onDeleteComment, onDeletePost }: {
  post: Post; currentUser: User | null;
  onClose: () => void; onLike: (id: string) => void;
  onComment: (postId: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onDeletePost: (id: string) => void;
}) {
  const [post, setPost] = useState(init);
  const [commentText, setCommentText] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  function refresh() {
    const fresh = loadPosts().find((p) => p.id === init.id);
    if (fresh) setPost({ ...fresh });
  }

  const liked = currentUser ? post.likes.includes(currentUser.id) : false;

  function handleLike() { onLike(post.id); setTimeout(refresh, 50); }

  function handleComment() {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText("");
    setTimeout(refresh, 50);
  }

  function handleDeleteComment(cid: string) { onDeleteComment(post.id, cid); setTimeout(refresh, 50); }

  function handleCopyLink() {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    navigator.clipboard.writeText(url).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl animate-slide-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="gradient-border rounded-2xl p-[1px] overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-[hsl(240,12%,9%)] rounded-2xl flex flex-col overflow-hidden">
            {/* Head */}
            <div className="flex items-center justify-between p-5 border-b border-[hsl(240,10%,14%)] shrink-0">
              <div className="flex items-center gap-3">
                <Avatar letter={post.authorAvatar || post.authorName[0]} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-white font-montserrat">{post.authorName}</p>
                  <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
                <span className="tag-badge">{post.tag}</span>
              </div>
              <div className="flex items-center gap-1">
                {currentUser && (currentUser.id === post.authorId || currentUser.isAdmin) && (
                  <button onClick={() => { onDeletePost(post.id); onClose(); }} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                    <Icon name="Trash2" size={16} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><Icon name="X" size={18} /></button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto scrollbar-thin flex-1 p-5">
              <h2 className="font-montserrat font-bold text-2xl text-white mb-4 leading-snug">{post.title}</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-[hsl(240,10%,14%)]">
                <button onClick={handleLike}
                  className={`flex items-center gap-2 text-sm font-semibold transition-all px-4 py-2 rounded-xl ${liked ? "bg-pink-500/15 text-pink-400 border border-pink-500/30" : "bg-[hsl(240,10%,14%)] text-gray-400 border border-transparent hover:border-pink-500/30 hover:text-pink-400"}`}>
                  <Icon name="Heart" size={16} />
                  <span>{post.likes.length} {post.likes.length === 1 ? "лайк" : post.likes.length >= 2 && post.likes.length <= 4 ? "лайка" : "лайков"}</span>
                </button>
                <button onClick={handleCopyLink}
                  className="flex items-center gap-2 text-sm font-semibold bg-[hsl(240,10%,14%)] text-gray-400 border border-transparent hover:border-purple-500/30 hover:text-purple-400 transition-all px-4 py-2 rounded-xl">
                  <Icon name={copiedLink ? "Check" : "Link"} size={16} />
                  <span>{copiedLink ? "Ссылка скопирована!" : "Скопировать ссылку"}</span>
                </button>
              </div>

              {/* Comments */}
              <div className="mt-6">
                <h3 className="font-montserrat font-bold text-white text-base mb-4 flex items-center gap-2">
                  <Icon name="MessageCircle" size={18} />
                  Комментарии <span className="text-gray-500 font-normal text-sm">({post.comments.length})</span>
                </h3>
                {post.comments.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-5 bg-[hsl(240,10%,12%)] rounded-xl">Будь первым, кто прокомментирует!</p>
                )}
                <div className="space-y-3">
                  {post.comments.map((c) => (
                    <div key={c.id} className="flex gap-3 group">
                      <Avatar letter={c.authorAvatar || c.authorName[0]} size="sm" />
                      <div className="flex-1 bg-[hsl(240,10%,14%)] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white font-montserrat">{c.authorName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">{formatDate(c.createdAt)}</span>
                            {currentUser && (currentUser.id === c.authorId || currentUser.isAdmin) && (
                              <button onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                                <Icon name="X" size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {currentUser ? (
                  <div className="flex gap-3 mt-4">
                    <Avatar letter={currentUser.avatar || currentUser.name[0]} size="sm" />
                    <div className="flex-1 flex gap-2">
                      <input
                        className="flex-1 bg-[hsl(240,10%,14%)] border border-[hsl(240,10%,20%)] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Написать комментарий..." value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleComment()} />
                      <button onClick={handleComment} disabled={!commentText.trim()}
                        className="px-4 py-2.5 rounded-xl btn-neon disabled:opacity-40 disabled:cursor-not-allowed">
                        <Icon name="Send" size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-600 text-sm mt-4 py-3 bg-[hsl(240,10%,14%)] rounded-xl">
                    Войди, чтобы оставить комментарий
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Page = "home" | "my-posts" | "profile";

export default function App() {
  const [posts, setPosts] = useState<Post[]>(loadPosts);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const id = loadSession();
    if (!id) return null;
    return loadUsers().find((u) => u.id === id) || null;
  });
  const [page, setPage] = useState<Page>("home");
  const [showAuth, setShowAuth] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Open post from URL hash
  useEffect(() => {
    function checkHash() {
      const hash = window.location.hash;
      if (hash.startsWith("#post-")) {
        const id = hash.replace("#post-", "");
        const found = loadPosts().find((p) => p.id === id);
        if (found) setOpenPost(found);
      }
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  function refreshPosts() { setPosts(loadPosts()); }

  function handleLike(postId: string) {
    if (!currentUser) { setShowAuth(true); return; }
    const updated = posts.map((p) => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(currentUser.id);
      return { ...p, likes: liked ? p.likes.filter((id) => id !== currentUser.id) : [...p.likes, currentUser.id] };
    });
    savePosts(updated);
    setPosts(updated);
  }

  function handleComment(postId: string, text: string) {
    if (!currentUser) return;
    const comment: Comment = {
      id: generateId(), postId, authorId: currentUser.id,
      authorName: currentUser.name, authorAvatar: currentUser.avatar,
      text, createdAt: new Date().toISOString(),
    };
    const updated = posts.map((p) => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p);
    savePosts(updated);
    setPosts(updated);
  }

  function handleDeleteComment(postId: string, commentId: string) {
    const updated = posts.map((p) => p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p);
    savePosts(updated);
    setPosts(updated);
  }

  function handleDeletePost(postId: string) {
    const updated = posts.filter((p) => p.id !== postId);
    savePosts(updated);
    setPosts(updated);
  }

  function handleCopy(postId: string) {
    const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
    navigator.clipboard.writeText(url).then(() => { setCopiedId(postId); setTimeout(() => setCopiedId(null), 2000); });
  }

  function openPostFn(post: Post) {
    window.location.hash = `post-${post.id}`;
    setOpenPost(post);
  }

  function closePost() {
    window.history.pushState("", document.title, window.location.pathname);
    setOpenPost(null);
  }

  function logout() { saveSession(null); setCurrentUser(null); setPage("home"); }

  const displayed = (() => {
    let list = page === "my-posts" && currentUser ? posts.filter((p) => p.authorId === currentUser.id) : posts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q));
    }
    return list;
  })();

  const allUsers = loadUsers();
  const myPosts = currentUser ? posts.filter((p) => p.authorId === currentUser.id) : [];

  return (
    <div className="min-h-screen font-golos">
      {/* Navbar */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setPage("home")} className="font-montserrat font-black text-2xl tracking-tight flex items-center gap-1">
            <span className="neon-text-purple animate-pulse-glow">JE</span>
            <span className="text-white"> post</span>
          </button>

          <nav className="hidden sm:flex items-center gap-1">
            {([["home","Главная","Home"],["my-posts","Мои посты","BookOpen"]] as const).map(([id,label,icon]) => (
              <button key={id} onClick={() => { if (id === "my-posts" && !currentUser) { setShowAuth(true); return; } setPage(id as Page); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold font-montserrat transition-all ${page === id ? "text-purple-400 bg-purple-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                <Icon name={icon} size={15} />{label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button onClick={() => setShowCreate(true)} className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl btn-neon text-sm font-montserrat">
                  <Icon name="Plus" size={15} />Написать
                </button>
                <button onClick={() => setPage("profile")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${page === "profile" ? "bg-purple-500/15 border border-purple-500/30" : "hover:bg-white/5"}`}>
                  <Avatar letter={currentUser.avatar || currentUser.name[0]} size="sm" />
                  <span className="hidden sm:block text-sm font-semibold text-white font-montserrat max-w-[100px] truncate">{currentUser.name}</span>
                  {currentUser.isAdmin && <span className="hidden sm:block text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">ADMIN</span>}
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="px-4 py-2 rounded-xl btn-neon text-sm font-montserrat">Войти</button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/5 pb-safe">
        <div className="flex items-center">
          {([["home","Главная","Home"],["my-posts","Мои посты","BookOpen"],["profile","Профиль","User"]] as const).map(([id,label,icon]) => (
            <button key={id} onClick={() => { if ((id==="my-posts"||id==="profile") && !currentUser) { setShowAuth(true); return; } setPage(id as Page); }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold font-montserrat transition-all ${page === id ? "text-purple-400" : "text-gray-500"}`}>
              <Icon name={icon} size={20} />{label}
            </button>
          ))}
          {currentUser && (
            <button onClick={() => setShowCreate(true)} className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold font-montserrat text-purple-400">
              <Icon name="PlusCircle" size={20} />Написать
            </button>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-28 sm:pb-8">

        {/* HOME */}
        {page === "home" && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold font-montserrat text-purple-400 border border-purple-500/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Живая лента постов
              </div>
              <h1 className="font-montserrat font-black text-4xl sm:text-5xl text-white mb-3 leading-tight">
                Пиши. Делись.{" "}
                <span className="neon-text-purple">Вдохновляй.</span>
              </h1>
              <p className="text-gray-400 text-base max-w-md mx-auto">Платформа для свободных мыслей и ярких идей</p>
              {!currentUser && (
                <button onClick={() => setShowAuth(true)} className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-neon font-montserrat font-bold">
                  <Icon name="Zap" size={18} />Начать писать
                </button>
              )}
            </div>

            <div className="relative mb-6">
              <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input className="w-full bg-[hsl(240,12%,9%)] border border-[hsl(240,10%,16%)] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Поиск по заголовку, тексту или тегу..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {displayed.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <Icon name="FileText" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-montserrat font-semibold">Постов не найдено</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayed.map((post) => (
                  <PostCard key={post.id} post={post} currentUser={currentUser} onLike={handleLike} onOpen={openPostFn} onCopy={handleCopy} copiedId={copiedId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY POSTS */}
        {page === "my-posts" && currentUser && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-montserrat font-bold text-2xl text-white">Мои посты</h2>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-neon text-sm font-montserrat">
                <Icon name="Plus" size={15} />Написать
              </button>
            </div>
            {displayed.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="PenLine" size={28} className="text-purple-400" />
                </div>
                <p className="font-montserrat font-bold text-white mb-2">Ты ещё не написал постов</p>
                <p className="text-gray-500 text-sm mb-5">Поделись своими мыслями с миром!</p>
                <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl btn-neon font-montserrat font-semibold">Написать первый пост</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayed.map((post) => (
                  <PostCard key={post.id} post={post} currentUser={currentUser} onLike={handleLike} onOpen={openPostFn} onCopy={handleCopy} copiedId={copiedId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {page === "profile" && currentUser && (
          <div className="animate-fade-in max-w-xl mx-auto">
            <div className="gradient-border rounded-2xl mb-5">
              <div className="bg-[hsl(240,12%,9%)] rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-5">
                  <Avatar letter={currentUser.avatar || currentUser.name[0]} size="lg" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-montserrat font-bold text-xl text-white">{currentUser.name}</h2>
                      {currentUser.isAdmin && <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30">ADMIN</span>}
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">{currentUser.login}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Постов", value: myPosts.length },
                    { label: "Лайков", value: myPosts.reduce((s,p) => s + p.likes.length, 0) },
                    { label: "Комментариев", value: myPosts.reduce((s,p) => s + p.comments.length, 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[hsl(240,10%,14%)] rounded-xl p-3 text-center">
                      <p className="font-montserrat font-black text-2xl neon-text-purple">{value}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <button onClick={logout} className="w-full py-2.5 rounded-xl text-sm font-semibold font-montserrat text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                  <Icon name="LogOut" size={15} />Выйти из аккаунта
                </button>
              </div>
            </div>

            {/* Admin panel */}
            {currentUser.isAdmin && (
              <div className="gradient-border rounded-2xl">
                <div className="bg-[hsl(240,12%,9%)] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Icon name="Shield" size={20} className="text-yellow-400" />
                    <h3 className="font-montserrat font-bold text-white text-lg">Панель администратора</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: "Постов", value: posts.length, icon: "FileText" as const },
                      { label: "Пользователей", value: allUsers.length, icon: "Users" as const },
                      { label: "Лайков", value: posts.reduce((s,p)=>s+p.likes.length,0), icon: "Heart" as const },
                      { label: "Комментариев", value: posts.reduce((s,p)=>s+p.comments.length,0), icon: "MessageCircle" as const },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="bg-[hsl(240,10%,14%)] rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                          <Icon name={icon} size={16} className="text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-montserrat font-bold text-white text-xl leading-none">{value}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Пользователи</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin">
                    {allUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-2.5 bg-[hsl(240,10%,14%)] rounded-xl">
                        <Avatar letter={u.avatar || u.name[0]} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white font-montserrat truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.login}</p>
                        </div>
                        {u.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold shrink-0">ADMIN</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guards */}
        {(page === "my-posts" || page === "profile") && !currentUser && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="Lock" size={28} className="text-purple-400" />
            </div>
            <p className="font-montserrat font-bold text-white text-xl mb-2">Нужна авторизация</p>
            <p className="text-gray-500 text-sm mb-6">Войди или зарегистрируйся, чтобы продолжить</p>
            <button onClick={() => setShowAuth(true)} className="px-6 py-3 rounded-xl btn-neon font-montserrat font-bold">Войти</button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={(user) => { setCurrentUser(user); setShowAuth(false); }} />
      )}
      {showCreate && currentUser && (
        <CreatePostModal user={currentUser} onClose={() => setShowCreate(false)} onCreated={(post) => { refreshPosts(); setShowCreate(false); openPostFn(post); }} />
      )}
      {openPost && (
        <PostDetail
          post={openPost} currentUser={currentUser}
          onClose={closePost} onLike={(id) => { handleLike(id); }}
          onComment={handleComment} onDeleteComment={handleDeleteComment}
          onDeletePost={(id) => { handleDeletePost(id); refreshPosts(); }}
        />
      )}
    </div>
  );
}
