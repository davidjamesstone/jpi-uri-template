// const parser = require('uri-templates')
const Path = require('path')
const pointer = require('json-pointer')
const reduce = require('lodash.reduce')
// const parser = require('uritemplate').parse
const RefParser = require('json-schema-ref-parser')
// const buildHref = require('json-schema-example-loader/lib/transformer').buildHref

// const tpl = parser('/date/{colour}/{shape}')
// const tpl1 = parser('/{year}/{month}/{day}{?orderBy,direction}')
// const tpl2 = parser('{?query*}')
// const tpl4 = parser('/prefix/{?params*}')
// const customerSchemaPath = Path.resolve(__dirname, './schema/routes/customer.json')

const throwError = function (e, msg) {
  var err = new Error(msg + ': ' + e.message)
  err.stack = e.stack
  throw err
}

const parseHref = function (href, schema) {
  if (!href) return undefined
  // This will pull out all {/schema/pointers}
  var pattern = /((?:{(?:#?(\/[\w\/]+))})+)+/g
  var matches = href.match(pattern)

  var rtn = {
    matches: matches.map(match => {
      return { match: match }
    })
  }

  var queryIndex = href.indexOf('?')
  var hasQuery = queryIndex > -1

  try {
    rtn.href = reduce(rtn.matches, function (str, m, index) {
      var match = m.match
      // Remove the brackets so we can find the definition
      var stripped = match.replace(/[{}]/g, '')
      // Resolve the reference within the schema
      var definition = pointer.get(schema, stripped.substring(1))
      if (!definition) {
        throwError(new Error('Pointer reference'), 'Could not resolve href: ' + href)
      }

      var basename = Path.basename(stripped)
      rtn.matches[index].key = basename
      rtn.matches[index].type = hasQuery && href.indexOf(match) > queryIndex ? 'query' : 'param'
      rtn.matches[index].definition = definition
      // Replace the match with either example data or the last component of the pointer
      var replacement = '{' + basename + '}'
      // /my/{#/pointer} -> /my/example_value OR /my/:pointer
      return str.replace(match, replacement)
    }, href)
    rtn.path = hasQuery ? rtn.href.substr(0, rtn.href.indexOf('?')) : rtn.href
    return rtn
  } catch (e) {
    throwError(e, 'Could not build href: ' + href)
  }
}

// RefParser.dereference(customerSchemaPath, function (err, customerSchema) {
//   if (err) {
//     throw err
//   }

//   const path = parseHref('/customer/{#/definitions/identifier}/{./common/id.json}?{#/definitions/orderBy}', customerSchema)


// })

module.exports = parseHref
