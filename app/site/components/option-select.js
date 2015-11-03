import React from "react"
import Bacon from "baconjs"
import {find} from "lodash"

/*
export default (alternativesStream, selectedAtom) =>
  alternativesStream
  .flatMapLatest(alternatives => {
    const options =
      alternatives.map(a =>
        <option key={a.value} value={a.value}>{a.value}</option>)
    return selectedAtom
      .map(selected =>
        <select value={selected.value}
                onChange={e =>
                  selectedAtom.set(find(alternatives, a => a.value === e.target.value))}>
          {options}
        </select>)
  })
*/

export default (alternativesStream, selectedAtom) =>
  Bacon.combineWith(
    alternativesStream,
    alternativesStream
      .map(alternatives =>
           alternatives.map(a =>
             <option key={a.value} value={a.value}>{a.value}</option>)),
    selectedAtom,
    (alternatives, options, selected) =>
      <select value={selected.value}
              onChange={e =>
                selectedAtom.set(find(alternatives, a => a.value === e.target.value))}>
        {options}
      </select>)
