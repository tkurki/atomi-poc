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
const Counter = countAtom =>
  countAtom.map(n =>
    <div>
      Counter value is: {n}
      <div>
        <button onClick={e => countAtom.swap(n => n+1)}>+</button>
        <button onClick={e => countAtom.swap(n => n-1)}>-</button>
      </div>
    </div>)
```

To use the component one simply passes it an atom, the model, containing the
count:

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
```

Just like the `Counter` component, the above combination of three counters is a
function from a model to a stream of virtual DOM.  Unlike the simple counter,
the `ThreeCounters` component also encapsulates local state.

## Atomi

An atom, by itself, represents *first-class state*.  The state is exposed in the
form of a *stream of values* and the state can be mutated via the `swap`
operation.

An atom can be implemented in just a few lines of code.  Here is a POC
implementation of `Atom` using
Bacon.js[*](https://github.com/baconjs/bacon.js/):

```js
function Atom(initial) {
  const bus = new Bacon.Bus()
  const stream = bus.scan(initial, (state, fn) => fn(state))
  stream.swap = fn => bus.push(fn)
  return stream
}
```

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