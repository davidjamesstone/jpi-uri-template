const Path = require('path')
const pointer = require('json-pointer')
const reduce = require('lodash.reduce')

const throwError = function (e, msg) {
  const err = new Error(msg + ': ' + e.message)
  err.stack = e.stack
  throw err
}

const parseHref = function (href, schema) {
  if (!href) return undefined
  // This will pull out all {/schema/pointers}
  const pattern = /((?:{(?:#?(\/[\w\/]+))})+)+/g
  const matches = href.match(pattern)

  const rtn = {
    matches: !matches ? [] : matches.map(match => {
      return { match: match }
    })
  }

  const queryIndex = href.indexOf('?')
  const hasQuery = queryIndex > -1

  try {
    rtn.href = reduce(rtn.matches, function (str, m, index) {
      const match = m.match
      // Remove the brackets so we can find the definition
      const stripped = match.replace(/[{}]/g, '')
      // Resolve the reference within the schema
      const definition = pointer.get(schema, stripped.substring(1))
      if (!definition) {
        throwError(new Error('Pointer reference'), 'Could not resolve href: ' + href)
      }

      const basename = Path.basename(stripped)
      rtn.matches[index].key = basename
      rtn.matches[index].type = hasQuery && href.indexOf(match) > queryIndex ? 'query' : 'param'
      rtn.matches[index].definition = definition
      // Replace the match with either example data or the last component of the pointer
      const replacement = '{' + basename + '}'
      return str.replace(match, replacement)
    }, href)
    rtn.path = hasQuery ? rtn.href.substr(0, rtn.href.indexOf('?')) : rtn.href
    return rtn
  } catch (e) {
    throwError(e, 'Could not build href: ' + href)
  }
}

module.exports = parseHref
