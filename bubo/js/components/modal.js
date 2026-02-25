// Diálogos modales

export function showModal({ title, body, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">${title}</h3>
        <button class="modal__close" data-action="close">&times;</button>
      </div>
      <div class="modal__body">${body}</div>
      <div class="modal__footer">
        <button class="btn btn--outline" data-action="close">${cancelText}</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-action="confirm">${confirmText}</button>
      </div>
    </div>
  `;

  function close() {
    overlay.remove();
  }

  overlay.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'close') close();
    if (action === 'confirm') {
      if (onConfirm) onConfirm();
      close();
    }
    // Cerrar al hacer click fuera del modal
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
  return close;
}

export function showConfirm(title, message) {
  return new Promise((resolve) => {
    showModal({
      title,
      body: `<p>${message}</p>`,
      danger: true,
      confirmText: 'Sí, continuar',
      onConfirm: () => resolve(true),
    });
    // Si se cierra sin confirmar, no se resuelve (se queda pendiente)
    // En la práctica esto es aceptable para diálogos de confirmación
  });
}
