import { reactive, html } from '@arrow-js/core'

const toEl = document.getElementById.bind(document);

const toDefault = () => ({
  url: "https://www.google.com", 
  target: "Google"
})

const mergePads = (pads, pre='', post='') => {
  const start = pads[0] || '';
  const end = pads.pop() || '';
  const mid = pads.reduce((o, a, i) => {
    if (i === 0) return [];
    if (i % 2 !== 0) return [...o, a];
    return (last => [...o, last + a])(o.pop());
  },[]);
  return [pre + start, ...mid, end + post];
}

const switchValue = data => {
  return v => {
    switch(typeof v) {
      case 'function':
        return v.bind(null, data);
      case 'number':
        return () => v.parseInt(10);
      case 'string':
        return () => v;
      default:
        return () => false
    }
  }
}

const toAtt = (tag, fns) => {
  const entries = Object.entries(fns);
  if (entries.length === 0) {
    return [[`<${tag}>`]];
  }
  const att_pads = entries.reduce((pads, [k]) => {
    return [...pads, `${k}="`, '" '];
  }, []);
  const post = `>`;
  const pre = `<${tag} `;
  const pads = mergePads(att_pads, pre, post);
  return [pads, ...Object.values(fns)];
}

const _unpack = a => {
  // TODO: reduce if actually a whole element
  /*if (a.some(v => Array.isArray(v))) {
    return a.reduce(unpack, []);
  }*/
  return [a];
}

const unpack = (o, a, i) => {
  if (Array.isArray(a)) return [...o, _unpack(a)];
  return (last => [...o, [...last, a]])(o.pop());
}

const toArrowTags = () => {
  const renderer = (tag) => {
    return (...args) => {
      const children = args.reduce(unpack, []);
      console.log(children)
      // Insert self and children
      return (fns={}) => {
        const [pads, ...vals] = toAtt(tag, fns);
        const child_pads = [];
        // Insert child templates
        children.forEach(child => {
          const [child_pad, ...child_att] = child;
          child_pads.push(...child_pad);
          vals.push(...child_att);
        });
        // close out the tag
        const pre = pads.pop(0);
        const post = `</${tag}>`;
        pads.push(...mergePads(child_pads, pre, post));
        // Return both static and dynamic content
        return [pads, ...vals];
      }
    }
  }
  return {
    _: (...args) => [].concat(...args),
    $: (pads, ...fns) => [pads, ...fns],
    Div: renderer('div'),
    Em: renderer('em'),
    A: renderer('a'),
  }
}

const render = (el, data, template) => {
  const [pads, ...vals] = template;
  const bound = switchValue(data);
  const values = vals.map(bound);
  html(pads, ...values)(el);
}

const main = () => {
  const EL = toEl('domino-display');
  const data = reactive(toDefault());
  const { A, Em, _, $ } = toArrowTags();
  const hi = $`${()=>'Hello '}`;
  const em = Em`${d=>d.target}`();
  const lol = A(..._(hi, em))({href: (({url}) => url)});
  //const lol = A`${hi}${em}`(); //TODO
  render(EL, data, lol);
}

export default main
