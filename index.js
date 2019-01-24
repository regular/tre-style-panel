const pull = require('pull-stream')
const Styles = require('tre-stylesheets')
const Shell = require('tre-editor-shell')
const h = require('mutant/html-element')
const setStyle = require('module-styles')('tre-style-panel-demo')
const MutantMap = require('mutant/map')
const MutantArray = require('mutant/array')
const collectMutations = require('collect-mutations')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const ResolvePrototypes = require('tre-prototypes')

module.exports = function(ssb, opts) {
  const resolvePrototypes = ResolvePrototypes(ssb)

  const renderShell = Shell(ssb, {
    save: (kv, cb) => {
      ssb.publish(kv.value.content, cb)
    }
  })

  const renderStyle = Styles(ssb, opts)

  return function() {
    const sheets = MutantArray()
    const o = {sync: true, live: true}
    const drain = collectMutations(sheets, o)
    pull(
      ssb.revisions.messagesByType('stylesheet', o),
      drain
    )
    const abort = drain.abort
    const resolved = MutantMap(sheets, resolvePrototypes, {comparer})

    return h('ul', {
      hooks: [el => abort],
    }, MutantMap(resolved, kvm => {
      return h('li', renderEditor(kvm()))
    }, {comparer}))
  }

  function renderEditor(kv) {
    console.warn('render shell', kv)
    if (!kv || !kv.value.content.css) return
    const contentObs = Value(Object.assign({}, kv.value.content))
    return renderShell(kv, {
      renderEditor: renderStyle,
      contentObs,
      where: 'compact-editor'
    })
  }
}

function comparer(a, b) {
  // NOTE: a and b might be observables 
  /*
  It might be beneficial to overall perofrmance to make a slightly deeper comparison of
  - keys
  - meta (wihtout prototype-chain)
  - keys of prototype chain

  It's not enough to just compare akey to b.key because changes in
  prototypes would slip through.
  */
  return a === b
}

