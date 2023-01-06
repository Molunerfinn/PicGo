declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
// // third-party
// declare module 'fix-path' {
//   function fixPath(): void
//   export default fixPath
// }
