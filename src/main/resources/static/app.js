(() => {
  const frontend = window.HongzhiFrontend || {};

  if (!window.Vue || !frontend.createWorkspaceApp) {
    return;
  }

  window.Vue.createApp(frontend.createWorkspaceApp()).mount("#app");
})();
