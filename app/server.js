const {readFileSync} = require("fs"),
      {resolve}      = require("path"),
      React          = require("react"),
      ReactDOM       = require("react-dom/server"),
      startServer    = require("./server/startServer"),
      Page           = require("./page"),
      pjson          = require("../package.json")

startServer(app => {

  app.get("*", (req, res) => {
    res.set("Content-Type", "text/html")
    res.send(ReactDOM.renderToStaticMarkup(<Page version={pjson.version}/>))
  })

})
