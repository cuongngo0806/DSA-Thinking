# La Bàn DSA · DSA Compass

> Một chiếc **la bàn**, không phải chìa khóa. Công cụ dạy bạn *cách nghĩ* khi giải thuật, chứ không đưa lời giải.
>
> A **compass**, not a key. A tool that teaches you *how to think* about algorithm problems — it never solves them for you.

Ứng dụng web **một file duy nhất**, chạy offline, giao diện song ngữ **Việt / Anh**. Gồm bản đồ tư duy, từ điển tín hiệu, chế độ dẫn lối, **trực quan thuật toán từng bước**, lộ trình ôn 150 câu (thời gian & số câu **cài đặt được**), và một gia sư Socratic nối tới mô hình AI chạy cục bộ trên máy bạn.

A **single self-contained** web app, runs offline, bilingual **Vietnamese / English**. It bundles a thinking map, a trigger dictionary, a guided decision tree, a **step-by-step algorithm visualizer**, a 150-problem study roadmap (**configurable** duration & problem count), and a Socratic tutor that connects to a local AI model on your machine.

---

## 🚀 Cách chạy · How to run

Không cần cài đặt, không cần build.

**Cách 1 — mở trực tiếp:** double-click `dsa-compass.html` (hoặc kéo vào trình duyệt). Đủ dùng cho mọi tính năng *trừ* chat AI (xem lưu ý CORS bên dưới).

**Cách 2 — chạy qua máy chủ tĩnh** (khuyến nghị nếu dùng gia sư AI):

```bash
# Python
python -m http.server 8000
# rồi mở http://localhost:8000/dsa-compass.html

# hoặc Node
npx serve .
```

---

## 🧭 Triết lý · Philosophy

- Không có **công thức vạn năng** — đó là một định luật, không phải lỗ hổng. La bàn không đi thay bạn, nhưng ở bất kỳ điểm nào cũng chỉ được bước kế tiếp.
- Mọi thuật toán nhanh đều khai thác một **cấu trúc** trong dữ liệu. "Lãng phí" (tính lại) chỉ là dấu chân mà cấu trúc để lại.
- Tất cả quy về một động từ: **Duyệt (Traverse)**. Câu hỏi thật sự là *duyệt KHÔNG GIAN nào?* — và không gian đó thường phải tự phát minh.
- Học bằng **nén**, không bằng số lượng: đọc xong một lời giải, đừng code lại — rút đúng một dòng "đặc trưng nào của đề lẽ ra phải kích hoạt công cụ này?".

---

## 🧭 Cấu trúc app · App structure

Ứng dụng chia làm **hai tab lớn**:

| Tab | Dành cho | Bên trong |
|---|---|---|
| **Luyện tập · Practice** | Làm việc hằng ngày | *Lộ trình 150* (kế hoạch + theo dõi + **AI gia sư** có lịch sử chat) · *Trực quan thuật toán* (xem / **tạo bằng AI** / nhập JSON / đã lưu) |
| **Lý thuyết · Theory** | Nền tảng tư duy | Bản đồ tư duy · Từ điển tín hiệu · Dẫn lối · Luyện nén · Nhật ký · Ghi chú |

> ⚠️ **Hai vai trò AI, một nguồn · Two AI roles, one source.** *AI gia sư* (trong Lộ trình 150) chỉ **hỏi**, không bao giờ đưa lời giải. *AI trực quan* (tab Tạo bằng AI) chỉ **sinh dữ liệu JSON**. Cả hai **dùng chung một endpoint/model**, cấu hình một chỗ ở **⚙ Thiết lập** trên thanh trên cùng — chúng chỉ khác nhau ở **prompt hệ thống**.

### Tab Lý thuyết · Theory tab

| Phần | Section | Dùng để làm gì |
|---|---|---|
| **Bản đồ tư duy** | Thinking Map | 4 câu hỏi la bàn (câu *thượng nguồn* hỏi trước) + thang chi phí tư duy 5 bậc. Bấm từng bậc để xem câu hỏi kích hoạt, "vì sao công cụ này", và "duyệt không gian nào". |
| **Từ điển tín hiệu** | Trigger Dictionary | 14 mục cô đọng: tín hiệu trong đề → công cụ + vì sao. Lọc theo loại quan hệ. **Tự thêm mục của riêng bạn** (lưu cục bộ) — đây là phần cốt lõi để bạn tập tự đi. |
| **Dẫn lối** | Guided | Cây quyết định **offline, không cần AI**. Bắt đầu từ "đầu ra đòi kiểu thông tin gì?", đi tới một **GIẢ THUYẾT** (không phải đáp án) kèm câu tự kiểm chứng. |
| **Luyện nén** | Compression Drill | Rút ngẫu nhiên một tín hiệu; tự nói *công cụ* và *vì sao* trước khi lật. |
| **Nhật ký** | Log | Ghi "bài toán tôi va phải" + tín hiệu rút ra. Lưu cục bộ. |
| **Ghi chú** | Notes | Các lưu ý thành thật về phương pháp. |

---

## 🗺️ Lộ trình 150 · Roadmap 150 (Top Interview 150)

Một kế hoạch ôn luyện [**Top Interview 150**](https://leetcode.com/studyplan/top-interview-150/) đặt ngay trong ứng dụng, **thời hạn do bạn đặt** — vẫn theo tinh thần *nén, không phải cày*: mỗi câu giải xong hãy rút **một dòng tín hiệu** ("đặc trưng nào lẽ ra phải kích hoạt công cụ này?").

A built-in study plan for the **Top Interview 150** list — still in the compass spirit: for each solved problem, compress it into **one line of signal**.

### Tính năng · Features

> ⚙ **Tất cả cấu hình kế hoạch** (ngày bắt đầu, ngày kết thúc, số câu/ngày, **số câu mục tiêu**, username LeetCode) nằm trong khối **⚙ Kế hoạch & đồng bộ** ngay đầu tab *Lộ trình 150* — bấm vào dòng tóm tắt để mở. · All plan settings live in the **⚙ Plan & sync** block at the top of the Roadmap tab.
- **Bàn làm việc 2 cột · Two-column workbench** — không cần lướt: bên **trái** là *Hôm nay cần giải* + *Ôn lại*, bên **phải** là gia sư AL (*La bàn sống*) luôn kề bên để hỏi ngay. Thống kê, radar và *toàn bộ 150 câu* nằm gọn sau tab **Tiến độ / Toàn bộ 150 câu**; thiết lập AI ẩn sau nút ⚙. On narrow screens the two columns stack.
- **Số câu mục tiêu · Target count** (trong **⚙ Kế hoạch & đồng bộ**, ngay dưới dải 30 ngày) — không bắt buộc làm hết 150. Đặt **số câu mục tiêu** (ví dụ 75) thì kế hoạch, tiến độ, lô hàng ngày và radar chủ đề chỉ tính trên **N câu đầu trong thứ tự kế hoạch** (đã trộn chủ đề sẵn).
- **Thời hạn tự đặt · Your own deadline** (cùng chỗ đó) — không còn mốc 2 tháng cố định. Đặt **ngày bắt đầu**, **ngày kết thúc** và **số câu/ngày**; hai trong ba là tự do, cái còn lại **tự tính** (sửa ngày kết thúc → số câu/ngày đổi theo, và ngược lại), ô được suy ra có nhãn *(tự tính)*. Mọi dự báo tiến độ đều bám ngày kết thúc bạn chọn.
- **Dải 30 ngày · 30-day strip** — một hàng ngang gọn ngay dưới thanh tiến độ: 30 ngày gần nhất, ngày có hoạt động tô đậm dần theo mức độ, **các ngày liên tiếp nối liền thành một dải**, ngày trong kế hoạch có viền, hôm nay ở cuối và được khoanh. Kèm *chuỗi hiện tại* 🔥 và *dài nhất*. (Thay cho lịch tháng + heatmap cũ — hai thứ đó hiển thị trùng thông tin.) · One compact row replacing the old month calendar + heatmap, which showed the same thing twice.
- **Kế hoạch hằng ngày trộn chủ đề · Interleaved daily plan** — lô mỗi ngày theo *số câu/ngày* (mặc định 3/ngày ≈ 50 ngày cho 150 câu). Lô mỗi ngày **luân phiên qua nhiều chủ đề** (round-robin) và tăng độ khó nhẹ từ dễ → khó, để **không đóng khung tư duy** vào một dạng bài duy nhất. Danh sách *Toàn bộ 150 câu* vẫn nhóm theo chủ đề để dễ tra cứu.
- **Check-off + streak** — tick từng câu là xong; **chuỗi ngày** (streak) và **dải 30 ngày** theo dõi đều đặn.
- **Đồng bộ LeetCode · Sync** — nhập **username công khai** rồi bấm *Đồng bộ*: app đọc các bài **Accepted gần đây** qua một API cộng đồng và tự tick các câu khớp. Không cần mật khẩu, không gửi dữ liệu riêng tư. Nếu API lỗi/offline → cứ dùng check-off thủ công.
- **Spaced repetition · Ôn lại** — câu đã giải tự quay lại sau **3 / 7 / 21 ngày**; đánh dấu *Chưa chắc* sẽ được đẩy lịch ôn sớm hơn.
- **Đánh giá độ chắc · Confidence** — mỗi câu: *Chưa chắc / Chắc*, dùng để ưu tiên ôn.
- **Ghi chú nén · Compression note** — một ô một dòng cho mỗi câu, nối thẳng với triết lý Từ điển tín hiệu.
- **Radar chủ đề · Weak-topic map** — 23 nhóm chủ đề, nhóm yếu nhất nổi lên đầu để bạn tái cân bằng.
- **Dự báo tiến độ · Adaptive ETA** — tính lại *cần bao nhiêu câu/ngày* và *ngày dự kiến xong* từ nhịp thực tế so với **ngày kết thúc bạn đặt**.

> **Lưu ý sync · Sync note:** LeetCode không có API chính thức thân thiện CORS cho danh sách đã giải, nên đồng bộ dùng một API cộng đồng công khai chỉ với username của bạn. Nó có thể tạm lỗi khi dịch vụ miễn phí đó gián đoạn — khi ấy check-off thủ công vẫn hoạt động 100% offline.

Toàn bộ tiến độ, streak, ghi chú, cấu hình kế hoạch đều lưu trong `localStorage` của trình duyệt này.

---

## 🎬 Trực quan thuật toán · Algorithm visualizer

Xem một thuật toán chạy **từng bước như debugger** — cùng một tinh thần la bàn: ở mỗi bước hãy tự hỏi *đang duyệt KHÔNG GIAN nào?*. Tích hợp từ dự án [dsa-visualization](https://github.com/cuongngo0806/dsa-visualization) và viết lại bằng vanilla JS để chạy trong cùng một file, không cần build.

Watch an algorithm run **step by step like a debugger** — same compass spirit: at each step ask *which space am I traversing?*. Ported from [dsa-visualization](https://github.com/cuongngo0806/dsa-visualization) into vanilla JS so it runs inside the one file, no build.

### Có sẵn · Built-in
Trapping Rain Water (monotonic stack) · Binary Search · Two Sum (hashmap) · Valid Parentheses (stack) · Reverse Linked List · BFS · DFS — mỗi bài kèm panel **Cách nó hoạt động** (trực giác / cách làm / vì sao đúng / bẫy) gắn với loại quan hệ trong Từ điển tín hiệu.

### 4 tab con · Four sub-tabs

- **Xem · View** — trình phát: chọn thuật toán, chạy từng bước, xem mã nguồn tô sáng dòng đang chạy.
- **Tạo bằng AI · Create with AI** — dán *đề bài + thuật toán + đầu vào cụ thể + mã nguồn*, bấm **Sinh bằng AI**. Mô hình mô phỏng code từng bước và trả về JSON; app **kiểm tra tính hợp lệ theo từng trường** rồi mở luôn trong trình phát và tự lưu.
- **Nhập JSON · Import JSON** — dán JSON hoặc chọn file `.json`. Dùng khi bạn không có API key: bấm **Sao chép prompt** ở tab Tạo, dán vào Claude, rồi mang JSON về đây.
- **Đã lưu · Saved** — danh sách gom nhóm theo tên bài, có tìm kiếm, **Mở / Xuất / Xóa**, và **Xuất tất cả**.

### Cấu hình AI · AI settings

Mở **⚙ Thiết lập → tab AI** ở thanh trên cùng (hoặc nút ⚙ trong khung chat / nút *Mở thiết lập AI* ở tab Tạo). Một nơi duy nhất cho **cả hai** vai trò AI: Base URL · Model · API key · **Nên chọn model mạnh về code, ngữ cảnh lớn.

> App **không gửi** `temperature` hay `max_tokens` — nhiều model đời mới từ chối hoặc bỏ qua hai trường này. · The app sends neither `temperature` nor `max_tokens`; many newer models reject or ignore them.

> Nếu JSON sai, app báo **đúng trường bị lỗi** (ví dụ `steps[12].components[0].id "stack2" is not declared in the root "components" array.`) thay vì crash — cứ đưa thông báo đó lại cho AI để nó sửa.

### Điều khiển · Controls

| Hành động · Action | Phím · Key |
|---|---|
| Chạy / Dừng · Play / Pause | `Space` |
| Bước lùi / tiến · Prev / Next | `←` / `→` |
| Về đầu / cuối · First / Last | `Home` / `End` |
| Tốc độ · Speed | nút 0.5× / 1× / 2× |
| Nhảy tới bước bất kỳ · Jump | kéo thanh trượt · drag the scrubber |

> Bàn phím chỉ hoạt động khi con trỏ đang ở trong khu vực trực quan. · Keyboard shortcuts act only while the pointer is inside the visualizer.
>
> Lời tường thuật từng bước hiển thị bằng **tiếng Anh** (theo nguồn thuật toán); phần khung, nhãn và "Cách nó hoạt động" đổi theo VI/EN. · Step narration stays in **English** (from the algorithm source); chrome, labels and "How it works" follow the VI/EN toggle.

---

### Nút trên thanh điều hướng · Toolbar buttons
- **⚙** — thiết lập nguồn AI (dùng chung cho cả gia sư và trình sinh trực quan).
- **EN / VI** — đổi ngôn ngữ toàn bộ giao diện. Gia sư AI cũng **trả lời theo đúng ngôn ngữ đang chọn**.
- **☾ / ☀** — đổi giao diện tối / sáng.

Mặc định: **tiếng Anh + nền tối**. Mọi lựa chọn được nhớ trong trình duyệt.

---

## 🤖 Gia sư AI · The AI tutor

> Gia sư và trình sinh trực quan **dùng chung** nguồn AI cấu hình ở **⚙ Thiết lập**; xem mục trên.

### Lịch sử trò chuyện · Chat history
Ở đầu khung chat có 3 nút: **＋** tạo cuộc trò chuyện mới · **🕘** mở danh sách lịch sử (bấm để quay lại, có nút xóa từng cuộc) · **⚙** thiết lập endpoint. Mỗi cuộc được **tự đặt tên theo câu hỏi đầu tiên** và lưu trong trình duyệt.

At the top of the chat: **＋** new conversation · **🕘** history list (click to reopen, delete per item) · **⚙** endpoint settings. Each conversation is auto-titled from its first message and stored locally.

Gia sư gọi một endpoint **OpenAI-compatible** chạy trên máy bạn. Mở **⚙ Thiết lập** (thanh trên cùng) và điền:

- **Base URL** — ví dụ:
  - Ollama: `http://localhost:11434/v1`
  - LM Studio: `http://localhost:1234/v1`
  - llama.cpp / vLLM: URL tương ứng của bạn
- **Tên model** — ví dụ `llama3.1`, `qwen2.5`, ...
- **API key** — để trống nếu endpoint không yêu cầu.

Bấm **Lưu & kiểm tra kết nối** để xác nhận trạng thái.

### Ví dụ nhanh với Ollama

```bash
ollama pull qwen2.5
# Bật CORS để trang gọi được endpoint:
#   Windows (PowerShell):  $env:OLLAMA_ORIGINS="*"; ollama serve
#   macOS/Linux:           OLLAMA_ORIGINS=* ollama serve
```

> ⚠️ **CORS:** khi mở bằng `file://`, trình duyệt có thể chặn request tới `localhost`. Cách xử lý: bật CORS ở endpoint (`OLLAMA_ORIGINS=*`) **hoặc** chạy trang qua máy chủ tĩnh (mục *Cách chạy*).

### Kỷ luật Socratic
Gia sư **không bao giờ đưa lời giải, mã nguồn, hay gọi tên pattern** — chỉ hỏi một câu mỗi lượt để bạn tự tìm ra. Nếu một mô hình nhỏ phá kỷ luật và tuôn ra lời giải, hãy **siết chặt system prompt**, đừng nới nó thành trả lời.

---

## 🔄 Đồng bộ Git · Git sync

Mở **⚙ Thiết lập → Đồng bộ Git**.

> **Vì sao cần token trong khi file nằm sẵn trong repo?** Trang chạy trong **sandbox của trình duyệt**: nó không gọi được lệnh `git`, không ghi được vào thư mục repo, và không biết mình đang nằm trong một repo. Nó chỉ gửi được HTTP — nên **ghi** lên GitHub bắt buộc phải qua API có xác thực. Đọc thì không.
>
> **Why a token when the file already sits in the repo?** The page runs in the browser sandbox: it cannot invoke `git`, cannot write into the repo folder, and has no idea it lives in one. Only HTTP — so *writing* to GitHub needs auth. Reading does not.

### Hai đường · Two routes

**Nếu máy bạn đã có git và repo thì không cần token gì cả** — cứ `git push` như bình thường. Push từ terminal còn an toàn hơn push từ app (có diff, có merge, không ghi đè mù). Token chỉ dành cho máy **không cài git**.

| Cách | Cần token? | Dùng khi |
|---|---|---|
| **⬇ Kéo về** | **Không** (repo public) | Lấy dữ liệu về máy mới. Đọc thẳng `raw.githubusercontent.com`. Repo private thì mới cần token. |
| **💾 Tải file / 📂 Nạp từ file** | **Không** | Hoàn toàn offline. Tải `dsa-compass-data.json` về, đặt vào thư mục repo rồi `git commit` như bình thường — **đây là cách thay cho “đẩy lên” nếu bạn không muốn token.** |
| **⬆ Đẩy lên** | **Có** | Muốn app tự commit lên GitHub, không đụng tới terminal. |

Open **⚙ Settings → Git sync**. The app pushes/pulls one JSON file through the **GitHub Contents API** — no local `git`, no server.

| Ô | Ý nghĩa |
|---|---|
| **Repo** | `owner/name` (dán cả URL GitHub cũng được, app tự cắt) |
| **File dữ liệu · Data file** | mặc định `dsa-compass-data.json` — tiến độ học của bạn |
| **File source code** | mặc định `dsa-compass.html` — chính phần mềm |
| **Nhánh · Branch** | mặc định `main` |
| **Token** | fine-grained PAT |

- **⬆ Đẩy lên** (cần token) — ghi dữ liệu thành một commit qua **GitHub Contents API** (tự lấy `sha` nếu file đã tồn tại nên ghi đè an toàn). Tích **Đẩy cả source code** thì đẩy luôn `dsa-compass.html` — app tự đọc source của chính nó. Nếu nội dung không đổi thì **bỏ qua**, không tạo commit rỗng.
- **⬇ Tải code từ repo** — lấy bản `dsa-compass.html` đang nằm trên repo về máy (trình duyệt không ghi đè được file của bạn, nên nó tải xuống để bạn tự thay). Giống hệt bản đang chạy thì báo "code đã trùng".
- **⬇ Kéo về** (không cần token với repo public) — tải về rồi **gộp (union merge)**, không ghi đè mù quáng: tiến độ giữ bản đã *done*, hoạt động mỗi ngày lấy `max`, từ điển / nhật ký / visualization gộp theo định danh, chat giữ phiên dài hơn. Làm việc trên hai máy rồi sync — không mất bên nào.

### Đồng bộ code · Syncing the app itself

App là **một file HTML duy nhất**, nên nó tự đẩy chính mình lên repo được:

- **Mở qua `http://`** (ví dụ `python -m http.server`): app `fetch` chính URL của nó → lấy đúng source gốc, đẩy thẳng, không hỏi gì.
- **Mở qua `file://`**: trình duyệt chặn không cho trang đọc file của chính nó, nên app sẽ **mở hộp chọn file** để bạn trỏ tới `dsa-compass.html`, rồi đẩy file đó.

App **từ chối** đẩy nếu file bạn chọn không phải source của nó (kiểm tra dấu hiệu nhận dạng), để không ghi đè nhầm file khác trong repo.

> ⚠️ **Không phải git thực sự.** Mỗi lần đẩy là một commit ghi đè thẳng lên nhánh, không có branch/merge/diff. Nếu bạn vừa sửa code bằng git ở nơi khác, hãy `git pull` trước — push từ app sẽ ghi đè bằng bản đang chạy trong trình duyệt.

---

### Được đồng bộ · What syncs
Tiến độ 150 câu + cấu hình kế hoạch · lịch hoạt động · từ điển tín hiệu riêng · nhật ký va chạm · lịch sử chat · visualization đã lưu.

> 🔑 **Token và API key KHÔNG bao giờ được đồng bộ.** Chúng nằm riêng trong trình duyệt của bạn và không có mặt trong file JSON đẩy lên repo. Hãy dùng **fine-grained token** chỉ cấp **Contents: Read and write** cho đúng repo này; nếu repo là public thì file dữ liệu của bạn cũng public — cân nhắc dùng repo **private**.
>
> 🔑 **Tokens and API keys are never synced.** Prefer a **private** repo, and a fine-grained token limited to *Contents: Read and write* on it.

---

## 🔐 Quyền riêng tư · Privacy

Toàn bộ dữ liệu (từ điển của bạn, nhật ký, tiến độ 150 câu, **lịch sử chat**, **visualization đã lưu**, thiết lập AI, ngôn ngữ, theme) lưu trong `localStorage` của **chính trình duyệt này** — không gửi đi đâu cả. Chat và việc sinh trace chỉ đi thẳng tới endpoint AI **bạn tự cấu hình**.

All your data (custom dictionary, log, 150-problem progress, **chat history**, **saved visualizations**, AI settings, language, theme) lives in this browser's `localStorage` — nothing is sent anywhere. Chat and trace generation go only to the **AI endpoints you configure**.

---

## 🛠️ Kỹ thuật · Tech

Vanilla HTML/CSS/JS, không phụ thuộc build. Font: Newsreader + Be Vietnam Pro (Google Fonts). Tôn trọng `prefers-reduced-motion`, hỗ trợ tối/sáng, responsive tới mobile.
