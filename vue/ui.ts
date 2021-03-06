export default {
  install: (app: any, options: unknown) => {
    // Register ui components
    const ui = require.context('./component/', true, /^.*\.vue$/).keys();
    for (let i = 0; i < ui.length; i++) {
      const name = ui[i]
        .replace('./', '')
        .replace('.vue', '')
        .replace(/\//g, '-')
        .replace(/\./g, '-')
        .replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase())
        .replace(/--/g, '-');
      const sas = require('./component/' + ui[i].replace('./', ''));
      app.component(name, sas.default);
    }

    // Register components globally
    const components = require.context('@/component/', true, /^.*\.vue$/).keys();
    for (let i = 0; i < components.length; i++) {
      const name = components[i]
        .replace('./', '')
        .replace('.vue', '')
        .replace(/\//g, '-')
        .replace(/\./g, '-')
        .replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase())
        .replace(/--/g, '-')
        .toLowerCase()
        .replace(/-index/g, '');

      const sas = require('@/component/' + components[i].replace('./', ''));
      app.component(`${name}`, sas.default);
    }
  },
};
