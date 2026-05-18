const fs = require('fs')
const path = require('path')

const BAD = 'motion' + String.fromCharCode(68) + 'iv' // motionDiv typo tag

function fixFile(filePath) {
  let s = fs.readFileSync(filePath, 'utf8')
  if (!s.includes(BAD)) return false

  const open = new RegExp('<' + BAD + '(\\s|>)', 'g')
  const close = new RegExp('</' + BAD + '>', 'g')
  s = s.replace(open, '<div$1')
  s = s.replace(close, '</' + 'div>')


  fs.writeFileSync(filePath, s)
  return true
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.tsx$/.test(name) && fixFile(p)) console.log('fixed', p)
  }
}

walk(path.join(__dirname, '../packages/teacher-app/src'))
console.log('done')
