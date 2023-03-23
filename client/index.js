import { reactive, html } from '@arrow-js/core'
import ArrowTags from 'arrow-tags';

const MIN_NODE = 1;
const MAX_NODE = 7;
const N_NODES = 1 + MAX_NODE - MIN_NODE;
const toNode = index => index + MIN_NODE;

const ev = fn => (d, { target: t }) => fn(d, t);

const matchLink = (edges, edge) => {
  const match = x => y => x.every(z => y.includes(z));
  return edges.find(match(edge));
}

const matchNode = (edges, edge) => {
  const match = x => y => x.some(z => y.includes(z));
  return edges.find(match(edge));
}

const Root = (button, child) => {
  const props = {
    style: `
      height: 100%;
      display: grid;
      align-content: center;
      justify-content: center;
      grid-template-rows: 1fr auto auto 2fr;
    `,
    '@click': ev(setDominos)
  };
  const { Div } = ArrowTags;
  const pad = Div`${' '}`;
  return Div`${pad}${button}${child}`(props);
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
      grid-template-rows: auto 1em;
      grid-template-columns: 1em auto;
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
      grid-auto-${flow}s: 1em;
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
      grid-template-columns: repeat(${N_NODES-1}, 1em);
    `
  };
  return List('row', fn, opts);
}

const Item = (v, key) => {
  const { Li } = ArrowTags;
  const style = `
    white-space: nowrap;
    text-align: center;
  `;
  return Li(() => v)({ html, style, key });
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

const toTable = (edges) => {
  const opts = ['', '', 'X'];
  const tri_width = Array(N_NODES - 1).keys();
  const x_label = [...tri_width].map(toNode);
  const y_label = x_label.map(col => col + 1);
  const tri = toTriangle(edges, x_label, y_label);
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
  // Require each edge in hand to match 1+
  const choose = (len) => {
    const idx = addRandom(new Set(), len);
    const edges = idx.map(i => no_doubles[i]);
    if (countUnmatched(edges) === 0) return edges;
    return choose(len);
  }
  d.dominos = choose(length-1);
  return d;
}

const toDefault = () => {
  const nodes = [...Array(N_NODES).keys()].map(toNode);
  const no_doubles = [].concat(...nodes.map(n1 => {
    return nodes.map(n2 => {
      if (n1 >= n2) return null;
      return [n1, n2];
    });
  })).filter(x => x);
  return setDominos({
    no_doubles: no_doubles
  })
}

const main = () => {
  const id = 'domino-display';
  const data = reactive(toDefault());
  const { render, Ul, _ } = ArrowTags;
  const button = Button('random');
  const __ = (a) => {
    return [[''].concat(a.map(()=>'')), ...a];
  }
  const table = Tiles(d => {
    return toTable(d.dominos).rows.map(Item);
  });
  const x = List("column", d => {
    return toTable(d.dominos).x_label.map(Item);
  });
  const y = List("row", d => {
    return toTable(d.dominos).y_label.map(Item);
  });
  const root = Root(button, Table(table, x, y));
  render(id, html, data, root);
}

export default main
