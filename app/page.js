import React from "react"

export default ({version}) =>
  <html>
    <head>
      <title>Atomi POC</title>
      <link rel="stylesheet" href={"/public/bundle.css?version=" + version}/>
    </head>
    <body>
      <div id="app"></div>
      <script type="text/javascript" src={"/public/bundle.js?version=" + version}></script>
    </body>
  </html>
