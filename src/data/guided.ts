/* The offline decision tree. Every leaf is a HYPOTHESIS, never an answer, and
   ends in a question the learner must check against their own problem. */

import type { Bilingual, Relation } from '@/types';

export interface GuideOption {
  t: Bilingual;
  /** Next node id, when this option continues the walk. */
  go?: string;
  /** Verdict id, when this option ends it. */
  verdict?: string;
}

export interface GuideNode {
  q: Bilingual;
  opts: GuideOption[];
}

export interface Verdict {
  rel: Relation;
  tool: Bilingual;
  body: Bilingual;
  /** The check the learner must run themselves. */
  verify: Bilingual;
}

export const GUIDE: Record<string, GuideNode> = {
  start:{ q:{vi:"Câu THƯỢNG NGUỒN trước tiên: đầu ra của bài toán thật sự đòi KIỂU thông tin gì?", en:"The UPSTREAM question first: what TYPE of information does the problem's output truly demand?"},
    opts:[
      {t:{vi:"Có / không, hoặc một con số / đếm", en:"Yes/no, or a number / count"}, go:"yn"},
      {t:{vi:"Tối ưu — nhỏ nhất / lớn nhất", en:"Optimize — minimum / maximum"}, go:"opt"},
      {t:{vi:"Liệt kê MỌI cấu hình", en:"Enumerate EVERY configuration"}, go:"enum"},
      {t:{vi:"Một thứ tự, hoặc một đường đi / kết nối", en:"An ordering, or a path / connection"}, go:"pathorder"}
    ]},
  yn:{ q:{vi:"Nó có quy về 'đã thấy chưa / có trùng không / đếm tần suất' được không? (bậc rẻ nhất — thử trước)", en:"Can it reduce to 'seen before / duplicate / count frequency'? (cheapest rung — try first)"},
    opts:[
      {t:{vi:"Có — chỉ cần biết cái gì giống / đã xuất hiện", en:"Yes — I only need to know what is the same / has appeared"}, verdict:"v_hash"},
      {t:{vi:"Không, nhưng dữ liệu có thứ tự / sắp được và một đại lượng biến thiên đơn điệu", en:"No, but the data has (or can take) an order where a quantity moves monotonically"}, verdict:"v_order"},
      {t:{vi:"Không — nó hỏi tổng/đếm trên NHIỀU đoạn con khác nhau", en:"No — it asks sum/count over MANY different sub-ranges"}, verdict:"v_prefix"},
      {t:{vi:"Không — đáp án lắp từ các bài con lặp lại", en:"No — the answer assembles from repeating sub-problems"}, verdict:"v_dp"}
    ]},
  opt:{ q:{vi:"Với bài tối ưu: KIỂM TRA một đáp án ứng viên có dễ hơn TÌM ra nó không?", en:"For an optimization: is CHECKING a candidate answer easier than FINDING it?"},
    opts:[
      {t:{vi:"Có — cho một giá trị, tôi kiểm 'khả thi không' dễ dàng, và tính khả thi đơn điệu", en:"Yes — given a value I can test 'feasible?' easily, and feasibility is monotonic"}, verdict:"v_bsans"},
      {t:{vi:"Không, nhưng có một chuỗi lựa chọn cục bộ mà chọn tốt nhất mỗi bước là an toàn", en:"No, but there's a chain of local choices where picking the best each step is safe"}, verdict:"v_greedy"},
      {t:{vi:"Không — đáp án tối ưu lắp từ đáp án tối ưu của bài con lặp lại", en:"No — the optimum assembles from the optima of repeating sub-problems"}, verdict:"v_dp"},
      {t:{vi:"Không — tôi phải liên tục lấy cực trị với chèn/xóa động", en:"No — I must repeatedly pull the extreme with dynamic insert/remove"}, verdict:"v_heap"}
    ]},
  enum:{ q:{vi:"Liệt kê mọi cấu hình: bạn có tiêu chí để CẮT sớm các nhánh không dẫn tới đâu không?", en:"Enumerating every configuration: do you have a criterion to CUT branches early that lead nowhere?"},
    opts:[
      {t:{vi:"Có — tôi đi cây lựa chọn và cắt tỉa nhánh chết", en:"Yes — I walk the choice tree and prune dead branches"}, verdict:"v_backtrack"},
      {t:{vi:"Nhiều cấu hình chia sẻ cùng bài con đã tính → tôi chỉ cần ĐẾM số cách", en:"Many configurations share the same computed sub-problem → I only need to COUNT the ways"}, verdict:"v_dp"}
    ]},
  pathorder:{ q:{vi:"Đây là quan hệ 'ai nối với ai' (mạng lưới), hay chỉ là sắp thứ tự trên một chiều?", en:"Is this a 'who connects to whom' relation (a network), or just ordering along one dimension?"},
    opts:[
      {t:{vi:"Mạng lưới — hỏi đường đi / tới được / ngắn nhất", en:"A network — asks path / reachability / shortest"}, verdict:"v_graph"},
      {t:{vi:"Một chiều — một đại lượng biến thiên đơn điệu khi tôi trượt/di chuyển", en:"One dimension — a quantity moves monotonically as I slide/move"}, verdict:"v_order"},
      {t:{vi:"Không gì khớp — có lẽ bài đang bị ngụy trang", en:"Nothing fits — maybe the problem is disguised"}, verdict:"v_transform"}
    ]}
};

export const VERDICTS: Record<string, Verdict> = {
  v_hash:{rel:"identity", tool:{vi:"Nghĩ theo hướng HASH (danh tính)", en:"Think HASH (identity)"}, body:{vi:"Nếu chỉ cần biết 'cái gì giống / đã thấy / đếm bao nhiêu', thứ tự là vô nghĩa — bạn có thể xóa hẳn một chiều duyệt và tra cứu trực tiếp bằng bộ nhớ.", en:"If you only need 'what is the same / seen / how many', order is meaningless — you can delete a whole traversal dimension and look up directly using memory."}, verify:{vi:"Hãy tự kiểm: bài của bạn có THẬT sự chỉ cần danh tính không, hay bạn vẫn cần biết 'cái nào lớn hơn / ở vị trí nào'? Nếu cần vị trí gốc, đây có thể là dấu hiệu hash đúng hơn two pointer.", en:"Check yourself: does your problem TRULY need only identity, or do you still need 'which is bigger / at what position'? If you need the original position, that's a hint hash fits better than two pointer."}},
  v_order:{rel:"order", tool:{vi:"Nghĩ theo họ ĐƠN ĐIỆU (two pointer / binary search / sliding window)", en:"Think the MONOTONIC family (two pointer / binary search / sliding window)"}, body:{vi:"Kích hoạt thật không phải 'mảng đã sắp' mà là 'có một đại lượng biến thiên đơn điệu để mỗi bước vứt cả một khoảng'.", en:"The real trigger isn't 'the array is sorted' but 'a quantity moves monotonically so each step discards a whole range'."}, verify:{vi:"Hãy tự chỉ ra: đại lượng NÀO của bạn biến thiên đơn điệu, và vì sao vứt bỏ cả một khoảng là AN TOÀN? Nếu không chứng minh được tính đơn điệu, công cụ này chưa áp dụng được.", en:"Point it out yourself: WHICH quantity of yours moves monotonically, and why is discarding a whole range SAFE? If you can't prove monotonicity, this tool doesn't apply yet."}},
  v_prefix:{rel:"traverse", tool:{vi:"Nghĩ theo PREFIX SUM (nhớ để không cộng lại)", en:"Think PREFIX SUM (remember, don't re-add)"}, body:{vi:"Nhiều truy vấn tổng/đếm trên các đoạn khác nhau → tính trước một lần, mỗi truy vấn O(1). Bạn đang tránh cộng lại vùng đã cộng.", en:"Many sum/count queries over different ranges → precompute once, each query O(1). You're avoiding re-adding an already-added region."}, verify:{vi:"Hãy tự hỏi: bạn có thật sự truy vấn NHIỀU đoạn không, hay chỉ một? Và đại lượng của bạn có cộng dồn được (khả nghịch) để trừ hai tiền tố không?", en:"Ask yourself: do you really query MANY ranges, or just one? And is your quantity accumulative (invertible) so two prefixes can be subtracted?"}},
  v_dp:{rel:"dependency", tool:{vi:"Nghĩ theo DP (phụ thuộc)", en:"Think DP (dependency)"}, body:{vi:"Đáp án lớn lắp từ đáp án của vài bài con cùng hình dạng, và các bài con đó lặp lại. Bạn phải TỰ phát minh không gian trạng thái.", en:"The big answer assembles from a few same-shaped sub-problems, and those sub-problems repeat. You must INVENT the state space yourself."}, verify:{vi:"Hãy tự kiểm hai điều kiện: (1) cha có lắp được từ con không (cấu trúc con tối ưu)? (2) con có LẶP LẠI không? Thiếu (1) → lùi về backtracking; thiếu (2) → đệ quy thường là đủ. Trạng thái của bạn là gì?", en:"Check the two conditions: (1) does the parent assemble from children (optimal substructure)? (2) do children REPEAT? Missing (1) → fall back to backtracking; missing (2) → plain recursion is enough. What is your state?"}},
  v_bsans:{rel:"order", tool:{vi:"Nghĩ theo BINARY SEARCH trên ĐÁP ÁN", en:"Think BINARY SEARCH on the ANSWER"}, body:{vi:"Khi kiểm tra một ứng viên dễ hơn tìm nó, và tính khả thi đơn điệu theo giá trị, bạn dựng một trục đơn điệu trên không gian đáp án dù đề không cho mảng nào để sắp.", en:"When testing a candidate is easier than finding it, and feasibility is monotonic in the value, you build a monotonic axis over the answer space though the problem gave no array to sort."}, verify:{vi:"Hãy tự chứng minh: nếu giá trị x khả thi thì mọi giá trị 'dễ hơn' cũng khả thi (tính đơn điệu)? Và hàm kiểm tra của bạn có rẻ hơn tìm trực tiếp không?", en:"Prove it yourself: if value x is feasible, is every 'easier' value also feasible (monotonicity)? And is your check cheaper than finding directly?"}},
  v_greedy:{rel:"order", tool:{vi:"Nghĩ theo GREEDY", en:"Think GREEDY"}, body:{vi:"Một chuỗi lựa chọn cục bộ mà chọn tốt nhất mỗi bước dẫn tới tối ưu toàn cục — nhưng chỉ khi bạn chứng minh được nó an toàn.", en:"A chain of local choices where picking the best each step reaches the global optimum — but only if you can prove it's safe."}, verify:{vi:"Hãy tự tìm phản ví dụ: có trường hợp nào lựa chọn tham lam cục bộ lại phá tối ưu toàn cục không? Nếu không loại được nghi ngờ, có thể bài này thật ra là DP.", en:"Hunt for a counter-example yourself: is there a case where the locally-greedy choice breaks the global optimum? If you can't dismiss the doubt, this may really be DP."}},
  v_heap:{rel:"order", tool:{vi:"Nghĩ theo HEAP", en:"Think HEAP"}, body:{vi:"Liên tục lấy cực trị với chèn/xóa động → giữ một thứ tự cục bộ để mỗi thao tác cực trị là O(log n).", en:"Repeatedly pulling the extreme with dynamic insert/remove → keep a partial order so each extreme operation is O(log n)."}, verify:{vi:"Hãy tự hỏi: bạn có cần TOÀN BỘ thứ tự (thì hãy sắp xếp) hay chỉ cần cực trị hiện tại lặp đi lặp lại (thì mới là heap)?", en:"Ask yourself: do you need the FULL order (then sort) or just the current extreme, again and again (then it's a heap)?"}},
  v_backtrack:{rel:"traverse", tool:{vi:"Nghĩ theo BACKTRACKING + cắt tỉa", en:"Think BACKTRACKING + pruning"}, body:{vi:"Đi cây lựa chọn một cách hệ thống, cắt sớm các nhánh không thể dẫn tới nghiệm.", en:"Walk the choice tree systematically, cutting off branches that can't lead to a solution early."}, verify:{vi:"Hãy tự chỉ ra: tiêu chí CẮT của bạn là gì? Nếu không có nhánh nào cắt được và các bài con lặp lại, hãy cân nhắc DP thay vì duyệt thô.", en:"Point out your PRUNING criterion. If nothing can be pruned and sub-problems repeat, consider DP instead of raw traversal."}},
  v_graph:{rel:"traverse", tool:{vi:"Nghĩ theo ĐỒ THỊ (BFS / DFS / Dijkstra)", en:"Think GRAPH (BFS / DFS / Dijkstra)"}, body:{vi:"Dữ liệu là một mạng lưới các quan hệ — để các liên kết dẫn đường thay vì mò từng khả năng.", en:"The data is a network of relations — let the links guide instead of groping through every possibility."}, verify:{vi:"Hãy tự vẽ ra: đỉnh của bạn là gì, cạnh là gì? Và bạn cần 'tới được' (BFS/DFS) hay 'ngắn nhất có trọng số' (Dijkstra)?", en:"Draw it yourself: what are your vertices, what are your edges? And do you need 'reachability' (BFS/DFS) or 'weighted shortest' (Dijkstra)?"}},
  v_transform:{rel:"traverse", tool:{vi:"Bài toán đang bị NGỤY TRANG — hãy BIẾN ĐỔI", en:"The problem is DISGUISED — TRANSFORM it"}, body:{vi:"Không bậc nào khớp trực tiếp. Có thể một 'mảng số' thật ra là đồ thị, hoặc một 'tìm min/max' thật ra là binary search trên không gian đáp án. Cái aha này là nghệ thuật, mài bằng va chạm.", en:"No rung fits directly. Maybe an 'array of numbers' is really a graph, or a 'find min/max' is really binary search on the answer space. This aha is art, sharpened by collision."}, verify:{vi:"Hãy tự hỏi: đây có phải một bài quen thuộc trong lớp áo khác không? Nếu tôi đổi tên các đối tượng trong đề thành đỉnh/cạnh/trạng thái, có mẫu nào lộ ra không?", en:"Ask yourself: is this a familiar problem in another coat? If I rename the objects in the statement as vertices/edges/states, does a pattern surface?"}}
};
