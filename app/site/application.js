import React from "react"
import Bacon from "baconjs"
import {findIndex} from "lodash"

////////////////////////////////////////////////////////////////////////////////

function Atom(initial) {
  const bus = new Bacon.Bus()
  const stream = bus.scan(initial, (state, fn) => fn(state))
  stream.reset = v => bus.push(_ => v)
  stream.swap = fn => bus.push(fn)
  return stream
}

////////////////////////////////////////////////////////////////////////////////

const EnumSelectInput = (alts, selAtom) => {
  const options = alts
    .map(alt =>
       <option key={alt.value}
               value={alt.value}>
         {alt.value}
       </option>)

  return selAtom.map(alt =>
    <select value={alt.value}
            onChange={e =>
             selAtom.reset(alts[
               findIndex(alts,
                         alt => alt.value === e.target.value)])}>
      {options}
    </select>)}

const Checkbox = boolAtom =>
  boolAtom.map(bool =>
    <input type="checkbox"
           onChange={_ => boolAtom.reset(!bool)}
           checked={bool}/>)

const TextInput = textAtom =>
  textAtom.map(text =>
    <input type="text"
           value={text}
           onChange={e => textAtom.reset(e.target.value)}/>)

////////////////////////////////////////////////////////////////////////////////

const Counter = countAtom =>
  countAtom.map(count =>
    <div>
      Counter value is: {count}
      <div>
        <button onClick={_ => countAtom.reset(count+1)}>+</button>
        <button onClick={_ => countAtom.reset(count-1)}>-</button>
      </div>
    </div>)

////////////////////////////////////////////////////////////////////////////////

const ThreeCounters = sharedCountAtom =>
  Bacon.combineTemplate({
    counter1: Counter(sharedCountAtom),
    counter2: Counter(sharedCountAtom),
    counter3: Counter(Atom(1))
  }).map(s =>
    <div>
      {s.counter1}
      {s.counter2}
      {s.counter3}
    </div>)

////////////////////////////////////////////////////////////////////////////////

export default () => {
  const pages =
    [{value: "Counter",
      path: "/page/counter",
      DOMs: Counter(Atom(0))},
     {value: "ThreeCounters",
      path: "/page/three-counters",
      DOMs: ThreeCounters(Atom(0))}]

  const path = document.location.pathname
  const pageAtom =
    Atom(pages[Math.max(0, findIndex(pages, p => path.indexOf(p.path) === 0))])
  const pageSelectDOMs = EnumSelectInput(pages, pageAtom)

  return pageAtom
    .flatMapLatest(page =>
       window.history.replaceState(null, "", page.path) ||
       Bacon.combineWith(
         pageSelectDOMs, page.DOMs,
         (pageSelectDOM, pageDOM) =>
           <div>
             {pageSelectDOM}
             <hr/>
             {pageDOM}
           </div>))
}
