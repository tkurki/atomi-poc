const express     = require("express"),
      {resolve}   = require("path"),
      compression = require("compression"),
      serveStatic = require("serve-static"),
      bodyParser  = require("body-parser")


export default function startServer(initFn) {
  const app = express()

  app.use(bodyParser.json())
  app.use(compression())
  app.use("/public", serveStatic(resolve(__dirname, "../../public"), {
    setHeaders(res) {
      const control =
            process.env.NODE_ENV === "production"
            ? "public, max-age=31536000"
            : "private, max-age=0, no-cache"
      res.set("Cache-Control", control)
    }
  }))

  initFn(app)

  const server = app.listen(process.env.PORT || 3000, () => {
    /*eslint-disable*/
    console.log("Server listening at port %s", server.address().port)
    /*eslint-enable*/
  })
}

