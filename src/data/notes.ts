/* The honest caveats. Being stuck at the transformation step is the nature of
   hard problems, not a personal failing - the app should say so. */

import type { Bilingual } from '@/types';

export interface MethodNote {
  t: Bilingual;
  b: Bilingual;
}

export const METHOD_NOTES: MethodNote[] = [
  {t:{vi:"Không có công thức vạn năng", en:"No universal formula"}, b:{vi:"Không tồn tại một công thức giải mọi bài — đó là một định luật, không phải lỗ hổng. Cái ta có là la bàn: nó không đi thay bạn, nhưng ở bất kỳ điểm nào cũng chỉ được bước kế tiếp.", en:"There is no formula that solves every problem — that's a law, not a gap. What we have is a compass: it never walks for you, but at any point it points to the next step."}},
  {t:{vi:"Học bằng nén, không bằng số lượng", en:"Learn by compression, not by volume"}, b:{vi:"Sau khi đọc một lời giải, đừng code lại. Chỉ rút một dòng: \"đặc trưng duy nhất nào của đề lẽ ra phải kích hoạt công cụ này?\" Vài chục bài học kiểu này hơn hàng trăm bài cày cho quen tay.", en:"After reading a solution, don't re-code it. Extract one line: \"which single feature of the problem should have triggered this tool?\" A few dozen problems learned this way beats hundreds grinded for familiarity."}},
  {t:{vi:"Bước biến đổi là nghệ thuật", en:"The transformation step is art"}, b:{vi:"Cái \"aha\" khi thấy bài X thật ra là bài Y chỉ sắc bén lên nhờ va chạm, không phải nhờ đọc. Mắc kẹt ở đây là bản chất của bài khó, không phải vì bạn kém.", en:"The \"aha\" of seeing problem X as problem Y is sharpened only by collision, not by reading. Being stuck here is the nature of hard problems, not stupidity."}},
  {t:{vi:"Mọi thứ đều là Duyệt", en:"Everything is Traverse"}, b:{vi:"Nhớ và Sắp xếp chỉ là chuẩn bị. Muốn lấy đáp án bạn phải ĐỌC dữ liệu, mà đọc chính là duyệt. Trò chơi thật sự: duyệt KHÔNG GIAN nào? — và không gian đó thường phải tự phát minh ra.", en:"Remember and Order are only preparation. To extract the answer you must READ the data, and reading is traversing. The real game: WHICH SPACE do you traverse? — and that space often must be invented."}}
];
