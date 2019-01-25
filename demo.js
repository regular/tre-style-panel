const {client} = require('tre-client')
const StylePanel = require('.')
const h = require('mutant/html-element')
const setStyle = require('module-styles')('tre-styles-demo')
const Finder = require('tre-finder')
const Importer = require('tre-file-importer')
const {makePane, makeDivider, makeSplitPane} = require('tre-split-pane')

//require('brace/theme/twilight')

setStyle(`
  body, .tre-stylepane-demo {
    height: 100%;
  }
`)

client( (err, ssb, config) => {
  if (err) return console.error(err)

  console.log('config', config)
  const importer = Importer(ssb, config)
  importer.use(require('tre-stylesheets'))
  
  const renderFinder = Finder(ssb, {
    importer
  })
  const renderPanel = StylePanel(ssb, {
    //ace_theme: 'ace/theme/twilight'
  })

  document.body.appendChild(h('.tre-stylepane-demo', [
    makeSplitPane({horiz: true}, [
      makePane('20%', [
        makeSplitPane({horiz: false}, [
          makePane('50%', [
            renderFinder(config.tre.branches.root, {path: []})
          ]),
          makeDivider(),
          makePane('50%', [
            renderPanel()
          ])
        ])
      ]),
      makeDivider(),
      makePane('70%', [
      ])
    ])
  ]))
})

