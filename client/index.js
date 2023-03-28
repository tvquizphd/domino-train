import { reactive, html } from '@arrow-js/core'
import ArrowTags from 'arrow-tags';

const MIN_NODE = 0;
const MAX_NODE = 6;
const STATION = MIN_NODE;
const N_NODES = 1 + MAX_NODE - MIN_NODE;

const ev = fn => (d, { target: t }) => fn(d, t);

const matchLink = (edges, edge) => {
  const match = x => y => x.every(z => y.includes(z));
  return edges.find(match(edge));
}

const matchNode = (edges, edge) => {
  const match = x => y => x.some(z => y.includes(z));
  return edges.find(match(edge));
}

const matchNodeCount = (edges, edge) => {
  const match = x => y => x.some(z => y.includes(z));
  return edges.reduce((o, e) => o +!!match(edge)(e), 0);
}

const toDegree = (edges, value) => {
  return matchNodeCount(edges, [value]);
}

const toDegrees = (edges) => {
  return edges.reduce((o, e) => {
    return e.reduce((o, v) => {
      if (o.has(v)) return o; 
      o.set(v, toDegree(edges, v));
      return o;
    }, o);
  }, new Map)
}

const toSetups = (stat, edges, fn) => {
  return edges.reduce((o, e1, i) => {
    const found = e1.indexOf(stat);
    if (found === 0 || found === 1) {
      return o.concat(edges.reduce((o, e2, j) => {
        if (i === j) return o;
        if (!e2.filter(fn).length) return o;
        return [...o, [i, j]];
      }, []));
    }
    return o;
  }, []);
}

const Root = (button, _, fn) => {
  const props = {
    style: `
      display: grid;
      overflow: scroll;
      align-content: center;
      justify-content: center;
      grid-template-rows: 10vh auto auto 2fr;
    `,
    '@click': ev(setDominos)
  };
  const { Div } = ArrowTags;
  const pad = Div`${' '}`;
  return Div`${pad}${button}${fn}`(props);
}

const Button = (text) => {
  const props = {
    style: `
      border: none;
      color: inherit;
      cursor: pointer;
      outline: inherit;
      font-size: 175%;
      padding: 1rem 2rem;
      margin-bottom: 2rem;
      background: lavender;
      border-radius: 0.25rem;
      font-family: Optima, Candara, sans-serif;
      box-shadow: 0px 0px 3px 1px rgba(0, 0, 0, 0.20), 
                -3px 5px 6px 0px rgba(0, 0, 0, 0.20);
    `
  };
  const { Button } = ArrowTags;
  return Button`${text}`(props);
}

const Table = (child, x_label, y_label) => {
  const props = {
    style: `
      margin: 0;
      gap: 0 .25em;
      display: grid;
      padding: 1rem;
      font-size: 150%;
      max-width: 300px;
      font-family: sans-serif;
      grid-template-rows: auto auto;
      grid-template-columns: auto 1fr;
    `
  };
  const { Div } = ArrowTags;
  const pad = Div`${' '}`;
  return Div`${y_label}${child}${pad}${x_label}`(props);
}

const List = (flow, fn, opts) => {
  const style = opts?.style || '';
  const props = {
    style: `
      ${style}
      margin: 0;
      padding: 0;
      list-style-type: none;
      grid-auto-${flow}s: 1fr;
      grid-auto-flow: ${flow};
      display: grid;
    `
  };
  const { Ul } = ArrowTags;
  return Ul`${fn}`(props);
}

const Tiles = (fn) => {
  const opts = {
    style: `
      grid-template-columns: repeat(${N_NODES-1}, 1fr);
    `
  };
  return List('row', fn, opts);
}

const toItem = (v, key) => {
  const { Li } = ArrowTags;
  const style = `
    white-space: nowrap;
    text-align: center;
  `;
  const props = { html, style, key };
  return Li`${() => v}`(props);
}

const toTriangle = (edges, columns, rows) => {
  return [].concat(...rows.map(row => {
    return columns.map(col => {
      const edge = [row, col];
      if (col >= row || !matchLink(edges, edge)) {
        return [];
      }
      return [col, row];
    })
  }))
}

const toTable = ({ dominos, nodes }) => {
  const opts = ['', '', 'X'];
  const x_label = nodes.slice(0, -1);
  const y_label = x_label.map(col => col + 1);
  const tri = toTriangle(dominos, x_label, y_label);
  const rows = tri.map(v => opts[v.length])
  return { rows, x_label, y_label };
}

const countUnmatched = edges => {
  const count = edges.reduce((count, edge, i) => {
    const other = [...edges];
    other.splice(i, 1);
    return count + !matchNode(other, edge);
  }, 0);
  return count;
}

const addRandom = (set, len, hand_total=4) => {
  const random_float = Math.random() * len;
  const random = Math.round(random_float);
  if (set.size >= hand_total) return [...set];
  if (!set.has(random)) set.add(random);
  return addRandom(set, len, hand_total);
}

const setDominos = (d) => {
  const { no_doubles } = d;
  const { length } = no_doubles;
  const choose = (len) => {
    const idx = addRandom(new Set(), len);
    const edges = idx.map(i => no_doubles[i]);
    // Disallow any unmatched edges
    if (countUnmatched(edges) === 0) {
      // One edge must contain station
      if (matchNode(edges, [STATION])) {
        return edges;
      }
    }
    return choose(len);
  }
  d.dominos = choose(length-1);
  return d;
}

const toHighDegreeSum = ({ dominos, nodes }) => {
  const deg = new Map(nodes.map(n => [n, 0]));
  dominos.forEach(([x, y]) => {
    deg.set(x, deg.get(x) + 1);
    deg.set(y, deg.get(y) + 1);
  });
  return [...deg.values()].reduce((o, v) => {
    return o + (v > 1) * (v + 1);
  }, 0);
}

const toDominoGrid = (fn) => {
  const props = {
    style: `
      display: grid;
      font-size: 175%;
      grid-auto-rows: 4rem;
      grid-template-columns: repeat(4, 4rem);
      font-family: Optima, Candara, sans-serif;
      filter: drop-shadow(0px 5px 3px rgba(0, 0, 0, 0.50));
    `
  };
  const { Div } = ArrowTags;
  return Div`${fn}`(props);
}

const toNotch = () => {
  const sq_half = 100 / Math.sqrt(2);
  const hi = sq_half.toFixed(2);
  const lo = (100  - hi).toFixed(2);
  return {
    lo: lo + '%', hi: hi + '%'
  };
}

const invertMap = (entries) => {
  return entries.reduce((o, [k, v]) => {
    return v.reduce((o, i) => {
      return o.set(i, k);
    }, o);
  }, new Map);
}

const toBlockLabel = (labels) => {
  const map = invertMap(labels);
  return (idx) => {
    if (map.has(idx)) return map.get(idx);
    return '';
  }
}

const toBlock = (prefix) => {
  return ({ type, face, col }, idx) => {
    const { lo, hi } = toNotch();
    const key = `${prefix}-${idx}`;
    const basic = `
      display: grid;
      color: Cornsilk;
      align-content: center;
      justify-content: center;
      background-color: ${col};
    `
    const style = new Map([
      [ 'header', `
        ${basic}
        color: black;
        grid-column: 1 / -1;
        align-content: end;
      `],
      [ 'info', `
        ${basic}
        color: black;
      `],
      [ '[', `
        ${basic}
        margin: 4px;
        margin-right: 0px;
      `],
      [']', `
        ${basic}
        margin: 4px;
        margin-left: 0px;
      `],
      ['⎴', `
        ${basic}
        margin: 4px;
        margin-bottom: 0px;
      `],
      ['⎵', `
        ${basic}
        margin: 4px;
        margin-top: 0px;
      `],
      ['┏', `
        ${basic}
        margin-top: 2px;
        margin-left: 2px;
        padding-top: 1rem;
        padding-left: 1rem;
        clip-path: polygon(100% 100%, 100% ${lo}, ${hi} 0, 0 ${hi}, ${lo} 100%);
      `],
      ['┛', `
        ${basic}
        margin-bottom: 2px;
        margin-right: 2px;
        padding-right: 1rem;
        padding-bottom: 1rem;
        clip-path: polygon(0 0, ${hi} 0, 100% ${lo}, ${lo} 100%, 0% ${hi});
      `],
      ['╰', `
        ${basic}
        margin-top: -1px;
        margin-right: -1px;
        clip-path: polygon(100% 0, 100% ${hi}, ${lo} 0);
      `],
      ['╮', `
        ${basic}
        margin-left: -1px;
        margin-bottom: -1px;
        background-color: ${col};
        clip-path: polygon(0 100%, 0 ${lo}, ${hi} 100%);
      `]
    ]).get(type) || '';
    const { Div } = ArrowTags;
    return Div`${face}`({ html, style, key });
  }
}

const toPrefix = (stat, faces, blocks) => {
  return [...faces, ...blocks].map((v) => {
    return v === stat || isNaN(v) ? v : 'x';
  }).join('-');
}

const readBlocks = (blocks, labels, ends=[]) => {
  const labeler = toBlockLabel(labels);
  return blocks.reduce((o, type, idx) => {
    const end_count = o.end_count || 0;
    const vals = o.vals || [];
    const label = labeler(idx);
    const is_end = '□' === label;
    const is_start = 0 === label;
    const is_empty = '' === label;
    const faces = [label, ends[end_count] || '?'];
    const col = is_empty ? 'rgba(70,100,100,0.5)' : [
      ['#235E5E', '#182828'],
      ['DarkCyan', 'DarkCyan']
    ][+is_start][+is_end];
    const v = {
      type, col, face: () => faces[+is_end]
    }
    return {
      end_count: end_count + is_end,
      vals: [...vals, v]
    }
  }, {}).vals;
}

const toInfo = (edges, paths) => {
  const e0 = paths[0][0];
  const missing = edges.filter(e => {
    for (const path of paths) {
      if (matchLink(path, e0) && matchLink(path, e)) {
        return false;
      }
    }
    return true;
  });
  const lost = missing.map(e => {
    const face = () => `[${e.join(':')}]`;
    return { type: 'info', col: 'none', face };
  });
  const adj = {
    1: 'No', 2: 'Half', 3: '3/4', 4: 'Full'
  }[paths[0].length] || 'Unknown';
  const info = `${adj} train` + [', missing:', '!'][+!lost.length];
  const header = {
    type: 'header', col: 'none', face: () => info 
  };
  return [header, ...lost];
}

const toMethylcyclopropane = (stat, d) => {
  const blocks = [
    ' ', '⎴', '┏', '╮',
    ' ', '⎵', '╰', '┛',
    '[', ']', '[', ']'
  ];
  const edges = d.dominos;
  const degrees = toDegrees(edges);
  const setups = toSetups(stat, edges, (v) => {
    return (degrees.get(v) % 2 === 1);
  });
  const max = [3, 4][+(degrees.get(stat) === 1)];
  const paths = linkChains(stat, setups, edges, max);
  const faces = (nums => {
    const err = ['x₁', 'x₂', 'x₃', 'x₄'];
    if (degrees.get(stat) === 2) {
      return {
        3: ['□', ...nums.reverse()],
      }[nums.length] || err;
    }
    return {
      4: [...nums],
      3: ['', ...nums],
    }[nums.length] || err;
  })(readPath(stat, paths[0]));
  const [A, B, C, D] = faces;
  const ends = toEnds(stat, paths);

  const Ba = ['', B][+(A !== '')];
  const labels = [
    [A, [8]],
    [Ba, [9]],
    [B, [10, 5]],
    [C, [6, 7, 11]], 
    [D, [1, 2, 3]]
  ];
  const pre = toPrefix(stat, faces, blocks);
  const vals = readBlocks(blocks, labels, ends);
  const out = [...vals, ...toInfo(edges, paths)];
  return out.map(toBlock(pre, labels, ends));
}

const toStartStop = (chain) => {
  if (chain.length >= 1) {
    const e = chain.length - 1;
    const start = chain[0][0];
    const stop = chain[e][1];
    return { start, stop };
  }
  const start = stop = NaN;
  return { start, stop };
}

const orderEdge = (edge) => {
  return [[...edge], [...edge].reverse()];
}

const joinChains = station => {
  return (ch1, ch2, edge) => {
    const ch1s = toStartStop(ch1);
    const ch2s = toStartStop(ch2);
    for (const e of orderEdge(edge)) {
      if (ch1s.stop === e[0] && ch2s.start === e[1]) {
      return !!ch1.push(e, ...ch2.splice(0));
      }
      if (ch2s.stop === e[0] && ch1s.start === e[1]) {
        return !!ch2.push(e, ...ch1.splice(0));
      }
      if (ch2s.stop === e[0] && ch1s.stop === e[1]) {
        const [keep, lose] = ch1s.start === station ? [ch1, ch2] : [ch2, ch1];
        return !!keep.push(e, ...lose.splice(0).reverse());
      }
    }
    return false;
  }
}

const addChain = station => {
  return (ch1, edge) => {
    const {start, stop} = toStartStop(ch1);
    const edge_rev = [...edge].reverse();
    for (const e of orderEdge(edge)) {
      if (stop === e[0]) return !!ch1.push(e);
      if (start === e[1]) return !!ch1.unshift(e); //TODO
    }
    return false;
  }
}

const isChain = (stat, list) => {
  let last = list[0].find(v => v !== stat);
  for (const next of list.slice(1)) {
    const found = next.filter(v => v!== last);
    if (found.length !== 1) return false;
    last = found[0];
  }
  return true;
}

const toRest = (edges, i, j) => {
  return edges.filter((_, k) => k!==i && k!==j);
}

const linkChains = (stat, setups, edges, max=4) => {
  if (max >= 4) {
    const train4 = setups.reduce((o, [i, j]) => {
      const [one, two] = toRest(edges, i, j);
      const opt1 = [edges[i], one, two, edges[j]];
      const opt2 = [edges[i], two, one, edges[j]];
      if (isChain(stat, opt1)) return [...o, opt1];
      if (isChain(stat, opt2)) return [...o, opt2];
      return o;
    }, []);
    if (train4.length) return train4;
  }
  if (max >= 3) {
    const train3 = setups.reduce((o, [i, j]) => {
      const [one, two] = toRest(edges, i, j);
      const opt1 = [edges[i], one, edges[j]];
      const opt2 = [edges[i], two, edges[j]];
      if (isChain(stat, opt1)) return [...o, opt1];
      if (isChain(stat, opt2)) return [...o, opt2];
      return o;
    }, []);
    if (train3.length) return train3;
  }
  const train2 = setups.reduce((o, [i, j]) => {
    const opt1 = [edges[i], edges[j]];
    if (isChain(stat, opt1)) return [...o, opt1];
    return o;
  }, []);
  if (train2.length) return train2;
  const unique = new Set();
  return setups.reduce((o, [i]) => {
    if (unique.has(i)) return o;
    unique.add(i);
    return [...o, [edges[i]]];
  }, []);
}

const toPaths = (station, edges) => {
  const joiner = joinChains(station);
  const adder = addChain(station);
  const chains = []
  const mid_edges = edges.reduce((o, e) => {
    const edge = matchNode(orderEdge(e), [station]);
    if (edge === undefined) return [...o, e];
    chains.push([edge]);
    return o;
  }, []);
  mid_edges.forEach((e) => {
    for (const ch1 of chains) {
      // Edge joins two chains
      for (const ch2 of chains) {
        if (joiner(ch1, ch2, e)) return;
      }
      // Edge added to chain
      if (adder(ch1, e)) return;
    }
    chains.push([[...e]]);
  });
  const out = chains.filter(chain => {
    const { start } = toStartStop(chain);
    if (start !== station) return false;
    return true;
  });
  return out.sort((a,b) => b.length - a.length);
}

const flip = (prior, edge) => {
  const ordered = prior === edge[0];
  return orderEdge(edge)[+!ordered];
}

const readPath = (stat, path) => {
  const first = flip(stat, path[0]);
  return path.slice(1).reduce((o, e) => {
    const prior = [...o].pop()[1];
    return [...o, flip(prior, e)];
  }, [first]).map(([v]) => v);
}

const toEnds = (stat, paths) => {
  return [...paths].map(p => {
    const penultimate = readPath(stat, p).pop();
    const edge = [...p].pop();
    if (penultimate === edge[0]) {
      return edge[1];
    }
    return edge[0];
  }).sort((a,b) => b-a);
}

const toCyclobutane = (stat, d) => {
  const blocks = [
    '⎴', '[', ']', ' ',
    '⎵', ' ', '⎴', ' ',
    '[', ']', '⎵', ' '
  ];
  const edges = d.dominos;
  const setups = toSetups(stat, edges, (v) => {
    return v === stat; 
  });
  const paths = linkChains(stat, setups, edges, 4);
  const faces = readPath(stat, paths[0]);
  const ends = toEnds(stat, paths);
  const [A, B, C, D] = faces;

  const labels = [
    [A, [0, 1]], [B, [2, 6]], 
    [C, [10, 9]], [D, [8, 4]], 
  ];
  const pre = toPrefix(stat, faces, blocks);
  const vals = readBlocks(blocks, labels, ends);
  const out = [...vals, ...toInfo(edges, paths)];
  return out.map(toBlock(pre, labels, ends));
}
const toIsopentane = (stat, d) => {
  const blocks = [
    ' ', ' ', '[', ']',
    '⎴', '[', ']', ' ',
    '⎵', ' ', '[', ']',
  ];
  const edges = d.dominos;
  const degrees = toDegrees(edges);
  const setups = toSetups(stat, edges, (v) => {
    return degrees.get(v) === 1;
  });
  const max = [2, 3][+(degrees.get(stat) === 1)];
  const paths = linkChains(stat, setups, edges, max);
  const faces = (nums => {
    const err = ['x₁', 'x₂', 'x₃', 'x₄', 'x₅'];
    if (degrees.get(stat) === 2) {
      return {
        2: ['', ...nums, '□', '□']
      }[nums.length] || err;
    }
    if (degrees.get(nums[1]) === 2) {
      return {
        3: [...nums, '□', '□'],
        2: ['□', ...nums.reverse(), '', '']
      }[nums.length] || err;
    }
    return {
      3: ['□', ...nums.reverse(), ''],
      2: ['', ...nums, '□', '□']
    }[nums.length] || err;
  })(readPath(stat, paths[0]));
  const [A, B, C, D, E] = faces; 
  const ends = toEnds(stat, paths);

  const Ba = ['', B][+(A !== '')];
  const Cd = ['', C][+(D !== '')];
  const Ce = ['', C][+(E !== '')];
  const labels = [
    [A, [8]], [Ba, [4]], [B, [5]], 
    [Cd, [2]], [C, [6]], [Ce, [10]],
    [D, [3]], [E, [11]]
  ];
  const pre = toPrefix(stat, faces, blocks);
  const vals = readBlocks(blocks, labels, ends);
  const out = [...vals, ...toInfo(edges, paths)];
  return out.map(toBlock(pre, labels, ends));
}
const toNeopentane = (stat, d) => {
  const blocks = [
    '⎴', ' ', '⎴', ' ',
    '⎵', '⎴', '⎵', '⎴',
    ' ', '⎵', ' ', '⎵'
  ];
  const edges = d.dominos;
  const degrees = toDegrees(edges);
  const setups = toSetups(stat, edges, (v) => {
    return degrees.get(v) !== degrees.get(stat);
  });
  const paths = linkChains(stat, setups, edges, 2);
  const faces = (nums => {
    const err = ['x₁', 'x₂', 'x₃', 'x₄', 'x₅'];
    return {
      2: [...nums, '□', '□', '□'],
      1: ['□', ...nums, '', '', '']
    }[nums.length] || err;
  })(readPath(stat, paths[0]));
  const [A, B, C, D, E] = faces;
  const ends = toEnds(stat, paths);

  const labels = [
    [A, [0]], [B, [4,5,6,7]],
    [C, [9]], [D, [2]], [E, [11]]
  ]
  const pre = toPrefix(stat, faces, blocks);
  const vals = readBlocks(blocks, labels, ends);
  const out = [...vals, ...toInfo(edges, paths)];
  return out.map(toBlock(pre, labels, ends));
}
const toPentane = (stat, d) => {
  const blocks = [
    '⎴', ' ', ' ', '⎴',
    '⎵', ' ', '⎴', '⎵',
    '[', ']', '⎵', ' '
  ];
  const edges = d.dominos;
  const degrees = toDegrees(edges);
  const setups = toSetups(stat, edges, (v) => {
    return degrees.get(v) === 1;
  });
  const paths = linkChains(stat, setups, edges, 4);
  const faces = (nums => {
    const err = ['x₁', 'x₂', 'x₃', 'x₄', 'x₅']
    return {
      4: [...nums, '□'],
      3: ['', ...nums, '□'],
      2: ['', '', ...nums, '□'],
    }[nums.length] || err;
  })(readPath(stat, paths[0]));
  const [A, B, C, D, E] = faces;
  const ends = toEnds(stat, paths);

  const Ba = ['', B][+(A !== '')];
  const Cb = ['', C][+(B !== '')]
  const labels = [
    [A, [0]], [Ba, [4]], [B, [8]],
    [Cb, [9]], [C, [10]], [D, [6, 7]],
    [E, [3]]
  ];
  const pre = toPrefix(stat, faces, blocks);
  const vals = readBlocks(blocks, labels, ends);
  const out = [...vals, ...toInfo(edges, paths)];
  return out.map(toBlock(pre, labels, ends));
}
const toPropane = (stat, d) => {
  const blocks = [
    '⎴', ' ', '[', ']',
    '⎵', ' ', ' ', '⎴',
    '[', ']', ' ', '⎵'
  ];
  const edges = d.dominos;
  const degrees = toDegrees(edges);
  const setups = toSetups(stat, edges, (v) => {
    return degrees.get(v) !== degrees.get(stat);
  });
  const paths = linkChains(stat, setups, edges, 2);
  const faces = (nums => {
    const err = ['x₁', 'x₂', 'x₃'];
    return {
      2: [...nums, '□'],
      1: ['□', ...nums, '□']
    }[nums.length] || err;
  })(readPath(stat, paths[0]));
  const [A, B, C] = faces;
  const ends = toEnds(stat, paths);

  const labels = [
    [A, [0]], [B, [4, 8]],
    [C, [9]], ['', [2, 3, 7, 11]]
  ];
  const pre = toPrefix(stat, faces, blocks);
  const vals = readBlocks(blocks, labels, ends);
  const out = [...vals, ...toInfo(edges, paths)];
  return out.map(toBlock(pre, labels, ends));
}

const toDefault = () => {
  const toNode = index => index + MIN_NODE;
  const nodes = [...Array(N_NODES).keys()].map(toNode);
  const no_doubles = [].concat(...nodes.map(n1 => {
    return nodes.map(n2 => {
      if (n1 >= n2) return null;
      return [n1, n2];
    });
  })).filter(x => x);
  return setDominos({
    nodes, no_doubles: no_doubles
  })
}

const main = () => {
  const id = 'domino-display';
  const data = reactive(toDefault());
  const { render, Ul, _ } = ArrowTags;
  const button = Button('random');

  const table = Tiles(d => {
    return toTable(d).rows.map(toItem);
  });
  const x = List("column", d => {
    return toTable(d).x_label.map(toItem);
  });
  const y = List("row", d => {
    return toTable(d).y_label.map(toItem);
  });
  const toLabel = d => {
    const stat = STATION;
    const sum = toHighDegreeSum(d);
    switch (sum) {
      case 5:
        return toNeopentane(stat, d);
      case 6:
        return toPropane(stat, d);
      case 7:
        return toIsopentane(stat, d);
      case 9:
        return toPentane(stat, d);
      case 10:
        return toMethylcyclopropane(stat, d);
      default:
        return toCyclobutane(stat, d);
    }
  }
  const core = toDominoGrid(toLabel);
  const root = Root(button, Table(table, x, y), core);
  render(id, html, data, root);
}

export default main
