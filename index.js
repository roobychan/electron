function boot() {
    angular.bootstrap(document, ['myRalyTool'], {
        strictDi: true
    });
}

document.addEventListener('DOMContentLoaded', boot);