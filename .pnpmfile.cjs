function readPackage(pkg, context) {
  // Ensure Next.js related packages are properly hoisted
  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
