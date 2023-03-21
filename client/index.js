import { reactive, html } from '@arrow-js/core'
import ArrowTags from 'arrow-tags';

const and = ([...v], end='') => {
  if (v.length < 3) return v.join(' and ');
  const last = v.splice(v.length-1, 1) + end;
  return [...v.map(x => `${x}, `), 'and ' + last]; 
}

const toLink = (text) => {
  const { A } = ArrowTags;
  const aProps = {
    id: 'id', href: (({url, search}) => url+search)
  };
  return A`${text}`(aProps);
}

const toCore = (link, child) => {
  const props = {
    style: `
      grid-row: 2;
      padding: 1rem;
      font-size: 150%;
      max-width: 300px;
      font-family: sans-serif;
    `
  };
  const hi = 'Attention:';
  const { Div } = ArrowTags;
  return Div`→ ${hi} ${child} ${link} ←`(props);
}

const toRoot = (child) => {
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

const toDefault = () => ({
  message: 'search "hello world"',
  url: "https://www.bing.com", 
  search: "/search?q=hello+world",
  names: ['X', 'Y', 'Z']
})

const main = () => {
  const id = 'domino-display';
  const data = reactive(toDefault());
  const { render, Ul, Li, _ } = ArrowTags;
  const hi = _`${d=>d.message}`;
  const names = Ul`${d=>{
    return and(d.names).map((str,i) => {
      return Li(str)({html, key: i});
    });
  }}`;
  const link = toLink(hi);
  const core = toCore(link, names);
  const root = toRoot(core);
  render(id, html, data, root);
}

export default main
