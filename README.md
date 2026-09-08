# La Bàn DSA · DSA Compass

> Một chiếc **la bàn**, không phải chìa khóa. Công cụ dạy bạn *cách nghĩ* khi giải thuật, chứ không đưa lời giải.
>
> A **compass**, not a key. A tool that teaches you *how to think* about algorithm problems — it never solves them for you.

Ứng dụng web **một file duy nhất**, chạy offline, giao diện song ngữ **Việt / Anh**, kèm một gia sư Socratic nối tới mô hình AI chạy cục bộ trên máy bạn.

A **single self-contained** web app, runs offline, bilingual **Vietnamese / English**, with a Socratic tutor that connects to a local AI model on your machine.

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

## 📚 Các phần & cách dùng · Sections & usage

| Phần | Section | Dùng để làm gì |
|---|---|---|
| **Bản đồ tư duy** | Thinking Map | 4 câu hỏi la bàn (câu *thượng nguồn* hỏi trước) + thang chi phí tư duy 5 bậc. Bấm từng bậc để xem câu hỏi kích hoạt, "vì sao công cụ này", và "duyệt không gian nào". |
| **Từ điển tín hiệu** | Trigger Dictionary | 14 mục cô đọng: tín hiệu trong đề → công cụ + vì sao. Lọc theo loại quan hệ. **Tự thêm mục của riêng bạn** (lưu cục bộ) — đây là phần cốt lõi để bạn tập tự đi. |
| **Dẫn lối** | Guided | Cây quyết định **offline, không cần AI**. Bắt đầu từ "đầu ra đòi kiểu thông tin gì?", đi tới một **GIẢ THUYẾT** (không phải đáp án) kèm câu tự kiểm chứng. |
| **La bàn sống** | Living Compass | Gia sư AI Socratic nối mô hình local (xem dưới). |
| **Luyện nén** | Compression Drill | Rút ngẫu nhiên một tín hiệu; tự nói *công cụ* và *vì sao* trước khi lật. |
| **Nhật ký** | Log | Ghi "bài toán tôi va phải" + tín hiệu rút ra. Lưu cục bộ. |
| **Ghi chú** | Notes | Các lưu ý thành thật về phương pháp. |

### Nút trên thanh điều hướng · Toolbar
- **EN / VI** — đổi ngôn ngữ toàn bộ giao diện. Gia sư AI cũng **trả lời theo đúng ngôn ngữ đang chọn**.
- **☾ / ☀** — đổi giao diện tối / sáng.

Mặc định: **tiếng Anh + nền tối**. Mọi lựa chọn được nhớ trong trình duyệt.

---

## 🤖 Cấu hình gia sư AI · Configure the AI tutor

Gia sư gọi một endpoint **OpenAI-compatible** chạy trên máy bạn. Vào phần **La bàn sống → Thiết lập**, điền:

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

## 🔐 Quyền riêng tư · Privacy

Toàn bộ dữ liệu (từ điển của bạn, nhật ký, thiết lập AI, ngôn ngữ, theme) lưu trong `localStorage` của **chính trình duyệt này** — không gửi đi đâu cả. Chat chỉ đi thẳng tới endpoint AI **bạn tự cấu hình**.

All your data (custom dictionary, log, AI settings, language, theme) lives in this browser's `localStorage` — nothing is sent anywhere. Chat goes only to the **AI endpoint you configure**.

---

## 🛠️ Kỹ thuật · Tech

Vanilla HTML/CSS/JS, không phụ thuộc build. Font: Newsreader + Be Vietnam Pro (Google Fonts). Tôn trọng `prefers-reduced-motion`, hỗ trợ tối/sáng, responsive tới mobile.
