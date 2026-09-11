/* The four relations, the four compass questions, and the cost-of-thinking
   ladder. This is the spine every other feature refers back to. */

import type { Bilingual, Relation } from '@/types';

export interface CompassQuestion {
  n: number;
  /** The upstream question, asked before all others. */
  upstream?: boolean;
  text: Bilingual;
}

export interface Rung {
  id: string;
  rel: Relation;
  /** Cheapest rung to reach for; shown first. */
  cheap: boolean;
  name: Bilingual;
  verb: Bilingual;
  cost: Bilingual;
  trigger: Bilingual;
  why: Bilingual;
  space: Bilingual;
}

export const RELATIONS:
  Record<Relation, Bilingual> = {
  identity:{vi:"Danh tính", en:"Identity"},
  order:{vi:"Thứ tự", en:"Order"},
  dependency:{vi:"Phụ thuộc", en:"Dependency"},
  traverse:{vi:"Duyệt", en:"Traverse"}
};

export const COMPASS_QUESTIONS: CompassQuestion[] = [
  {n:1, upstream:true, text:{vi:"ĐẦU RA thật sự đòi KIỂU / BAO NHIÊU thông tin? Phần lớn rối loạn đến từ việc trả lời sai câu này.",
    en:"What TYPE / how much information does the OUTPUT truly require? Most confusion comes from answering this one wrong."}},
  {n:2, text:{vi:"ĐẦU VÀO đang cho tôi cấu trúc gì mà tôi chưa dùng đến?", en:"What structure is the INPUT already giving me that I haven't used?"}},
  {n:3, text:{vi:"Tôi đang TÍNH LẠI thứ gì mà mình vốn đã biết?", en:"What am I RE-computing that I already know?"}},
  {n:4, text:{vi:"Tôi sẵn lòng ĐÁNH ĐỔI tài nguyên nào để mua tốc độ ở chỗ mình cần?", en:"What resource am I willing to TRADE to buy speed where I need it?"}}
];

export const LADDER: Rung[] = [
  {id:"brute", rel:"traverse", cheap:false,
   name:{vi:"Bậc 0 — Vét cạn", en:"Rung 0 — Brute force"}, verb:{vi:"để lộ ra hình dạng", en:"to reveal the shape"},
   cost:{vi:"Baseline — thước đo cho mọi tối ưu", en:"Baseline — the yardstick for every optimization"},
   trigger:{vi:"Chưa tối ưu gì. Chạy thô để trả lời: đề muốn KIỂU đáp án nào, và tôi đang lặp lại cái gì?",
     en:"No optimization yet. Run it raw to answer: what TYPE of answer does the problem want, and what am I repeating?"},
   why:{vi:"Bạn không thể định tuyến trước khi thấy hình dạng bài toán. Vét cạn = 'tôi giả vờ đầu vào không có tính chất đặc biệt nào'. Mỗi lần lặp lại đặt tên cho một lãng phí; lãng phí là dấu chân của cấu trúc.",
     en:"You can't route before you see the problem's shape. Brute force = 'I pretend the input has no special property.' Each repetition names a waste; waste is the footprint of structure."},
   space:{vi:"Duyệt toàn bộ không gian thô (mọi cặp, mọi chuỗi con, mọi khả năng). Là baseline mà mọi tối ưu đo lường dựa vào.",
     en:"Traverse the full raw space (all pairs, all substrings, all possibilities). The baseline every optimization is measured against."}},
  {id:"hash", rel:"identity", cheap:true,
   name:{vi:"Bậc 1 — Danh tính → Hash", en:"Rung 1 — Identity → Hash"}, verb:{vi:"Nhớ", en:"Remember"},
   cost:{vi:"RẺ NHẤT để nghĩ — thử trước tiên · đổi lấy bộ nhớ", en:"CHEAPEST to think — try first · costs memory"},
   trigger:{vi:"Bài này có quy về 'tôi đã thấy chưa / có trùng không / đếm tần suất' được không?",
     en:"Can this reduce to 'have I seen it / is there a duplicate / count frequency'?"},
   why:{vi:"Hash sống ở nơi THỨ TỰ không tồn tại hoặc không quan trọng. Nó không hỏi 'cái nào lớn hơn' — chỉ hỏi 'cái này CÓ GIỐNG cái kia không'. Rẻ vì bạn không phát minh gì cả: chỉ lưu rồi tra.",
     en:"Hash lives where ORDER doesn't exist or doesn't matter. It never asks 'which is bigger' — only 'is this THE SAME as that.' Cheap because you invent nothing: just store and look up."},
   space:{vi:"Nó XÓA một chiều duyệt — thay vì tìm 'cái này ở đâu', nó nhảy thẳng tới ô của phần tử. Giá phải trả: bộ nhớ. Nó cố tình phá thứ tự để mua tra cứu O(1).",
     en:"It DELETES a traversal dimension — instead of searching 'where is this', it jumps straight to the item's bucket. Cost: memory. It deliberately destroys order to buy O(1) lookup."}},
  {id:"order", rel:"order", cheap:false,
   name:{vi:"Bậc 2 — Thứ tự → họ đơn điệu", en:"Rung 2 — Order → the monotonic family"}, verb:{vi:"Sắp xếp", en:"Sort"},
   cost:{vi:"Chi phí TRUNG BÌNH · two pointer · binary search · sliding window · greedy · heap", en:"MEDIUM cost · two pointer · binary search · sliding window · greedy · heap"},
   trigger:{vi:"Có một thứ tự (cho sẵn, hoặc tạo ra bằng sắp xếp) khiến một đại lượng thay đổi ĐƠN ĐIỆU, để mỗi bước loại được cả một mảng khả năng không?",
     en:"Is there an order (given, or created by sorting) that makes a quantity change MONOTONICALLY, so each step eliminates a whole batch of possibilities?"},
   why:{vi:"Kích hoạt thật KHÔNG phải 'mảng đã sắp xếp' — mà là 'tồn tại cách di chuyển sao cho đại lượng tôi quan tâm thay đổi đơn điệu, cho phép vứt bỏ cả một khoảng mỗi bước mà không cần kiểm từng phần tử'. Sắp xếp chỉ là NGUỒN phổ biến nhất của tính đơn điệu đó. two pointer / binary search / sliding window / greedy đều uống từ dòng sữa này.",
     en:"The real trigger is NOT 'the array is sorted' — it's 'there exists a way to move so the quantity I care about changes monotonically, letting me discard a whole range each step without checking each item.' Sorting is just the most common SOURCE of that monotonicity. two pointer / binary search / sliding window / greedy all drink from this same milk."},
   space:{vi:"Thu không gian duyệt từ 2D (mọi cặp, O(n²)) xuống 1D (O(n)). Two pointer chỉ là cách bạn đi trên đường thẳng đã thu gọn đó. Chọn công cụ = nhìn HÌNH DẠNG đáp án: một ngưỡng → binary search; hai đầu khép lại → two pointer; một cửa sổ liền kề trượt → sliding window; một chuỗi lựa chọn cục bộ → greedy.",
     en:"Collapses the traversal space from 2D (all pairs, O(n²)) to a 1D line (O(n)). Two pointers are just how you walk the collapsed line. Choosing the tool = look at the SHAPE of the answer: one threshold → binary search; two ends closing in → two pointer; a sliding contiguous window → sliding window; a chain of local choices → greedy."}},
  {id:"dp", rel:"dependency", cheap:false,
   name:{vi:"Bậc 3 — Phụ thuộc → DP", en:"Rung 3 — Dependency → DP"}, verb:{vi:"Nhớ", en:"Remember"},
   cost:{vi:"ĐẮT NHẤT để nghĩ — thử sau cùng · bạn phải tự phát minh không gian trạng thái", en:"MOST EXPENSIVE to think — try last · you must invent the state space yourself"},
   trigger:{vi:"Đáp án lớn có LẮP RÁP được từ đáp án của vài bài con cùng hình dạng không — và những bài con đó có lặp lại (chồng lấn) không?",
     en:"Can the big answer be ASSEMBLED from the answers of a few same-shaped sub-problems — and do those sub-problems repeat (overlap)?"},
   why:{vi:"DP khai thác quan hệ thứ ba, PHỤ THUỘC — 'đáp án lớn vốn đã nằm trong các đáp án con'. Đắt vì bạn phải TỰ PHÁT MINH không gian trạng thái; không ai đưa nó cho bạn. Cần hai điều kiện: cấu trúc con tối ưu (cha lắp từ con) + bài con chồng lấn (con lặp lại). Thiếu điều đầu → lùi về Duyệt thô (backtracking). Thiếu điều sau → đệ quy thường là đủ.",
     en:"DP exploits the third relation, DEPENDENCY — 'the big answer is already contained in the sub-answers.' Expensive because you must INVENT the state space yourself; nobody hands it to you. Needs two conditions: optimal substructure (parent assembles from children) + overlapping subproblems (children repeat). Missing the first → fall back to raw Traverse (backtracking). Missing the second → plain recursion is enough."},
   space:{vi:"Bạn XÂY một không gian mới không có trong đề — không gian các bài con — rồi duyệt từ nhỏ tới lớn, lắp đáp án con thành đáp án lớn hơn, Nhớ lại để không bao giờ lắp lại.",
     en:"You BUILD a new space not present in the problem — the space of sub-problems — and traverse it small-to-large, assembling child answers into larger ones, Remembering so you never reassemble."}},
  {id:"transform", rel:"traverse", cheap:false,
   name:{vi:"Bậc ✦ — Biến đổi", en:"Rung ✦ — Transformation"}, verb:{vi:"nghệ thuật", en:"art"},
   cost:{vi:"Khi KHÔNG bậc nào kích hoạt", en:"When NO rung fires"},
   trigger:{vi:"Không gì cho đáp án trực tiếp? Bài toán đang bị NGỤY TRANG. Việc của bạn: biến đổi nó cho tới khi một loại quan hệ lộ ra.",
     en:"Nothing gives the answer directly? The problem is DISGUISED. Your job: transform it until one relation type surfaces."},
   why:{vi:"Một bài 'tìm min/max' thật ra có thể là binary search trên KHÔNG GIAN ĐÁP ÁN — bạn phát minh một trục đơn điệu ở nơi đề không cho mảng nào để sắp. Một 'mảng số' thật ra có thể là ĐỒ THỊ NGỤY TRANG — mỗi số một đỉnh, quan hệ là cạnh. Cái 'aha' khi thấy bài X là bài Y là nghệ thuật, chỉ mài sắc bằng va chạm, không bằng đọc.",
     en:"A 'find min/max' problem may really be binary search on the ANSWER space — you invent a monotonic axis where the problem gave no array to sort. An 'array of numbers' may really be a DISGUISED GRAPH — each number a node, relations are edges. The 'aha' of seeing problem X as problem Y is art, sharpened only by collision, not by reading."},
   space:{vi:"Bạn không tìm một không gian có sẵn — bạn KIẾN TẠO một không gian mới để một mẫu quen thuộc áp dụng được.",
     en:"You don't find an existing space — you CONSTRUCT a new one so a familiar pattern applies."}}
];
