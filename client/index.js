import { reactive, html } from '@arrow-js/core'
import ArrowTags from 'arrow-tags';

const MIN_NODE = 1;
const MAX_NODE = 6;
const N_NODES = 1 + MAX_NODE - MIN_NODE;
const toNode = index => index + MIN_NODE;
const GRID = [...Array(N_NODES - 1).keys()].map(toNode)

const Core = (tiles) => {
  const props = {
    style: `
      margin: 0;
      grid-row: 2;
      padding: 1rem;
      font-size: 150%;
      max-width: 300px;
      list-style-type: none;
      font-family: sans-serif;
      grid-template-rows: repeat(${N_NODES}, 1em);
      grid-template-columns: repeat(${N_NODES}, 1em);
      display: grid;
    `
  };
  const hi = 'Attention:';
  const { Ul } = ArrowTags;
  return Ul`${tiles}`(props);
}

const Root = (child) => {
  const props = {
    style: `
      height: 100%;
      display: grid;
      align-content: center;
      justify-content: center;
      grid-template-rows: 1fr auto 2fr;
    `
  };
  const { Div } = ArrowTags;
  return Div`${child}`(props);
}

const Tile = (match, key) => {
  const { Li } = ArrowTags;
  const style = `
    white-space: nowrap;
    text-align: center;
  `;
  const text = ['', match[0], 'X'][match.length];
  return Li(text)({ html, style, key });
}

const toMatrix = (edges) => {
  const pairs = edges.map(e => new Set(e));
  const match = x => y => x.every(y.has.bind(y));
  const match_any = x => !!pairs.find(match(x));
  const x_label = [[], ...GRID.map(x => [x])];
  return x_label.concat(...GRID.map(row => {
    return [[row+1]].concat(GRID.map(column => {
      if (column >= row + 1) return [];
      if (!match_any([row + 1, column])) return [];
      return [column, row];
    }));
  }));
}

const toDefault = () => ({
  message: 'search "hello world"',
  url: "https://www.bing.com", 
  search: "/search?q=hello+world",
  dominos: [[1,2], [2,3], [3,4], [4,5], [5,6]]
})

const main = () => {
  const id = 'domino-display';
  const data = reactive(toDefault());
  const { render, Ul, _ } = ArrowTags;
  const hi = _`${d=>d.message}`;
  const tiles = _`${d=>{
    return toMatrix(d.dominos).map(Tile);
  }}`;
  const root = Root(Core(tiles));
  render(id, html, data, root);
}

export default main
