const Styles = require('tre-stylesheets')
const Accordion = require('tre-editor-accordion')

module.exports = function(ssb, opts) {
  opts = opts || {}

  function source(opts) {
    return ssb.revisions.messagesByType('stylesheet', opts)
  }
  function rename(kvm, newContent, newName) {
    newContent.name = newName
    return newContent
  }

  function isIgnored(kvm) {
    console.log('is ignored %O', kvm)
    const valid = kvm && kvm.value.content.css
    if (!valid) return true
    if (opts.isIgnored && opts.isIgnored(kvm)) return true
    return false
  }

  return Accordion(ssb, source, Styles(ssb, opts), Object.assign({}, opts, {isIgnored, rename}))
}
