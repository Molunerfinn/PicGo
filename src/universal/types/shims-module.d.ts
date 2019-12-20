declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}
// third-party
declare module 'fix-path' {
  function fixPath(): void
  export default fixPath
}
