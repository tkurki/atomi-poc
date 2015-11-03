This is a proof-of-concept demo repository of Atomi&mdash;concise reactive web.

## Quickstart

```bash
git clone https://github.com/VesaKarvonen/atomi-poc.git
cd atomi-poc
npm install
npm run watch
```

Then open browser at [http://localhost:3000/](http://localhost:3000/).

## How difficult it really has to be?

Here is *all* the code required to implement a counter component:

```js
const Counter = countModel =>
  countModel.map(n =>
    <div>
      Counter value is: {n}
      <div>
        <button onClick={e => countModel.modify(n => n+1)}>+</button>
        <button onClick={e => countModel.modify(n => n-1)}>-</button>
      </div>
    </div>)
```

To use the component one simply passes it a model containing the count:

```js
const counterDOMs = Counter(Atom(0))
```

The result is a *stream of React Virtual
DOM*[*](https://facebook.github.io/react/docs/glossary.html), which one can
render:

```js
const counterElem = document.getElementById("counter")
counterDOMs.onValue(counterDOM => ReactDOM.render(counterDOM, counterElem))
```

We can, of course, have as many counters as we want and counters can have their
own model or share a model with some other component.  Here is an example with
three counters:

```js
const ThreeCounters = sharedCountModel =>
  Bacon.combineTemplate({
    counter1: Counter(sharedCountModel),
    counter2: Counter(sharedCountModel),
    counter3: Counter(Atom(1))
  }).map(s =>
    <div>
      {s.counter1}
      {s.counter2}
      {s.counter3}
    </div>)
```

Just like the `Counter` component, the above combination of three counters is a
function from a model to a stream of virtual DOM.  Unlike the simple counter,
the `ThreeCounters` component also encapsulates local state.

## Atomi

An `Atom` by itself, represents *first-class state*.  The state is exposed in
the form of a *stream of values* and the state can be mutated via the `modify`
operation.

It can be implemented in just a few lines of code.  Here is a POC implementation
using [Bacon.js](https://github.com/baconjs/bacon.js/):

```js
function Atom(initial) {
  const bus = new Bacon.Bus()
  const stream = bus.scan(initial, (state, fn) => fn(state))
  stream.modify = fn => bus.push(fn)
  return stream
}
```

In a way, the above 6 lines of code is basically *all* there is to Atomi.
Except that even that much is unnecessary, because
[Bacon.Model](https://github.com/baconjs/bacon.model) already provides more than
that, so one can just say

```js
import {Model as Atom} from "bacon.model"
```

and Atomi can be seen as just a way to structure reactive web applications with
Bacon.js and React.

It is very important that atoms are first-class objects.  This makes it natural
to *never duplicate state*, which is one major source of bugs in imperative
programming.  A single atom can be created to hold the definitive truth of
whatever property one wishes to represent and the atom can be passed to all the
operations that need to modify the property.

It is also very important that atoms expose their state as streams.  This makes
it natural to *always express dependencies on state*, which is another major
source of bugs in imperative programming.  The nature of state is that it
changes over time.  The results of computations that depend on state also change
over time.  Expressing state and state dependent computations in the form of
streams makes it easy to ensure that results remain current.

Mutable state is often labeled as evil.  This is understandable, because the
ways in which one traditionally programs with state make it highly error prone:
it is typically easy to (even accidentally) create new or duplicate existing
state and there is typically nothing to express dependencies on state.
Fortunately we are not constrained to use such broken approaches!  State can be
both simple and easy.

## Background

[Matti Lankinen](https://github.com/milankinen) pointed out that recreating all
Virtual DOM on state changes, as is typically done in the
[megablob](https://github.com/milankinen/megablob) architecture, is inefficient
and it would be better to compose streams of virtual DOM.  Atomi was formed by
refactoring
[sample code](https://gist.github.com/milankinen/3f045eaf840afd12fefb) that
Matti provided.

The `Atom`, or `Model`, abstraction is a minimum effort way to bring a model
similar to what can be found in [Reagent](https://reagent-project.github.io/),
which implements a simpler
[SAC](http://www.umut-acar.org/self-adjusting-computation)-style (rather than
FRP-style) abstraction without the concept of time, and WebSharper
[UI.Next](http://intellifactory.github.io/websharper.ui.next.samples), which
takes the idea even further in the form of reactive (rather than just virtual)
DOM.
