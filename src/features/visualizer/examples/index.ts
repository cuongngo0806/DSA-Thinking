/* Built-in traces. Each is produced by actually running the algorithm, so the
   visualization cannot drift from what the code does. */

import type {
  ComponentState, GraphEdge, GraphNode, HashMapEntry, JSONValue, Pointer, Role,
  Visualization, VisualizationStep,
} from '../types';

type Vars = Record<string, JSONValue>;
type Emit = Omit<VisualizationStep, 'id'>;

export function buildTrappingRainWater(): Visualization {
  const HEIGHT=[0,1,0,2,1,0,1,3,2,1,2,1];
  const SOURCE=`int trap(vector<int>& height) {\n    int n = height.size();\n    stack<int> st;              // stores indices, heights decreasing\n    int res = 0;\n    for (int i = 0; i < n; i++) {\n        while (!st.empty() &&\n               height[i] > height[st.top()]) {\n            int bottom = st.top();\n            st.pop();\n            if (st.empty()) break;\n            int left = st.top();\n            int right = i;\n            int width = right - left - 1;\n            int bounded = min(height[left], height[right]) - height[bottom];\n            res += width * bounded;\n        }\n        st.push(i);\n    }\n    return res;\n}`;
  const L={forLoop:5,whileCond:6,bottom:8,pop:9,breakEmpty:10,left:11,computeWidth:13,computeWater:14,addRes:15,push:17,ret:19};
  const snap=(stack: number[],vars: Vars,ptrs: Pointer[]): ComponentState[]=>[{type:'array',id:'height',values:HEIGHT,pointers:ptrs},{type:'stack',id:'stack',values:[...stack]},{type:'variables',id:'vars',values:vars}];
  const steps: VisualizationStep[]=[]; let id=0; const stack: number[]=[]; let res=0;
  const push=(s: Emit)=>steps.push({id:id++,...s});
  push({description:'Start. We scan the bars left to right, keeping a stack of indices whose heights are decreasing. When a taller bar appears it becomes a right wall and we settle the water trapped over the popped bar.',variables:{i:'-',res},components:snap(stack,{i:'-',res},[]),codeLine:L.forLoop,result:res});
  for(let i=0;i<HEIGHT.length;i++){
    const iPtr: Pointer={name:'i',index:i,role:'active'};
    push({description:`Consider bar i=${i} with height ${HEIGHT[i]}.`,variables:{i,res},components:snap(stack,{i,res},[iPtr]),highlights:[{component:'height',indices:[i],role:'active'}],codeLine:L.forLoop,result:res});
    while(stack.length>0 && HEIGHT[i]>HEIGHT[stack[stack.length-1]]){
      const top=stack[stack.length-1];
      push({description:`height[${i}] = ${HEIGHT[i]} is greater than height[${top}] = ${HEIGHT[top]} (the stack top), so bar ${i} can act as a right boundary. We settle the bar at index ${top}.`,variables:{i,res,top},components:snap(stack,{i,res,top},[iPtr,{name:'top',index:top,role:'boundary'}]),highlights:[{component:'height',indices:[i],role:'active'},{component:'height',indices:[top],role:'compare'}],codeLine:L.whileCond,result:res});
      const bottom=stack.pop()!;
      push({description:`Pop index ${bottom} — this is the "bottom" of the basin (its floor). Its water will be bounded by the walls on either side.`,variables:{i,res,bottom},components:snap(stack,{i,res,bottom},[iPtr,{name:'bottom',index:bottom,role:'boundary'}]),highlights:[{component:'height',indices:[bottom],role:'pop'}],codeLine:L.pop,result:res});
      if(stack.length===0){ push({description:`The stack is now empty, so there is no left wall for this basin — water would spill off the left edge. Stop settling and move on.`,variables:{i,res,bottom},components:snap(stack,{i,res,bottom},[iPtr]),highlights:[{component:'height',indices:[bottom],role:'visited'}],codeLine:L.breakEmpty,result:res}); break; }
      const left=stack[stack.length-1], right=i, width=right-left-1, bounded=Math.min(HEIGHT[left],HEIGHT[right])-HEIGHT[bottom], added=width*bounded; res+=added;
      push({description:`Left wall is index ${left} (height ${HEIGHT[left]}), right wall is index ${right} (height ${HEIGHT[right]}). Width between the walls is right − left − 1 = ${width}. The water height above the bottom is min(${HEIGHT[left]}, ${HEIGHT[right]}) − ${HEIGHT[bottom]} = ${bounded}. This adds ${added} unit(s) of water.`,variables:{i,res,bottom,left,right,width,bounded},components:snap(stack,{i,res,left,right,bottom},[{name:'left',index:left,role:'boundary'},{name:'bottom',index:bottom,role:'active'},{name:'right',index:right,role:'boundary'}]),highlights:[{component:'height',indices:[left,right],role:'boundary'},{component:'height',indices:[bottom],role:'active'}],calculation:`width = ${right} − ${left} − 1 = ${width}\nboundedHeight = min(${HEIGHT[left]}, ${HEIGHT[right]}) − ${HEIGHT[bottom]} = ${bounded}\nwater = ${width} × ${bounded} = ${added}   →   res = ${res}`,codeLine:L.addRes,result:res});
    }
    stack.push(i);
    push({description:`Push index ${i} onto the stack. It becomes a potential left wall for bars that come later.`,variables:{i,res},components:snap(stack,{i,res},[{name:'i',index:i,role:'active'}]),highlights:[{component:'height',indices:[i],role:'push'}],codeLine:L.push,result:res});
  }
  push({description:`All bars processed. The total trapped rain water is ${res}.`,variables:{res},components:snap(stack,{res},[]),codeLine:L.ret,result:res});
  return {title:'Trapping Rain Water',algorithm:'Monotonic Stack',complexity:{time:'O(n)',space:'O(n)'},components:[{type:'array',id:'height',label:'height',renderAsBars:true,showIndices:true},{type:'stack',id:'stack',label:'stack (indices)',indicesInto:'height'},{type:'variables',id:'vars',label:'variables'}],sourceCode:{language:'cpp',code:SOURCE},steps};
}

export function buildBinarySearch(): Visualization {
  const ARR=[1,3,4,7,9,11,15,20,24,30], TARGET=15;
  const SOURCE=`int binarySearch(vector<int>& a, int target) {\n    int left = 0, right = a.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == target) return mid;\n        if (a[mid] < target)  left = mid + 1;\n        else                  right = mid - 1;\n    }\n    return -1;\n}`;
  const snap=(vars: Vars,ptrs: Pointer[]): ComponentState[]=>[{type:'array',id:'arr',values:ARR,pointers:ptrs},{type:'variables',id:'vars',values:vars}];
  const steps: VisualizationStep[]=[]; let id=0,left=0,right=ARR.length-1,found=-1; const push=(s: Emit)=>steps.push({id:id++,...s});
  push({description:`Search for ${TARGET} in a sorted array. Start with the whole range: left=0, right=${right}.`,variables:{left,right},components:snap({left,right},[{name:'left',index:left,role:'boundary'},{name:'right',index:right,role:'boundary'}]),codeLine:2,result:-1});
  while(left<=right){
    const mid=left+Math.floor((right-left)/2);
    push({description:`Compute mid = ${mid}. Compare a[${mid}] = ${ARR[mid]} with target ${TARGET}.`,variables:{left,right,mid},components:snap({left,right,mid},[{name:'left',index:left,role:'boundary'},{name:'mid',index:mid,role:'active'},{name:'right',index:right,role:'boundary'}]),highlights:[{component:'arr',indices:[mid],role:'active'},{component:'arr',indices:[left,right],role:'boundary'}],calculation:`mid = ${left} + (${right} − ${left}) / 2 = ${mid}`,codeLine:4,result:-1});
    if(ARR[mid]===TARGET){ found=mid; push({description:`a[${mid}] = ${ARR[mid]} equals the target. Found at index ${mid}.`,variables:{left,right,mid},components:snap({left,right,mid},[{name:'mid',index:mid,role:'active'}]),highlights:[{component:'arr',indices:[mid],role:'result'}],codeLine:5,result:mid}); break; }
    if(ARR[mid]<TARGET){ push({description:`a[${mid}] = ${ARR[mid]} < ${TARGET}, so the target must be to the right. Move left to ${mid+1}.`,variables:{left,right,mid},components:snap({left,right,mid},[{name:'mid',index:mid,role:'active'}]),highlights:[{component:'arr',indices:[mid],role:'compare'}],codeLine:6,result:-1}); left=mid+1; }
    else { push({description:`a[${mid}] = ${ARR[mid]} > ${TARGET}, so the target must be to the left. Move right to ${mid-1}.`,variables:{left,right,mid},components:snap({left,right,mid},[{name:'mid',index:mid,role:'active'}]),highlights:[{component:'arr',indices:[mid],role:'compare'}],codeLine:7,result:-1}); right=mid-1; }
  }
  if(found===-1) push({description:'Range is empty (left > right). Target is not present; return −1.',variables:{left,right},components:snap({left,right},[]),codeLine:9,result:-1});
  return {title:'Binary Search',algorithm:'Divide & Conquer',complexity:{time:'O(log n)',space:'O(1)'},components:[{type:'array',id:'arr',label:'a',showIndices:true},{type:'variables',id:'vars',label:'variables'}],sourceCode:{language:'cpp',code:SOURCE},steps};
}

export function buildTwoSum(): Visualization {
  const NUMS=[2,7,11,15], TARGET=9;
  const mapEntries=(m: Map<number,number>,hk?: number): HashMapEntry[]=>
    [...m.entries()].map(([k,v])=>k===hk?{key:String(k),value:v,role:'active' as const}:{key:String(k),value:v});
  const snap=(m: Map<number,number>,vars: Vars,ptr: number,hk?: number): ComponentState[]=>[{type:'array',id:'nums',values:NUMS,pointers:[{name:'i',index:ptr,role:'active'}]},{type:'hashmap',id:'seen',entries:mapEntries(m,hk)},{type:'variables',id:'vars',values:vars}];
  const steps: VisualizationStep[]=[]; let id=0; const seen=new Map<number,number>(); const push=(s: Emit)=>steps.push({id:id++,...s});
  push({description:`Find two indices whose values sum to ${TARGET}. We keep a hashmap of value → index as we scan.`,variables:{target:TARGET},components:snap(seen,{target:TARGET},0),codeLine:2,result:'[]'});
  for(let i=0;i<NUMS.length;i++){
    const need=TARGET-NUMS[i];
    push({description:`At i=${i}, nums[i]=${NUMS[i]}. The complement we need is ${TARGET} − ${NUMS[i]} = ${need}. Look it up in the map.`,variables:{i,'nums[i]':NUMS[i],need},components:snap(seen,{i,need},i,seen.has(need)?need:undefined),highlights:[{component:'nums',indices:[i],role:'active'}],calculation:`need = ${TARGET} − ${NUMS[i]} = ${need}`,codeLine:4,result:'[]'});
    if(seen.has(need)){ const j=seen.get(need)!; push({description:`${need} is already in the map at index ${j}. So nums[${j}] + nums[${i}] = ${NUMS[j]} + ${NUMS[i]} = ${TARGET}. Return [${j}, ${i}].`,variables:{i,need,foundIndex:j},components:snap(seen,{i,need},i,need),highlights:[{component:'nums',indices:[j,i],role:'result'}],codeLine:6,result:`[${j}, ${i}]`}); return finalizeTwoSum(steps); }
    seen.set(NUMS[i],i);
    push({description:`${need} was not found. Store nums[${i}]=${NUMS[i]} → ${i} in the map for future lookups.`,variables:{i,'nums[i]':NUMS[i]},components:snap(seen,{i},i,NUMS[i]),highlights:[{component:'nums',indices:[i],role:'push'}],codeLine:7,result:'[]'});
  }
  push({description:'No pair sums to the target.',variables:{},components:snap(seen,{},NUMS.length-1),codeLine:9,result:'[]'});
  return finalizeTwoSum(steps);
}

export function finalizeTwoSum(steps: VisualizationStep[]): Visualization { return {title:'Two Sum',algorithm:'HashMap',complexity:{time:'O(n)',space:'O(n)'},components:[{type:'array',id:'nums',label:'nums',showIndices:true},{type:'hashmap',id:'seen',label:'seen (value → index)'},{type:'variables',id:'vars',label:'variables'}],sourceCode:{language:'cpp',code:`vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int,int> seen;      // value -> index\n    for (int i = 0; i < nums.size(); i++) {\n        int need = target - nums[i];\n        if (seen.count(need))\n            return { seen[need], i };\n        seen[nums[i]] = i;\n    }\n    return {};\n}`},steps}; }

export function buildValidParentheses(): Visualization {
  const INPUT='()[{}]', CHARS=INPUT.split('');
  const PAIRS: Record<string,string>={')':'(',']':'[','}':'{'};
  const snap=(stack: string[],vars: Vars,ptr: number): ComponentState[]=>[{type:'array',id:'s',values:CHARS,pointers:[{name:'i',index:ptr,role:'active'}]},{type:'stack',id:'stack',values:[...stack]},{type:'variables',id:'vars',values:vars}];
  const steps: VisualizationStep[]=[]; let id=0; const stack: string[]=[]; const push=(s: Emit)=>steps.push({id:id++,...s});
  push({description:`Check whether "${INPUT}" is balanced. Push opening brackets; on a closing bracket, the top must be its matching opener.`,variables:{},components:snap(stack,{},0),codeLine:2,result:'?'});
  for(let i=0;i<CHARS.length;i++){
    const c=CHARS[i], isOpen=(c==='('||c==='['||c==='{');
    if(isOpen){ stack.push(c); push({description:`'${c}' is an opening bracket — push it onto the stack.`,variables:{i,c},components:snap(stack,{i,c},i),highlights:[{component:'s',indices:[i],role:'push'}],codeLine:5,result:'?'}); }
    else{ const expected=PAIRS[c], top=stack[stack.length-1];
      if(stack.length===0||top!==expected){ push({description:`'${c}' is a closing bracket. The stack top is ${top?`'${top}'`:'empty'}, which does not match the required '${expected}'. The string is invalid.`,variables:{i,c,expected:expected??'',top:top??''},components:snap(stack,{i,c},i),highlights:[{component:'s',indices:[i],role:'pop'}],codeLine:7,result:false}); return finalizeVP(steps); }
      push({description:`'${c}' closes the matching '${top}' on top of the stack — pop it.`,variables:{i,c,matched:top},components:snap(stack,{i,c},i),highlights:[{component:'s',indices:[i],role:'active'}],codeLine:9,result:'?'}); stack.pop();
    }
  }
  const valid=stack.length===0;
  push({description:valid?'The whole string is consumed and the stack is empty — every bracket was matched. Valid.':'The string ended but the stack still has unmatched openers. Invalid.',variables:{},components:snap(stack,{},CHARS.length-1),codeLine:12,result:valid});
  return finalizeVP(steps);
}

export function finalizeVP(steps: VisualizationStep[]): Visualization { return {title:'Valid Parentheses',algorithm:'Stack',complexity:{time:'O(n)',space:'O(n)'},components:[{type:'array',id:'s',label:'s',showIndices:true},{type:'stack',id:'stack',label:'stack'},{type:'variables',id:'vars',label:'variables'}],sourceCode:{language:'cpp',code:`bool isValid(string s) {\n    stack<char> st;\n    for (char c : s) {\n        if (c=='(' || c=='[' || c=='{') {\n            st.push(c);\n        } else {\n            if (st.empty() || st.top() != match(c))\n                return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}`},steps}; }

export function buildReverseLinkedList(): Visualization {
  const VALUES=[1,2,3,4,5], NODE_IDS=VALUES.map((_,i)=>`n${i}`);
  const SOURCE=`ListNode* reverse(ListNode* head) {\n    ListNode* prev = nullptr;\n    ListNode* curr = head;\n    while (curr != nullptr) {\n        ListNode* next = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = next;\n    }\n    return prev;\n}`;
  const nodesInOrder=(order: number[])=>order.map(idx=>({id:NODE_IDS[idx],value:VALUES[idx]}));
  const snap=(order: number[],prev: number|null,curr: number|null,next: number|null): ComponentState[]=>{ const pointers: {name:string;nodeId:string|null;role?:Role}[]=[{name:'prev',nodeId:prev===null?null:NODE_IDS[prev],role:'visited'},{name:'curr',nodeId:curr===null?null:NODE_IDS[curr],role:'active'},{name:'next',nodeId:next===null?null:NODE_IDS[next],role:'boundary'}]; return [{type:'linkedlist',id:'list',nodes:nodesInOrder(order),pointers},{type:'variables',id:'vars',values:{prev:prev===null?'null':VALUES[prev],curr:curr===null?'null':VALUES[curr],next:next===null?'null':VALUES[next]}}]; };
  const steps: VisualizationStep[]=[]; let id=0; const push=(s: Emit)=>steps.push({id:id++,...s}); const vAt=(i: number|null): number|string=>i===null?'null':VALUES[i];
  const reversed: number[]=[], remaining=VALUES.map((_,i)=>i);
  let prev: number|null=null, curr: number|null=0; const order=(): number[]=>[...reversed,...remaining];
  push({description:'Reverse the list iteratively with three pointers: prev (built-up reversed list), curr (node under work), next (lookahead so we do not lose the rest).',variables:{},components:snap(order(),prev,curr,null),codeLine:3,result:'null'});
  while(curr!==null){
    const next: number=curr+1<VALUES.length?curr+1:-1;
    const nextVal: number|null=next===-1?null:next;
    push({description:`Save next = ${vAt(nextVal)} so we don't lose the rest of the list.`,variables:{prev:vAt(prev),curr:vAt(curr),next:vAt(nextVal)},components:snap(order(),prev,curr,nextVal),codeLine:5,result:vAt(prev)});
    remaining.shift(); reversed.unshift(curr);
    push({description:`Point curr (${vAt(curr)}) back at prev. Node ${vAt(curr)} is now the new head of the reversed portion.`,variables:{prev:vAt(curr),curr:vAt(nextVal)},components:snap(order(),curr,nextVal,null),codeLine:6,result:vAt(curr)});
    prev=curr; curr=nextVal;
  }
  push({description:`curr is null — the whole list is reversed. Return prev (${vAt(prev)}), the new head.`,variables:{head:vAt(prev)},components:snap(order(),prev,null,null),codeLine:10,result:vAt(prev)});
  return {title:'Reverse Linked List',algorithm:'Iterative Pointers',complexity:{time:'O(n)',space:'O(1)'},components:[{type:'linkedlist',id:'list',label:'list'},{type:'variables',id:'vars',label:'pointers'}],sourceCode:{language:'cpp',code:SOURCE},steps};
}

export function graphBase(){
  const NODES: GraphNode[]=[{id:'A',x:0.5,y:0.12},{id:'B',x:0.22,y:0.42},{id:'C',x:0.78,y:0.42},{id:'D',x:0.1,y:0.82},{id:'E',x:0.4,y:0.82},{id:'F',x:0.9,y:0.82}];
  const EDGES: GraphEdge[]=[{from:'A',to:'B'},{from:'A',to:'C'},{from:'B',to:'D'},{from:'B',to:'E'},{from:'C',to:'F'}];
  const ADJ: Record<string,string[]>={A:['B','C'],B:['D','E'],C:['F'],D:[],E:[],F:[]};
  const gs=(roles: Record<string,Role>,activeEdges: string[]=[]): ComponentState=>({type:'graph',id:'graph',nodes:NODES,edges:EDGES,nodeRoles:{...roles},activeEdges});
  return {NODES,EDGES,ADJ,gs};
}

export function buildBFS(): Visualization {
  const {ADJ,gs}=graphBase();
  const SOURCE=`void bfs(Graph& g, char start) {\n    queue<char> q;\n    q.push(start);\n    visited.insert(start);\n    while (!q.empty()) {\n        char u = q.front(); q.pop();\n        for (char v : g.adj[u]) {\n            if (!visited.count(v)) {\n                visited.insert(v);\n                q.push(v);\n            }\n        }\n    }\n}`;
  const steps: VisualizationStep[]=[]; let id=0; const push=(s: Emit)=>steps.push({id:id++,...s});
  const roles: Record<string,Role>={}, queue: string[]=['A'], visited=new Set<string>(['A']); roles['A']='active'; const order: string[]=[];
  push({description:'BFS from A. Enqueue the start node and mark it visited. BFS explores level by level using a FIFO queue.',variables:{start:'A'},components:[gs(roles),{type:'queue',id:'queue',values:[...queue]},{type:'variables',id:'vars',values:{order:order.join(' ')||'—'}}],codeLine:4,result:''});
  while(queue.length>0){
    const u=queue.shift()!; roles[u]='active'; order.push(u);
    push({description:`Dequeue ${u} and visit it. Now look at its neighbours.`,variables:{u,order:order.join(' ')},components:[gs(roles),{type:'queue',id:'queue',values:[...queue]},{type:'variables',id:'vars',values:{u,order:order.join(' ')}}],codeLine:6,result:order.join(' ')});
    for(const v of ADJ[u]){ if(!visited.has(v)){ visited.add(v); queue.push(v); roles[v]='push';
      push({description:`Neighbour ${v} is unvisited — mark it visited and enqueue it.`,variables:{u,v,order:order.join(' ')},components:[gs(roles,[`${u}->${v}`]),{type:'queue',id:'queue',values:[...queue]},{type:'variables',id:'vars',values:{u,v,order:order.join(' ')}}],codeLine:9,result:order.join(' ')}); } }
    roles[u]='visited';
  }
  push({description:`Queue empty — BFS complete. Visit order: ${order.join(' → ')}.`,variables:{order:order.join(' ')},components:[gs(roles),{type:'queue',id:'queue',values:[]},{type:'variables',id:'vars',values:{order:order.join(' ')}}],codeLine:12,result:order.join(' ')});
  return {title:'Breadth-First Search',algorithm:'BFS (Queue)',complexity:{time:'O(V + E)',space:'O(V)'},components:[{type:'graph',id:'graph',label:'graph'},{type:'queue',id:'queue',label:'queue (frontier)'},{type:'variables',id:'vars',label:'variables'}],sourceCode:{language:'cpp',code:SOURCE},steps};
}

export function buildDFS(): Visualization {
  const {ADJ,gs}=graphBase();
  const SOURCE=`void dfs(Graph& g, char start) {\n    stack<char> st;\n    st.push(start);\n    while (!st.empty()) {\n        char u = st.top(); st.pop();\n        if (visited.count(u)) continue;\n        visited.insert(u);\n        for (char v : g.adj[u])\n            if (!visited.count(v))\n                st.push(v);\n    }\n}`;
  const steps: VisualizationStep[]=[]; let id=0; const push=(s: Emit)=>steps.push({id:id++,...s});
  const roles: Record<string,Role>={}, stack: string[]=['A'],
    visited=new Set<string>(), order: string[]=[]; roles['A']='push';
  push({description:'DFS from A using an explicit stack (LIFO). Push the start node.',variables:{start:'A'},components:[gs(roles),{type:'stack',id:'stack',values:[...stack]},{type:'variables',id:'vars',values:{order:'—'}}],codeLine:3,result:''});
  while(stack.length>0){
    const u=stack.pop()!; if(visited.has(u))continue; visited.add(u); order.push(u); roles[u]='active';
    push({description:`Pop ${u} from the stack and visit it.`,variables:{u,order:order.join(' ')},components:[gs(roles),{type:'stack',id:'stack',values:[...stack]},{type:'variables',id:'vars',values:{u,order:order.join(' ')}}],codeLine:7,result:order.join(' ')});
    for(const v of ADJ[u]){ if(!visited.has(v)){ stack.push(v); roles[v]='push';
      push({description:`Push unvisited neighbour ${v} onto the stack for later exploration.`,variables:{u,v,order:order.join(' ')},components:[gs(roles,[`${u}->${v}`]),{type:'stack',id:'stack',values:[...stack]},{type:'variables',id:'vars',values:{u,v,order:order.join(' ')}}],codeLine:9,result:order.join(' ')}); } }
    roles[u]='visited';
  }
  push({description:`Stack empty — DFS complete. Visit order: ${order.join(' → ')}.`,variables:{order:order.join(' ')},components:[gs(roles),{type:'stack',id:'stack',values:[]},{type:'variables',id:'vars',values:{order:order.join(' ')}}],codeLine:11,result:order.join(' ')});
  return {title:'Depth-First Search',algorithm:'DFS (Stack)',complexity:{time:'O(V + E)',space:'O(V)'},components:[{type:'graph',id:'graph',label:'graph'},{type:'stack',id:'stack',label:'stack'},{type:'variables',id:'vars',label:'variables'}],sourceCode:{language:'cpp',code:SOURCE},steps};
}
