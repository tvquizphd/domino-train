import { reactive, html } from '@arrow-js/core'
import ArrowTags from 'arrow-tags';

const toLink = (greeting, object) => {
  const { A } = ArrowTags;
  const aProps = {
    id: 'id', href: (({url}) => url)
  };
  const space = 'of how to say hello to the'
  return A`
    ${greeting} ${space} ${object}
  `(aProps);
}

const toCore = (child) => {
  const props = {
    style: `
      grid-row: 2;
      font-size: 150%;
      max-width: 300px;
      font-family: sans-serif;
    `
  };
  const { Div } = ArrowTags;
  return Div`→ ${child} ←`(props);
}

const toRoot = (child) => {
  const props = {
    style: `
      height: 100%;
      display: grid;
      align-content: center;
      justify-content: center;
      grid-template-rows: 1fr auto 1fr;
    `
  };
  const { Div } = ArrowTags;
  return Div`${child}`(props);
}

const toDefault = () => ({
  url: "https://www.google.com", 
  name: 'Entire World!',
  hello: 'Hello'
})

const main = () => {
  const id = 'domino-display';
  const data = reactive(toDefault());
  const { render, Em, _ } = ArrowTags;
  const hi = _`${d=>d.hello}, this is a test`;
  const name = Em`${d=>d.name}`;
  const link = toLink(hi, name);
  const core = toCore(link);
  const root = toRoot(core);
  render(id, html, data, root);
}

export default main
