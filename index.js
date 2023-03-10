import cartesianProduct from "just-cartesian-product";
import powersetStream from "powerset-stream";

async function* streamer(items) {
  for await (const hand of powersetStream(items)) {
    if (hand.length < 5) continue;
    yield new Set(hand);
  } 
}

async function* choose() {
  const uniques = ['',''].map(() => [...Array(UNIQUE).keys()]);
  const dominos = cartesianProduct(uniques).filter(([a,b]) => {
//    return a <= b; //doubles
    return a < b; //no doubles
  });
  const stream = streamer(dominos.map(a => new Set(a)));
  while (true) {
    const {value} = await stream.next(); 
    if (value.size <= 5) yield value;
    else process.exit(0)
//    else Promise.reject(stream);
  }
}

const UNIQUE = 7;
const STATION = 0;
const stat = new Set([STATION,STATION])

const xa = new Set([STATION,1])
const xb = new Set([STATION,2])
const xc = new Set([STATION,3])
const xd = new Set([STATION,4])
const xe = new Set([STATION,5])
const ax = xa
const bx = xb
const cx = xc
const dx = xd
const ex = xe

const ab = new Set([1,2])
const ac = new Set([1,3])
const ad = new Set([1,4])
const ae = new Set([1,5])
const af = new Set([1,6])

const ba = ab
const bc = new Set([2,3])
const bd = new Set([2,4])
const be = new Set([2,5])
const bf = new Set([2,6])

const ca = ac
const cb = bc
const cd = new Set([3,4])
const ce = new Set([3,5])
const cf = new Set([3,6])

const da = ad
const db = bd
const dc = cd
const de = new Set([4,5])
const df = new Set([4,6])

const ea = ae
const eb = be
const ec = ce
const ed = de
const ef = new Set([5,6])

const fa = af
const fb = bf
const fc = cf
const fd = df
const fe = ef

const s = (v,w,x,y,z) => new Set([v,w,x,y,z])
// s in [0,5]  u in [0,2]
// l in [3,5]  t in [0,5]
// impossible:
// !s0 & u2 & (t!=t3)

// no station, train 0
const s0u0l5t0 = s(ab,bc,cd,de,ea)
// three links is minimum
const s2u0l3t1 = s(xa, xb, cd, de, ef)
// five links is maximum
const s1u0l5t5 = s(xa, ab, bc, cd, dx)
// !s0 & u1 & t1 -> (s4 & l4) | s1
// one unmatched, train 1 
const s4u1l4t1 = s(xa, xb, xc, xd, ef)
const s1u1l4t1 = s(xa, bc, bd, be, bf)
const s1u1l3t1 = s(xa, bc, cd, de, ef)
// one unmatched, train 2
const s1u1l3t2 = s(xa, ab, ac, ad, ef)
// one unmatched, train 3
const s1u1l3t3 = s(xa, ab, bc, bd, ef)
// one unmatched, train 4 
const s1u1l3t4 = s(xa, ab, bc, cd, ef)
const s1u1l4t4 = s(xa, ab, bc, cx, ef)
// !s0 & u2 -> t3
// two unmatched, train 3 // u2 -> IJ IK JK
const s4u2l3t3 = s(xa, xb, ab, cd, ef)

const max = fn => sets => Math.max(0, ...[...sets].map(fn));
const count = fn => sets => filter(fn)(sets).length;
const filter = fn => sets => [...sets].filter(fn);
const find = fn => sets => [...sets].find(fn);
// if unqiue dominos match
const edge = (i, j) => {
  const has = j.has.bind(j)
  return [...i].some(has) && ![...i].every(has)
}
// matched dominos in [0,2]
const is_ok = (i, _, sets) => (
  find(j => edge(i,j))(sets)
)
const to_ok = filter(is_ok);
const to_n_ok = count(is_ok);
// count dominos with odd edges
const to_n_odd = count((i, _, sets) => {
  return count(j => edge(i,j))(sets) % 2;
});
// max of edges of dominos matching station
const to_ms = max((i, _, sets) => {
  if (!i.has(STATION)) return 0; // not match station
  return count(j => edge(i,j))(sets);
})
// dominos matching station [0,5]
const to_n_s = count(set => set.has(STATION));
const to_all_s = filter(set => set.has(STATION));
// measure graph with 4 of 5 connected
const _measure_4 = (start_sets) => {
  return (_sets) => {
    const sets = filter(is_ok)(_sets);
    if (to_n_s(sets) === 0) return 0;
    /* Given constraints, train length is funcion
     * of sum of odd nodes and max station edges */
    const path = 1 + new Map([
      [2,3], [3,3], [4,2], [5,2], [7,1]
    ]).get(to_n_odd(sets) + to_ms(sets));
    const { starts } = _to_out(sets, path);
    // Add all starts to possible starts for path
    if (start_sets !== null) {
      [...starts].map(start => start_sets.get(path).add(start))
    }
    return path
  }
}
// Separate 4-sized subgraphs from station nodes
const to_sub4 = (sets) => {
  return [...sets].reduce(((o,i) => {
    if (!i.has(STATION)) return o;
    const alt = find(v => v !== STATION)(i);
    const rest = new Set(sets);
    rest.delete(i);
    // station alternative, rest of graph
    o.add([ alt, rest ]);
    return o;
  }), new Set());
}
// Shift sets to treat n as STATION
const shift_stat = (n, sets) => {
  return new Set([...sets].map(i => {
    return new Set([...i].map(v => (
      (UNIQUE + STATION + v - n) % UNIQUE
    )));
  }));
}

const _to_out = (starts, train) => {
  const path = starts.size ? train : 0;
  return { path, starts };
}

const to_out = (start_sets, train) => {
  const starts = [5,4,3,2,1].reduce((o, i) => {
    if (o.size) return o;
    return start_sets.get(i);
  }, new Set());
  return _to_out(starts, train);
}

const measure_3 = (start_sets) => {
  return (sets) => {
    start_sets.set(3, to_all_s(to_ok(sets)));
    return to_out(start_sets, 3);
  }
}

const measure_4 = (start_sets) => {
  const to_path = _measure_4(start_sets);
  return (sets) => {
    const path = to_path(sets);
    return to_out(start_sets, path);
  }
}

const measure_5 = (start_sets) => {
  // TODO... shouldn't add 4's start to set
  // should add higher-level 5's start
  const to_path = _measure_4(start_sets);
  return (sets) => {
    const path = max(([alt, rest]) => {
      const alt_rest = shift_stat(alt, rest)
      const subsets = new Set([rest, alt_rest]);
      return 1 + max(to_path)(subsets);
    })(to_sub4(sets));
    return to_out(start_sets, path);
  }
}

// measure max train length
const measure = (sets) => {
  const start_sets = new Map([
    [0, new Set], [1, new Set], [2, new Set],
    [3, new Set], [4, new Set], [5, new Set],
  ]);
  if (to_n_s(sets) === 0) {
    return to_out(start_sets, 0);
  }
  switch (to_n_ok(sets)) {
    case 3: return measure_3(start_sets)(sets);
    case 4: return measure_4(start_sets)(sets);
    default: return measure_5(start_sets)(sets);
  }
}

// 20349 possible (7 choose 2) chose 5
// Not currently considering doubles

const log_hand = set => [...set].map(([x,y]) => `[${x}|${y}]`).join(' ');
const log_train = ({path, starts}) => `${path} with ${log_hand(starts)}`;
async function main() {
  for await (const hand of choose()) {
    const train = measure(hand);
    if (train.path === 0) continue;
    console.log(log_hand(hand), ' train: ', log_train(train));
  };
}
console.log(main())
