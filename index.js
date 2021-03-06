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
  opts = opts || {}
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
    let drain
    function stream() {
      sheets.clear()
      pull(
        ssb.revisions.messagesByType('stylesheet', o),
        drain = collectMutations(sheets, o, err => {
          if (!err) return
          const delay = err.pleaseRetryIn
          if (delay !== undefined) {
            return setTimeout(stream, delay)
          }
          console.error('tre-style-panel error: %s', err.message)
        })
      )
    }
    stream()
    const abort = ()=>drain.abort()
    const resolved = MutantMap(sheets, resolvePrototypes, {comparer})

    return h('.tre-style-panel', {
      hooks: [el => abort],
    }, MutantMap(resolved, kvm => {
      if (!kvm) return []
      const hasCss = computed(kvm, kvm => Boolean(kvm && kvm.value.content.css))
      const ignored = computed(kvm, kvm => opts.isIgnored && opts.isIgnored(kvm))
      const isOpen = Value(false)
      return computed([ignored, hasCss], (i, c) => (!c || i) ? [] : h('details.stylesheet', {
        'ev-toggle': e => isOpen.set(!isOpen())
      }, [
        h('summary', computed(kvm, kvm => kvm && kvm.value.content.name)),
        computed(isOpen, o => !o ? renderStyle(kvm(), {where: 'stage'}) : renderEditor(kvm()))
      ]))
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

