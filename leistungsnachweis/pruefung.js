(() => {
  'use strict';

  const form = document.querySelector('[data-access-form]');
  const field = form.querySelector('input');
  const notice = document.querySelector('[data-access-message]');
  const gate = document.querySelector('[data-access-gate]');
  const result = document.querySelector('[data-access-result]');
  const lock = document.querySelector('[data-lock]');
  const button = form.querySelector('button[type="submit"]');
  const role = document.body.dataset.role;
  const fixedId = document.body.dataset.variant;
  const records = globalThis.pruefungsdaten;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function noticeText(message) {
    notice.textContent = message;
    notice.hidden = !message;
  }

  function decodeBase64(value) {
    return Uint8Array.from(atob(value), char => char.charCodeAt(0));
  }

  async function selector(code) {
    const bytes = await crypto.subtle.digest('SHA-256', encoder.encode('SPIKE-Pruefung/Variante/' + code));
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function decrypt(envelope, code) {
    const input = await crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: decodeBase64(envelope.salt),
      iterations: records.iterations
    }, input, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decodeBase64(envelope.iv) },
      key,
      decodeBase64(envelope.data)
    );
    return JSON.parse(decoder.decode(plaintext));
  }

  function showTask(container, variant) {
    const article = globalThis.renderSpikeTask(container, variant);
    container.bodyCleanup = globalThis.mountSimulation(article, variant);
  }

  async function copyText(text, feedback, label) {
    try {
      await navigator.clipboard.writeText(text);
      feedback.textContent = label;
    } catch {
      feedback.textContent = 'Zum Kopieren markieren: ' + text;
    }
    feedback.hidden = false;
  }

  function showTeacher(payload) {
    result.replaceChildren(document.querySelector('[data-teacher-template]').content.cloneNode(true));
    const rows = result.querySelector('[data-schedule-rows]');
    const start = result.querySelector('[data-start-time]');
    const mode = result.querySelector('[data-schedule-mode]');
    const summary = result.querySelector('[data-schedule-summary]');
    const feedback = result.querySelector('[data-teacher-feedback]');
    const copyLink = result.querySelector('[data-copy-link]');
    const dialog = result.querySelector('[data-preview-dialog]');
    const preview = result.querySelector('[data-preview-content]');
    const studentLink = result.querySelector('a[href="./index.html"]');

    copyLink.addEventListener('click', () => copyText(studentLink.href, feedback, 'Schülerlink kopiert.'));
    result.querySelector('[data-print]').addEventListener('click', () => window.print());
    result.querySelector('[data-close-preview]').addEventListener('click', () => dialog.close());

    function closePreview() {
      preview.bodyCleanup?.();
      preview.replaceChildren();
      preview.bodyCleanup = null;
    }

    dialog.addEventListener('close', closePreview);

    function minutesFor(index) {
      if (mode.value === 'continuous') return index * 5;
      return Math.floor(index / 2) * 15 + index % 2 * 5;
    }

    function time(minute) {
      const pad = value => String(value).padStart(2, '0');
      if (!start.value) return '+' + pad(Math.floor(minute / 60)) + ':' + pad(minute % 60);
      const [hour, min] = start.value.split(':').map(Number);
      const total = hour * 60 + min + minute;
      const formatted = pad(Math.floor(total / 60) % 24) + ':' + pad(total % 60);
      return total >= 1440 ? formatted + ' (+1 Tag)' : formatted;
    }

    const times = payload.map(({ variant, code }) => {
      const row = rows.insertRow();
      const name = document.createElement('th');
      name.scope = 'row';
      row.append(name);
      const view = document.createElement('button');
      view.type = 'button';
      view.className = 'table-link';
      view.textContent = String(variant.id).padStart(2, '0');
      view.setAttribute('aria-label', 'Aufgabe ' + variant.id + ' ansehen');
      view.addEventListener('click', () => {
        showTask(preview, variant);
        dialog.showModal();
      });
      name.append(view);

      const codeCell = row.insertCell();
      const copyCode = document.createElement('button');
      copyCode.type = 'button';
      copyCode.className = 'code-button';
      copyCode.textContent = code;
      copyCode.setAttribute('aria-label', 'Code für Aufgabe ' + variant.id + ' kopieren');
      copyCode.addEventListener('click', () => copyText(code, feedback, 'Code für Aufgabe ' + variant.id + ' kopiert.'));
      codeCell.append(copyCode);

      row.insertCell().textContent = variant.name;
      row.insertCell().textContent = variant.word;
      return { issue: row.insertCell(), exam: row.insertCell() };
    });

    function updateTimes() {
      times.forEach(({ issue, exam }, index) => {
        const minute = minutesFor(index);
        issue.textContent = time(minute);
        exam.textContent = time(minute + 10) + ' – ' + time(minute + 15);
      });
      const duration = minutesFor(times.length - 1) + 15;
      summary.textContent = duration + ' Min. gesamt · je 10 Min. Programmieren + 5 Min. Vorführen';
    }

    start.addEventListener('change', updateTimes);
    mode.addEventListener('change', updateTimes);
    updateTimes();
    result.bodyCleanup = closePreview;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    noticeText('');
    if (!globalThis.crypto?.subtle || !records) {
      noticeText('Öffne diese Seite in einem aktuellen Browser über HTTPS.');
      return;
    }
    const code = field.value.toUpperCase().replace(/[\s\-]/g, '');
    if (code.length !== (role === 'teacher' ? 24 : 15) || !/^[A-Z2-9]+$/.test(code)) {
      noticeText('Code prüfen und erneut eingeben.');
      return;
    }
    button.disabled = true;
    let payload;
    try {
      const envelope = role === 'teacher' ? records.teacher : records.students[await selector(code)];
      if (!envelope || (fixedId && Number(fixedId) !== envelope.id)) throw new Error('Unbekannter Code');
      payload = await decrypt(envelope, code);
    } catch {
      noticeText('Code prüfen und erneut eingeben.');
      field.select();
      button.disabled = false;
      return;
    }
    try {
      if (role === 'teacher') showTeacher(payload);
      else showTask(result, payload);
      gate.hidden = true;
      result.hidden = false;
      lock.hidden = false;
      const title = result.querySelector('h1');
      title.tabIndex = -1;
      title.focus();
      field.value = '';
    } catch (error) {
      console.error(error);
      result.bodyCleanup?.();
      result.replaceChildren();
      noticeText('Die Seite ließ sich nicht vollständig laden. Lade sie neu und versuche es erneut.');
    } finally {
      button.disabled = false;
    }
  });

  lock.addEventListener('click', () => {
    result.bodyCleanup?.();
    result.bodyCleanup = null;
    result.replaceChildren();
    result.hidden = true;
    lock.hidden = true;
    gate.hidden = false;
    field.focus();
  });
})();
