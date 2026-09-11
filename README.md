# La Bàn DSA · DSA Compass

> Một chiếc **la bàn**, không phải chìa khóa. Công cụ dạy bạn *cách nghĩ* khi giải thuật, chứ không đưa lời giải.
>
> A **compass**, not a key. It teaches you *how to think* about algorithm problems — it never solves them for you.

Ứng dụng web song ngữ **Việt / Anh**: bản đồ tư duy, từ điển tín hiệu, chế độ dẫn lối offline, **trực quan thuật toán từng bước**, lộ trình ôn 150 câu (thời hạn & số câu **tự đặt**), và một gia sư Socratic nối tới mô hình AI chạy cục bộ.

---

## 🚀 Bắt đầu · Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

| Lệnh | Làm gì |
|---|---|
| `npm run dev` | Dev server, hot reload |
| `npm run build` | Typecheck rồi build ra `dist/` (static, deploy được lên GitHub Pages) |
| `npm run preview` | Xem thử bản build |
| `npm test` | Chạy test (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run sync` | Build, gom dữ liệu, commit & push (xem *Đồng bộ*) |

---

## 🧭 Triết lý · Philosophy

- Không có **công thức vạn năng** — đó là một định luật, không phải lỗ hổng. La bàn không đi thay bạn, nhưng ở bất kỳ điểm nào cũng chỉ được bước kế tiếp.
- Mọi thuật toán nhanh đều khai thác một **cấu trúc** trong dữ liệu. "Lãng phí" (tính lại) chỉ là dấu chân mà cấu trúc để lại.
- Tất cả quy về một động từ: **Duyệt (Traverse)**. Câu hỏi thật sự là *duyệt KHÔNG GIAN nào?* — và không gian đó thường phải tự phát minh.
- Học bằng **nén**, không bằng số lượng: đọc xong một lời giải, đừng code lại — rút đúng một dòng "đặc trưng nào của đề lẽ ra phải kích hoạt công cụ này?".

---

## 🗂️ Cấu trúc project · Project layout

```
├─ index.html              entry của Vite
├─ src/
│  ├─ main.ts              bootstrap: nạp db → ngôn ngữ/theme → mount feature
│  ├─ types.ts             domain types dùng chung
│  ├─ core/
│  │  ├─ db.ts             THE DATABASE: load/merge/export, một tài liệu JSON
│  │  ├─ storage.ts        localStorage có bọc try/catch
│  │  ├─ i18n.ts           t() / tx(), áp dụng data-i18n
│  │  ├─ theme.ts          sáng/tối
│  │  ├─ router.ts         tab Luyện tập / Lý thuyết + sub-tab
│  │  ├─ ai.ts             MỘT kết nối AI dùng chung cho cả hai vai trò
│  │  └─ dom.ts            $ / must / field / esc — không framework
│  ├─ data/                dữ liệu thuần: lc150, ladder, dictionary, guided, locales
│  ├─ features/
│  │  ├─ roadmap/          plan · order · streak · progress · leetcode · view
│  │  ├─ visualizer/       types · engine · validate · renderers · examples · aigen · library · view
│  │  ├─ tutor/            prompt · chat
│  │  ├─ theory/           map · dictionary · guided · drill · log · notes
│  │  └─ sync/             cầu nối dữ liệu ↔ file
│  └─ styles/              tokens → base → layout → components → features/*
├─ data/store.json         ← DATABASE, git version cùng code
├─ scripts/sync.mjs        đồng bộ web + database lên git
└─ tests/                  101 test cho phần logic thuần
```

**Nguyên tắc tách lớp:** model (`plan`, `streak`, `progress`, `db`) không bao giờ import view. Mutation chỉ `commit()`; db phát tín hiệu và view tự vẽ lại. Nhờ vậy phần logic test được mà không cần DOM — đó là lý do 101 test chạy trong <1s.

---

## 📚 Hai tab lớn · Two tabs

| Tab | Bên trong |
|---|---|
| **Luyện tập · Practice** | *Lộ trình 150* (kế hoạch + theo dõi + AI gia sư có lịch sử chat) · *Trực quan thuật toán* (xem / tạo bằng AI / nhập JSON / đã lưu) |
| **Lý thuyết · Theory** | Bản đồ tư duy · Từ điển tín hiệu · Dẫn lối · Luyện nén · Nhật ký · Ghi chú |

### Lộ trình 150
- **Thời hạn & số câu tự đặt** — ngày bắt đầu, ngày kết thúc, số câu/ngày, **số câu mục tiêu**. Hai trong ba là tự do, cái còn lại **tự tính**; ô suy ra có nhãn *(tự tính)*.
- **Thứ tự trộn chủ đề** — lô mỗi ngày luân phiên qua nhiều chủ đề, dễ → khó trong từng chủ đề, để không đóng khung tư duy vào một dạng bài.
- **Dải 30 ngày** — ngày liên tiếp nối liền thành một dải; kèm chuỗi hiện tại 🔥 và dài nhất.
- **Spaced repetition** 3/7/21 ngày · **radar chủ đề** · **dự báo tiến độ** bám ngày kết thúc bạn chọn.
- **Đồng bộ LeetCode** (tùy chọn) — chỉ dùng username công khai.

### Trực quan thuật toán
Xem thuật toán chạy **từng bước như debugger**. Cốt lõi: **AI sinh dữ liệu, không sinh UI** — mỗi thuật toán chỉ là JSON theo `features/visualizer/types.ts`, được validate rồi vẽ bởi một bộ renderer chung. Thêm thuật toán = thêm dữ liệu, không phải viết renderer.

Có sẵn: Trapping Rain Water · Binary Search · Two Sum · Valid Parentheses · Reverse Linked List · BFS · DFS — mỗi bài kèm "Cách nó hoạt động" song ngữ, gắn với loại quan hệ trong Từ điển tín hiệu.

Bốn tab con: **Xem** · **Tạo bằng AI** · **Nhập JSON** · **Đã lưu**. JSON sai sẽ báo **đúng trường bị lỗi** (ví dụ `steps[12].components[0].id "stack2" is not declared in the root "components" array.`) — đưa nguyên câu đó lại cho AI để nó sửa.

---

## 🤖 AI

> ⚠️ **Hai vai trò, một nguồn.** *Gia sư* chỉ **hỏi**, không bao giờ đưa lời giải. *Trình sinh trực quan* chỉ sinh JSON. Cả hai **dùng chung một endpoint/model**, cấu hình một chỗ ở **⚙ Thiết lập** — chỉ khác nhau ở prompt hệ thống.

Endpoint **OpenAI-compatible** chạy trên máy bạn: Ollama `http://localhost:11434/v1`, LM Studio `http://localhost:1234/v1`, llama.cpp, vLLM.

```bash
ollama pull qwen2.5
# bật CORS để trang gọi được:
#   Windows: $env:OLLAMA_ORIGINS="*"; ollama serve
#   macOS/Linux: OLLAMA_ORIGINS=* ollama serve
```

App **không gửi** `temperature` hay `max_tokens` — nhiều model đời mới từ chối hoặc bỏ qua hai trường này.

**Kỷ luật Socratic:** nếu một model nhỏ phá luật và tuôn ra lời giải, cách sửa là **siết chặt system prompt** (`features/tutor/prompt.ts`), không phải nới nó thành trả lời.

---

## 💾 Đồng bộ web + database lên git

Tiến độ học nằm trong `localStorage` — **git không nhìn thấy**, và một trang web thì không chạy được `git`. `scripts/sync.mjs` nối hai đầu đó.

```bash
npm run sync              # build + gom dữ liệu + commit + push
npm run sync -- --watch   # ngồi canh, hễ có bản xuất mới là đồng bộ
```

Hoặc bấm đúp **`sync.bat`** / **`sync-auto.bat`**.

Quy trình: trong app bấm **⚙ Thiết lập → Dữ liệu → 💾 Lưu ra file** → chạy `npm run sync`. Script tự nhặt file mới nhất từ **Downloads** (kể cả dạng `store (1).json`), đặt vào `data/store.json`, build lại, rồi commit **cả code lẫn database** trong một lịch sử.

- Nạp lại là **gộp (union merge)**, không ghi đè: tiến độ giữ bản đã *done*, hoạt động lấy `max` mỗi ngày, chat giữ phiên dài hơn. Làm việc trên hai máy rồi sync — không mất bên nào.
- Khi clone mới, app tự **nạp mồi từ `data/store.json`** (chỉ gộp, không bao giờ đè dữ liệu đang có trong trình duyệt).

> 🔑 **API key và token không bao giờ nằm trong `data/store.json`** — có test chứng minh điều đó. Nhưng nếu repo **public** thì lịch sử chat và ghi chú cá nhân của bạn cũng public. Script sẽ cảnh báo trước khi commit; cân nhắc repo **private** cho dữ liệu.

---

## 🧪 Test

```bash
npm test
```

101 test, chạy dưới 1 giây vì phần logic không phụ thuộc DOM:

| File | Bảo vệ điều gì |
|---|---|
| `plan.test.ts` | Suy ra ngày kết thúc ↔ số câu/ngày, phạm vi mục tiêu, dự báo tiến độ |
| `streak.test.ts` | Chuỗi ngày sống sót qua "hôm nay chưa làm", đứt khi lỡ hôm qua |
| `db.test.ts` | Union merge không làm mất việc của máy bên kia; **secret không lọt vào file** |
| `validate.test.ts` | Thông báo lỗi nêu **đúng tên trường** để đưa lại cho AI |
| `examples.test.ts` | Trace ra **đúng đáp án** (rain water = 6, DFS = A C F B E D) và không gộp vòng lặp |
| `i18n.test.ts` | `vi` và `en` khớp key, placeholder và thẻ HTML cân bằng |
| `order.test.ts` | Thứ tự trộn chủ đề, dễ→khó, phủ đủ 150 câu |

---

## 🔐 Quyền riêng tư · Privacy

Mọi dữ liệu nằm trong `localStorage` của chính trình duyệt này và trong `data/store.json` của repo bạn. Chat và việc sinh trace chỉ đi tới endpoint AI **bạn tự cấu hình**. Thiết lập AI (kể cả API key) **không** được đồng bộ.

---

## 📜 Lịch sử

v1 là **một file HTML duy nhất** (~3.000 dòng). Bản đó vẫn lấy lại được:

```bash
git show v1-single-file:dsa-compass.html > dsa-compass.html
```

---

Vanilla TypeScript + Vite. Không framework UI — render bằng template string, đúng như bản gốc, nhưng đã tách module và có kiểu. Font: Newsreader + Be Vietnam Pro. Tôn trọng `prefers-reduced-motion`, sáng/tối, responsive tới mobile.
