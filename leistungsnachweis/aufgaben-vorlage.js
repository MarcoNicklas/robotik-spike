(() => {
  'use strict';
  const template = "\u003carticle class=\"task\" data-sim-task>\n  \u003cheader class=\"task-header\">\n    \u003cp class=\"eyebrow task-number\">Aufgabe {{ID}}\u003c/p>\n    \u003ch1>{{NAME}}\u003c/h1>\n  \u003c/header>\n\n  \u003cdiv class=\"task-layout\">\n    \u003csection class=\"task-copy\" aria-labelledby=\"task-instructions\">\n      \u003ch2 id=\"task-instructions\">Dein Auftrag\u003c/h2>\n      \u003cp>Robotermitte auf {{START_LABEL}}, Vorderseite zu {{LOAD_LABEL}}.\u003c/p>\n      \u003col class=\"task-steps\">\n        {{STEPS}}\n      \u003c/ol>\n      \u003cp class=\"task-note\">\u003cstrong>10 Min.\u003c/strong> Programmieren · \u003cstrong>5 Min.\u003c/strong> Vorführen · ohne Sensoren\u003c/p>\n    \u003c/section>\n\n    \u003csection class=\"simulation\" aria-labelledby=\"sim-heading\">\n      \u003cdiv class=\"simulation-heading\">\n        \u003ch2 id=\"sim-heading\">Simulation\u003c/h2>\n      \u003c/div>\n      \u003cdiv class=\"simulation-body\">\n        \u003cdiv class=\"simulation-action-panel\">\n          \u003cdiv class=\"simulation-controls\">\n            \u003cbutton class=\"primary\" type=\"button\" data-sim-play>Abspielen\u003c/button>\n            \u003cbutton type=\"button\" data-sim-step>Nächster Schritt\u003c/button>\n            \u003cbutton type=\"button\" data-sim-reset>Zurücksetzen\u003c/button>\n            \u003clabel class=\"simulation-mute\">\u003cinput type=\"checkbox\" data-sim-mute> Ton aus\u003c/label>\n          \u003c/div>\n          \u003cdiv class=\"simulation-readout\">\n            \u003cdiv class=\"hub-display\">\u003csmall>Hub-Anzeige\u003c/small>\u003cstrong data-sim-display>—\u003c/strong>\u003c/div>\n            \u003cp class=\"simulation-status\" data-sim-status role=\"status\" aria-live=\"polite\">Bereit\u003c/p>\n          \u003c/div>\n        \u003c/div>\n        \u003cfigure class=\"simulation-figure\">\n          \u003ccanvas class=\"simulation-canvas\" width=\"522\" height=\"786\" role=\"img\" aria-label=\"Von {{START_LABEL}} vorwärts zu {{LOAD_LABEL}}, dort Load anzeigen und fünf Sekunden stehen. Rückwärts zu {{TURN_LABEL}}, dort auf der Stelle 90 Grad nach {{DIRECTION}} drehen. Vorwärts zu {{TARGET_LABEL}}, dort unload anzeigen und einen Signalton abspielen.\" data-sim-map>\n            Vorwärts zu {{LOAD_LABEL}}, rückwärts zu {{TURN_LABEL}}, 90 Grad nach {{DIRECTION}} drehen und vorwärts zu {{TARGET_LABEL}}.\n          \u003c/canvas>\n          \u003cfigcaption>\n            \u003cul class=\"map-key\" aria-label=\"Legende\">\n              \u003cli>\u003cspan class=\"map-key-start\" aria-hidden=\"true\">S\u003c/span> Start\u003c/li>\n              \u003cli>\u003cspan class=\"map-key-target\" aria-hidden=\"true\">A\u003c/span> Laden\u003c/li>\n              \u003cli>\u003cspan class=\"map-key-end\" aria-hidden=\"true\">Z\u003c/span> Ziel\u003c/li>\n              \u003cli>\u003cspan class=\"map-key-route\" aria-hidden=\"true\">\u003c/span> Vorwärts\u003c/li>\n              \u003cli>\u003cspan class=\"map-key-return\" aria-hidden=\"true\">\u003c/span> Rückwärts\u003c/li>\n            \u003c/ul>\n          \u003c/figcaption>\n        \u003c/figure>\n      \u003c/div>\n      \u003cnoscript>Aktiviere JavaScript, um die Simulation abzuspielen.\u003c/noscript>\n    \u003c/section>\n  \u003c/div>\n\u003c/article>\n";
  function escape(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }
  globalThis.renderSpikeTask = (target, variant) => {
    const values = {
      ID: String(variant.id).padStart(2, '0'),
      NAME: escape(variant.name),
      START_LABEL: escape(variant.startLabel),
      LOAD_LABEL: escape(variant.loadLabel),
      TURN_LABEL: escape(variant.turnLabel),
      TARGET_LABEL: escape(variant.targetLabel),
      DIRECTION: variant.turn < 0 ? 'links' : 'rechts',
      STEPS: variant.steps.map((step, index) => '<li><span class="step-number" aria-hidden="true">' + (index + 1) + '</span><span>' + escape(step) + '</span></li>').join('')
    };
    target.innerHTML = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => values[key]);
    return target.querySelector('[data-sim-task]');
  };
})();