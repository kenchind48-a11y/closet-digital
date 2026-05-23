const STORAGE_KEY = 'closetDigitalAppState';
const CATEGORY_ORDER = ['Tops', 'pantalones', 'Vestidos', 'Zapatos', 'Accesorios', 'Hoodies'];

const state = {
  items: [],
  outfits: [],
  filterCategory: 'Todas',
  currentImageBase64: null,
};

const refs = {
  welcomeScreen: document.querySelector('#welcomeScreen'),
  beginButton: document.querySelector('#beginButton'),
  appScreen: document.querySelector('#app'),
  addItemForm: document.querySelector('#addItemForm'),
  nombrePrenda: document.querySelector('#nombrePrenda'),
  categoriaPrenda: document.querySelector('#categoriaPrenda'),
  colorPrenda: document.querySelector('#colorPrenda'),
  seasonPrenda: document.querySelector('#seasonPrenda'),
  imagenPrenda: document.querySelector('#imagenPrenda'),
  btnAgregar: document.querySelector('#btnAgregar'),
  categoryScroller: document.querySelector('#categoryScroller'),
  createOutfitButton: document.querySelector('#createOutfitButton'),
  outfitList: document.querySelector('#outfitList'),
  outfitModal: document.querySelector('#outfitModal'),
  outfitName: document.querySelector('#outfitName'),
  outfitSelectionGrid: document.querySelector('#outfitSelectionGrid'),
  btnGuardarOutfit: document.querySelector('#btnGuardarOutfit'),
  closeOutfitModal: document.querySelector('#closeOutfitModal'),
  outfitPreviewModal: document.querySelector('#outfitPreviewModal'),
  closeOutfitPreviewModal: document.querySelector('#closeOutfitPreviewModal'),
  previewOutfitName: document.querySelector('#previewOutfitName'),
  outfitPreviewContainer: document.querySelector('#outfitPreviewContainer'),
  themeToggle: document.querySelector('#themeToggle') || document.querySelector('.theme-toggle'),
};

function init() {
  console.log('[INIT] Comenzando inicialización');
  loadState();
  console.log('[INIT] loadState completado, state.items.length:', state.items.length);
  bindEvents();
  console.log('[INIT] bindEvents completado');
  setupImagePreview();
  injectBackButtonStyles();
  injectCompactMobileStyles();
  attachBackButton(refs.outfitModal, closeOutfitModal);
  attachBackButton(refs.outfitPreviewModal, closeOutfitPreviewModal);
  console.log('[INIT] Llamando renderAll...');
  renderAll();
  console.log('[INIT] renderAll completado');
  applyStoredTheme();
  registerServiceWorker();
  setupBeforeInstallPrompt();
  console.log('[INIT] Inicialización completada');
}

function injectCompactMobileStyles() {
  if (document.querySelector('#compactMobileStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'compactMobileStyles';
  style.textContent = `
@media (max-width: 520px) {
  .card { min-width: auto; border-radius: 20px; padding: 12px; }
  .card-image-wrapper { min-height: 140px; }
  .card-body { padding: 12px 12px 14px; }
  .card-category, .card-title, .card-meta { font-size: 0.88rem; }
  .card-meta { margin-top: 8px; }
  .outfit-card { grid-template-columns: 58px 1fr; gap: 10px; padding: 12px; border-radius: 20px; }
  .outfit-preview { width: 58px; height: 58px; border-radius: 16px; }
  .outfit-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .outfit-details h4 { font-size: 0.95rem; }
  .outfit-details p { font-size: 0.78rem; }
  .outfit-header { gap: 8px; }
  .category-section { gap: 12px; }
  .category-title { font-size: 0.95rem; }
  .category-count { font-size: 0.78rem; }
  .category-scroll { gap: 12px; }
  .panel { padding: 16px; }
  .outfit-selection-grid { gap: 10px; }
  .outfit-selection-item { gap: 8px; padding: 8px; border-radius: 16px; }
  .outfit-selection-image-wrapper { min-height: 60px; }
  .outfit-preview-panel { padding: 22px; }
  .outfit-preview-container { gap: 18px; }
  .outfit-preview-group { gap: 14px; }
  .outfit-preview-item { padding: 14px; min-height: 260px; }
  .outfit-preview-image-inner { max-height: 280px; height: 280px; padding: 14px; }
  .outfit-preview-image-inner img { max-height: 100%; max-width: 100%; }
  .outfit-preview-name, .outfit-preview-category { font-size: 0.92rem; }
  .outfit-preview-header { gap: 12px; }
}
`;
  document.head.appendChild(style);
}

function injectBackButtonStyles() {
  if (document.querySelector('#modalBackButtonStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'modalBackButtonStyles';
  style.textContent = `
.button-group { display: inline-flex; align-items: center; gap: 10px; }
.modal-back-button { border: none; background: rgba(255, 255, 255, 0.1); color: #fff; border-radius: 999px; padding: 10px 16px; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
.modal-back-button:hover { transform: translateY(-1px); background: rgba(255, 255, 255, 0.16); }
.modal-back-button:focus-visible { outline: 2px solid rgba(255, 77, 141, 0.7); outline-offset: 2px; }
`;
  document.head.appendChild(style);
}

function createBackButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'modal-back-button';
  button.textContent = label;
  button.addEventListener('click', function (event) {
    event.stopPropagation();
    if (typeof onClick === 'function') {
      onClick();
    }
  });
  return button;
}

function attachBackButton(modalElement, closeFn) {
  if (!(modalElement instanceof HTMLElement) || modalElement.querySelector('.modal-back-button')) {
    return;
  }

  const header = modalElement.querySelector('.modal-header');
  if (!header) {
    return;
  }

  let buttonGroup = header.querySelector('.button-group');
  if (!buttonGroup) {
    buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';

    const closeBtn = header.querySelector('.icon-button');
    if (closeBtn) {
      header.insertBefore(buttonGroup, closeBtn);
    } else {
      header.appendChild(buttonGroup);
    }
  }

  const backButton = createBackButton('← Volver', closeFn);
  buttonGroup.appendChild(backButton);
}

function bindEvents() {
  refs.beginButton?.addEventListener('click', handleBegin);
  refs.addItemForm?.addEventListener('submit', handleAddItem);
  refs.imagenPrenda?.addEventListener('change', handleImageChange);
  refs.categoryScroller?.addEventListener('click', handleCategoryClick);
  refs.createOutfitButton?.addEventListener('click', openOutfitModal);
  refs.closeOutfitModal?.addEventListener('click', closeOutfitModal);
  refs.btnGuardarOutfit?.addEventListener('click', handleSaveOutfit);
  refs.closeOutfitPreviewModal?.addEventListener('click', closeOutfitPreviewModal);
  refs.outfitList?.addEventListener('click', handleOutfitListClick);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeyDown);
  refs.themeToggle?.addEventListener('click', toggleTheme);
}

function loadState() {
  console.log('[LOADSTATE] Iniciando...');
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    console.log('[LOADSTATE] localStorage raw:', raw ? 'tiene datos' : 'vacío');
    
    if (!raw) {
      console.log('[LOADSTATE] No hay datos en localStorage, creando prenda de prueba');
      if (state.items.length === 0) {
        state.items.push({
          id: 'item-test-001',
          name: 'Prenda de Prueba',
          category: 'Tops',
          color: 'Rosa',
          season: 'Verano',
          image: null,
          createdAt: new Date().toISOString(),
        });
        console.log('[LOADSTATE] Prenda de prueba agregada');
      }
      return;
    }

    const parsed = JSON.parse(raw);
    state.items = Array.isArray(parsed.items) ? parsed.items : [];
    state.outfits = Array.isArray(parsed.outfits) ? parsed.outfits : [];
    state.filterCategory = parsed.filterCategory || 'Todas';
    console.log('[LOADSTATE] Datos cargados desde localStorage, items:', state.items.length);
    if (parsed.theme === 'dark') {
      document.body.classList.add('dark');
    }
  } catch (error) {
    console.warn('Error cargando estado:', error);
  }
}

function saveState() {
  try {
    const payload = {
      items: state.items,
      outfits: state.outfits,
      filterCategory: state.filterCategory,
    };

    if (document.body.classList.contains('dark')) {
      payload.theme = 'dark';
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Error guardando estado:', error);
  }
}

function handleBegin() {
  refs.welcomeScreen?.classList.add('hidden');
  refs.welcomeScreen?.setAttribute('aria-hidden', 'true');
  refs.appScreen?.classList.remove('hidden');
  refs.appScreen?.removeAttribute('aria-hidden');
  renderAll();
}

function setupImagePreview() {
  if (!refs.imagenPrenda || refs.imagenPrenda.parentElement?.querySelector('#imagePreviewWrapper')) {
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'imagePreviewWrapper';
  wrapper.className = 'image-preview-wrapper hidden';

  const label = document.createElement('p');
  label.className = 'image-preview-label';
  label.textContent = 'Vista previa de imagen';

  const image = document.createElement('img');
  image.className = 'image-preview';
  image.alt = 'Vista previa de prenda';
  image.style.width = 'auto';
  image.style.height = 'auto';
  image.style.maxWidth = '100%';
  image.style.maxHeight = '100%';
  image.style.objectFit = 'contain';
  image.style.display = 'block';
  image.style.margin = '0 auto';

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'button secondary full-width';
  removeButton.textContent = 'Eliminar imagen';
  removeButton.addEventListener('click', resetPreviewImage);

  wrapper.appendChild(label);
  wrapper.appendChild(image);
  wrapper.appendChild(removeButton);
  refs.imagenPrenda.parentElement?.appendChild(wrapper);
}

function handleImageChange(event) {
  const file = event.target?.files?.[0];
  if (!file) {
    resetPreviewImage();
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen v�lido.');
    refs.imagenPrenda.value = '';
    resetPreviewImage();
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const rawBase64 = reader.result;
    if (!rawBase64) {
      resetPreviewImage();
      return;
    }

    const image = new Image();
    image.onload = function () {
      try {
        state.currentImageBase64 = cropTransparentImage(image);
      } catch (error) {
        console.warn('Error al recortar la imagen:', error);
        state.currentImageBase64 = rawBase64;
      }
      showPreviewImage(state.currentImageBase64);
    };
    image.onerror = function () {
      alert('No se pudo procesar la imagen. Intenta con otra imagen.');
      refs.imagenPrenda.value = '';
      resetPreviewImage();
    };
    image.src = rawBase64;
  };
  reader.onerror = function () {
    alert('No se pudo leer la imagen. Intenta de nuevo.');
    refs.imagenPrenda.value = '';
    resetPreviewImage();
  };

  reader.readAsDataURL(file);
}

function cropTransparentImage(image) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return image.src;
  }

  canvas.width = image.width;
  canvas.height = image.height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);

  let imageData;
  try {
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  } catch (error) {
    return image.src;
  }

  const data = imageData.data;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (data[index + 3] > 0) {
        found = true;
        if (x < minX) { minX = x; }
        if (x > maxX) { maxX = x; }
        if (y < minY) { minY = y; }
        if (y > maxY) { maxY = y; }
      }
    }
  }

  if (!found) {
    return image.src;
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const croppedCanvas = document.createElement('canvas');
  const croppedContext = croppedCanvas.getContext('2d');
  if (!croppedContext) {
    return image.src;
  }

  croppedCanvas.width = width;
  croppedCanvas.height = height;
  croppedContext.clearRect(0, 0, width, height);
  croppedContext.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);

  return croppedCanvas.toDataURL('image/png');
}

function showPreviewImage(base64) {
  const wrapper = document.querySelector('#imagePreviewWrapper');
  const image = wrapper?.querySelector('img.image-preview');
  if (!wrapper || !image) {
    return;
  }

  image.src = base64 || '';
  wrapper.classList.remove('hidden');
}

function resetPreviewImage() {
  const wrapper = document.querySelector('#imagePreviewWrapper');
  const image = wrapper?.querySelector('img.image-preview');
  if (wrapper) {
    wrapper.classList.add('hidden');
  }
  if (image) {
    image.src = '';
  }
  if (refs.imagenPrenda) {
    refs.imagenPrenda.value = '';
  }
  state.currentImageBase64 = null;
}

function handleAddItem(event) {
  event.preventDefault();
  if (!refs.addItemForm) {
    return;
  }

  const name = refs.nombrePrenda?.value.trim() || '';
  const category = refs.categoriaPrenda?.value || '';
  const color = refs.colorPrenda?.value || '';
  const season = refs.seasonPrenda?.value || '';

  if (!name || !category || !color || !season) {
    alert('Completa todos los campos antes de guardar la prenda.');
    return;
  }

  const newItem = {
    id: generateId('item'),
    name,
    category,
    color,
    season,
    image: state.currentImageBase64,
    createdAt: new Date().toISOString(),
  };

  state.items.unshift(newItem);
  saveState();
  refs.addItemForm.reset();
  resetPreviewImage();
  renderAll();
}

function handleCategoryClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest('[data-action="delete-item"]');
  if (button) {
    const itemId = button.getAttribute('data-id');
    if (itemId) {
      deleteItem(itemId);
    }
  }
}

function deleteItem(itemId) {
  state.items = state.items.filter(function (item) {
    return item.id !== itemId;
  });

  state.outfits = state.outfits
    .map(function (outfit) {
      return {
        id: outfit.id,
        name: outfit.name,
        itemIds: Array.isArray(outfit.itemIds)
          ? outfit.itemIds.filter(function (id) {
              return id !== itemId;
            })
          : [],
        createdAt: outfit.createdAt,
      };
    })
    .filter(function (outfit) {
      return Array.isArray(outfit.itemIds) && outfit.itemIds.length > 0;
    });

  saveState();
  renderAll();
}

function deleteOutfit(outfitId) {
  state.outfits = state.outfits.filter(function (outfit) {
    return outfit.id !== outfitId;
  });

  saveState();
  renderAll();
}

function renderAll() {
  console.log('[RENDERALL] Comenzando renderAll');
  renderCategoryFilter();
  renderCategories();
  console.log('[RENDERALL] Llamando renderOutfitSelection, state.items:', state.items.length);
  renderOutfitSelection();
  console.log('[RENDERALL] renderOutfitSelection completado');
  renderOutfits();
}

function renderCategoryFilter() {
  if (!refs.categoryScroller) {
    return;
  }

  if (document.querySelector('#categoryFilterRow')) {
    return;
  }

  const filterRow = document.createElement('div');
  filterRow.id = 'categoryFilterRow';
  filterRow.className = 'filter-row';

  const label = document.createElement('label');
  label.setAttribute('for', 'categoryFilterSelect');
  label.textContent = 'Filtrar categor�a';
  label.className = 'filter-label';

  const select = document.createElement('select');
  select.id = 'categoryFilterSelect';
  select.className = 'filter-select';

  const allOption = document.createElement('option');
  allOption.value = 'Todas';
  allOption.textContent = 'Todas';
  select.appendChild(allOption);

  CATEGORY_ORDER.forEach(function (category) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.value = state.filterCategory || 'Todas';
  select.addEventListener('change', function (event) {
    state.filterCategory = event.target.value || 'Todas';
    saveState();
    renderCategories();
  });

  filterRow.appendChild(label);
  filterRow.appendChild(select);
  refs.categoryScroller.parentElement?.insertBefore(filterRow, refs.categoryScroller);
}

function renderCategories() {
  if (!refs.categoryScroller) {
    return;
  }

  const filter = state.filterCategory || 'Todas';
  const categoriesToShow = CATEGORY_ORDER.filter(function (category) {
    return filter === 'Todas' || filter === category;
  });

  refs.categoryScroller.innerHTML = categoriesToShow
    .map(function (category) {
      const items = state.items.filter(function (item) {
        return item.category === category;
      });

      const cards = items.length
        ? items.map(renderItemCard).join('')
        : '<div class="category-empty">A�n no hay prendas en ' + escapeHtml(category) + '.</div>';

      return (
        '<section class="category-section">' +
          '<div class="category-header">' +
            '<h3 class="category-title">' + escapeHtml(category) + '</h3>' +
            '<span class="category-count">' + items.length + ' prendas</span>' +
          '</div>' +
          '<div class="category-scroll">' + cards + '</div>' +
        '</section>'
      );
    })
    .join('');
}

function renderItemCard(item) {
  const imageContent = item.image
    ? '<div class="card-image-wrapper" style="display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:184px;"><img src="' + item.image + '" alt="' + escapeHtml(item.name) + '" class="card-image" style="width:auto;height:auto;max-width:100%;max-height:184px;object-fit:contain;display:block;margin:0 auto;"></div>'
    : '<div class="card-image-wrapper card-image-empty"><span>??</span></div>';

  return (
    '<article class="card" data-id="' + item.id + '">' +
      imageContent +
      '<div class="card-body">' +
        '<p class="card-category">' + escapeHtml(item.category) + '</p>' +
        '<h4 class="card-title">' + escapeHtml(item.name) + '</h4>' +
        '<div class="card-meta">' +
          '<span>' + escapeHtml(item.color) + '</span>' +
          '<button type="button" class="button secondary card-delete-button" data-action="delete-item" data-id="' + item.id + '">Eliminar</button>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function renderOutfitSelection() {
  console.log('[RENDEROUTFITSELECTION] Iniciando...');
  console.log('[RENDEROUTFITSELECTION] refs.outfitSelectionGrid:', refs.outfitSelectionGrid ? 'encontrado' : 'NULL');
  
  // Fallback: Si refs.outfitSelectionGrid es null, intentar encontrarlo nuevamente
  if (!refs.outfitSelectionGrid) {
    console.log('[RENDEROUTFITSELECTION] Buscando #outfitSelectionGrid con querySelector');
    refs.outfitSelectionGrid = document.querySelector('#outfitSelectionGrid');
    if (!refs.outfitSelectionGrid) {
      console.error('[RENDEROUTFITSELECTION] CRÍTICO: Cannot find #outfitSelectionGrid element');
      console.log('[RENDEROUTFITSELECTION] DOM Dump:', document.body.innerHTML.substring(0, 200));
      return;
    }
    console.log('[RENDEROUTFITSELECTION] Elemento encontrado con fallback');
  }

  console.log('[RENDEROUTFITSELECTION] state.items.length:', state.items.length);
  
  if (!Array.isArray(state.items) || state.items.length === 0) {
    console.log('[RENDEROUTFITSELECTION] Sin prendas, mostrando estado vacío');
    refs.outfitSelectionGrid.innerHTML = '<p class="empty-state">Agrega prendas para crear outfits.</p>';
    console.log('[RENDEROUTFITSELECTION] HTML insertado en el contenedor');
    return;
  }

  console.log('[RENDEROUTFITSELECTION] Renderizando', state.items.length, 'prendas');
  refs.outfitSelectionGrid.innerHTML = state.items
    .map(function (item) {
      const imageHtml = item.image
        ? '<img src="' + item.image + '" alt="' + escapeHtml(item.name) + '" class="outfit-selection-image" style="width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;display:block;margin:0 auto;">'
        : '<div class="outfit-selection-placeholder">??</div>';

      return (
        '<label class="outfit-selection-item">' +
          '<input type="checkbox" name="outfitItem" value="' + item.id + '">' +
          '<div class="outfit-selection-card">' +
            '<div class="outfit-selection-image-wrapper">' +
              imageHtml +
            '</div>' +
            '<div class="outfit-selection-info">' +
              '<strong>' + escapeHtml(item.name) + '</strong>' +
              '<p>' + escapeHtml(item.category) + '</p>' +
            '</div>' +
          '</div>' +
        '</label>'
      );
    })
    .join('');
  console.log('[RENDEROUTFITSELECTION] HTML renderizado completado');
}

function renderOutfits() {
  if (!refs.outfitList) {
    return;
  }

  if (!Array.isArray(state.outfits) || state.outfits.length === 0) {
    refs.outfitList.innerHTML = '<div class="empty-state">No hay outfits guardados todav�a.</div>';
    return;
  }

  refs.outfitList.innerHTML = state.outfits
    .map(function (outfit) {
      const selectedItems = Array.isArray(outfit.itemIds)
        ? outfit.itemIds
            .map(function (itemId) {
              return state.items.find(function (item) {
                return item.id === itemId;
              });
            })
            .filter(function (item) {
              return item;
            })
        : [];

      const previewItems = selectedItems.map(function (item) {
        if (item.image) {
          return (
            '<div class="outfit-preview-image" style="display:flex;align-items:center;justify-content:center;overflow:hidden;min-width:72px;min-height:72px;">' +
              '<img src="' + item.image + '" alt="' + escapeHtml(item.name) + '" class="outfit-preview-img" style="width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;display:block;margin:0 auto;">' +
            '</div>'
          );
        }

        return '<div class="outfit-preview-image outfit-placeholder">??</div>';
      });

      const previewHtml = previewItems.length > 0
        ? previewItems.join('')
        : '<div class="outfit-placeholder">??</div>';

      return (
        '<article class="outfit-card" data-id="' + outfit.id + '">' +
          '<div class="outfit-preview">' + previewHtml + '</div>' +
          '<div class="outfit-details">' +
            '<div class="outfit-header">' +
              '<div>' +
                '<h4>' + escapeHtml(outfit.name || 'Outfit') + '</h4>' +
                '<p>' + (Array.isArray(outfit.itemIds) ? outfit.itemIds.length : 0) + ' prendas</p>' +
              '</div>' +
              '<button type="button" class="button secondary" data-action="delete-outfit" data-id="' + outfit.id + '" title="Eliminar outfit">✕</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    })
    .join('');
}

function getOrCreateOutfitPreviewModal() {
  if (refs.outfitPreviewModal instanceof HTMLElement) {
    return refs.outfitPreviewModal;
  }

  const existingModal = document.querySelector('#outfitPreviewModal');
  if (existingModal instanceof HTMLElement) {
    refs.outfitPreviewModal = existingModal;
    refs.closeOutfitPreviewModal = existingModal.querySelector('#closeOutfitPreviewModal');
    refs.previewOutfitName = existingModal.querySelector('#previewOutfitName');
    refs.outfitPreviewContainer = existingModal.querySelector('#outfitPreviewContainer');
    attachBackButton(refs.outfitPreviewModal, closeOutfitPreviewModal);
    return refs.outfitPreviewModal;
  }

  injectOutfitPreviewStyles();

  const overlay = document.createElement('div');
  overlay.id = 'outfitPreviewModal';
  overlay.className = 'outfit-preview-modal hidden';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const panel = document.createElement('div');
  panel.className = 'outfit-preview-panel';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'close-outfit-preview-button';
  closeButton.textContent = '✕';
  closeButton.title = 'Cerrar vista fullscreen';
  closeButton.setAttribute('aria-label', 'Cerrar vista de outfit');
  closeButton.addEventListener('click', closeOutfitPreviewModal);

  const header = document.createElement('div');
  header.className = 'outfit-preview-header';

  const title = document.createElement('h2');
  title.id = 'previewOutfitName';
  title.className = 'preview-outfit-title';
  title.textContent = '';

  header.appendChild(title);
  panel.appendChild(closeButton);
  panel.appendChild(header);

  const container = document.createElement('div');
  container.id = 'outfitPreviewContainer';
  container.className = 'outfit-preview-container';

  panel.appendChild(container);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  refs.outfitPreviewModal = overlay;
  refs.closeOutfitPreviewModal = closeButton;
  refs.previewOutfitName = title;
  refs.outfitPreviewContainer = container;

  return refs.outfitPreviewModal;
}

function injectOutfitPreviewStyles() {
  if (document.querySelector('#outfitFullscreenStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'outfitFullscreenStyles';
  style.textContent = `
#outfitPreviewModal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(10, 10, 10, 0.92); backdrop-filter: blur(20px); z-index: 9999; padding: 24px; opacity: 0; pointer-events: none; transition: opacity 220ms ease; }
#outfitPreviewModal:not(.hidden) { opacity: 1; pointer-events: auto; }
.outfit-preview-panel { width: min(100%, 920px); max-height: 94vh; overflow: auto; background: rgba(16, 16, 16, 0.98); border-radius: 28px; box-shadow: 0 36px 90px rgba(0, 0, 0, 0.55); padding: 36px; position: relative; color: #fff; display: flex; flex-direction: column; gap: 28px; }
.close-outfit-preview-button { position: absolute; top: 20px; right: 20px; border: none; background: rgba(255, 255, 255, 0.08); color: #fff; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 20px; display: grid; place-items: center; transition: transform 180ms ease, background 180ms ease; }
.close-outfit-preview-button:hover { transform: scale(1.05); background: rgba(255, 255, 255, 0.14); }
.outfit-preview-header { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 16px; margin: 0; }
.preview-outfit-title { margin: 0; font-size: clamp(2rem, 2.4vw, 2.8rem); line-height: 1.02; letter-spacing: -0.04em; text-align: center; width: 100%; }
.outfit-preview-container { display: flex; flex-direction: column; align-items: center; gap: 28px; }
.outfit-preview-group { width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 18px; }
.outfit-preview-group h3 { margin: 0; font-size: 0.92rem; letter-spacing: 0.18em; text-transform: uppercase; color: #aaa; text-align: center; }
.outfit-preview-group-items { display: flex; flex-direction: column; gap: 22px; width: 100%; align-items: center; }
.outfit-preview-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; border-radius: 24px; overflow: hidden; background: rgba(255, 255, 255, 0.04); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06); width: 100%; max-width: 460px; padding: 20px; min-height: 320px; }
.outfit-preview-image-frame { width: 100%; display: flex; align-items: center; justify-content: center; }
.outfit-preview-image-inner { width: 100%; max-width: 420px; height: 320px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.06); border-radius: 20px; padding: 16px; overflow: hidden; }
.outfit-preview-image-inner img { width: auto; height: auto; max-width: 85%; max-height: 85%; object-fit: contain; display: block; }
.outfit-preview-empty { width: 100%; min-height: 250px; display: flex; align-items: center; justify-content: center; color: #ddd; background: rgba(255, 255, 255, 0.04); border-radius: 20px; }
.outfit-preview-subtext { width: 100%; padding: 14px 16px 18px; display: grid; gap: 6px; }
.outfit-preview-name { margin: 0; font-size: 1rem; font-weight: 700; color: #fff; }
.outfit-preview-category { margin: 0; color: #ccc; font-size: 0.92rem; }
@media (max-width: 760px) { .outfit-preview-panel { padding: 24px 20px 28px; } .outfit-preview-container { gap: 20px; } .outfit-preview-group { max-width: 100%; } .outfit-preview-image-inner { max-height: 320px; } .outfit-preview-image-inner img { max-height: 300px; } }
`;
  document.head.appendChild(style);
}

function getOutfitPreviewGroups(items) {
  const topGroup = [];
  const pantsGroup = [];
  const shoesGroup = [];
  const extrasGroup = [];

  items.forEach(function (item) {
    if (!item || typeof item !== 'object') {
      return;
    }

    const category = item.category || '';
    if (category === 'Tops' || category === 'Vestidos' || category === 'Hoodies') {
      topGroup.push(item);
    } else if (category === 'pantalones') {
      pantsGroup.push(item);
    } else if (category === 'Zapatos') {
      shoesGroup.push(item);
    } else {
      extrasGroup.push(item);
    }
  });

  const groups = [];
  if (topGroup.length) {
    groups.push({ title: 'Tops y superiores', items: topGroup });
  }
  if (pantsGroup.length) {
    groups.push({ title: 'Pantalones', items: pantsGroup });
  }
  if (shoesGroup.length) {
    groups.push({ title: 'Zapatos', items: shoesGroup });
  }
  if (extrasGroup.length) {
    groups.push({ title: 'Extras', items: extrasGroup });
  }

  return groups;
}

function renderOutfitPreviewItem(item) {
  const imageHtml = item.image
    ? '<div class="outfit-preview-image-inner" style="display:flex;align-items:center;justify-content:center;overflow:hidden;width:100%;max-width:420px;height:320px;border-radius:20px;padding:16px;background:rgba(255,255,255,0.06);">' +
        '<img src="' + item.image + '" alt="' + escapeHtml(item.name) + '" style="width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;display:block;margin:0 auto;">' +
      '</div>'
    : '<div class="outfit-preview-empty">??</div>';

  return (
    '<article class="outfit-preview-item">' +
      '<div class="outfit-preview-image-frame">' + imageHtml + '</div>' +
      '<div class="outfit-preview-subtext">' +
        '<p class="outfit-preview-name">' + escapeHtml(item.name || 'Prenda') + '</p>' +
        '<p class="outfit-preview-category">' + escapeHtml(item.category || '') + '</p>' +
      '</div>' +
    '</article>'
  );
}

function renderOutfitPreviewModal(outfit) {
  if (!refs.previewOutfitName || !refs.outfitPreviewContainer) {
    return;
  }

  refs.previewOutfitName.textContent = escapeHtml(outfit.name || 'Outfit guardado');

  const selectedItems = Array.isArray(outfit.itemIds)
    ? outfit.itemIds
        .map(function (itemId) {
          return state.items.find(function (item) {
            return item.id === itemId;
          });
        })
        .filter(function (item) {
          return item;
        })
    : [];

  if (selectedItems.length === 0) {
    refs.outfitPreviewContainer.innerHTML = '<p class="outfit-preview-empty">No hay prendas disponibles para este outfit.</p>';
    return;
  }

  const groups = getOutfitPreviewGroups(selectedItems);
  refs.outfitPreviewContainer.innerHTML = groups
    .map(function (group) {
      return (
        '<section class="outfit-preview-group">' +
          '<h3>' + escapeHtml(group.title) + '</h3>' +
          '<div class="outfit-preview-group-items">' +
            group.items.map(renderOutfitPreviewItem).join('') +
          '</div>' +
        '</section>'
      );
    })
    .join('');
}

function lockBodyScroll() {
  if (document.body.classList.contains('modal-locked')) {
    return;
  }

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.dataset.lockScrollY = scrollY;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  if (scrollBarWidth > 0) {
    document.body.style.paddingRight = `${scrollBarWidth}px`;
  }
  document.body.classList.add('modal-locked');
}

function unlockBodyScroll() {
  if (!document.body.classList.contains('modal-locked')) {
    return;
  }

  const scrollY = parseInt(document.body.dataset.lockScrollY || '0', 10) || 0;
  document.body.classList.remove('modal-locked');
  document.documentElement.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  window.scrollTo(0, scrollY);
  delete document.body.dataset.lockScrollY;
}

function openOutfitPreviewModal(outfitId) {
  if (!outfitId) {
    return;
  }

  const outfit = state.outfits.find(function (entry) {
    return entry.id === outfitId;
  });

  if (!outfit) {
    return;
  }

  const modal = getOrCreateOutfitPreviewModal();
  renderOutfitPreviewModal(outfit);
  modal.classList.remove('hidden');
  modal.removeAttribute('aria-hidden');
  lockBodyScroll();
}

function closeOutfitPreviewModal() {
  if (!refs.outfitPreviewModal) {
    return;
  }

  refs.outfitPreviewModal.classList.add('hidden');
  refs.outfitPreviewModal.setAttribute('aria-hidden', 'true');
  unlockBodyScroll();
}

function openOutfitModal() {
  console.log('[OPENOUTFITMODAL] Abriendo modal de outfit');
  if (!refs.outfitModal) {
    console.log('[OPENOUTFITMODAL] refs.outfitModal es null, buscando...');
    refs.outfitModal = document.querySelector('#outfitModal');
    if (!refs.outfitModal) {
      console.error('[OPENOUTFITMODAL] CRÍTICO: Cannot find #outfitModal element');
      return;
    }
  }

  if (!refs.outfitName) {
    refs.outfitName = document.querySelector('#outfitName');
  }

  console.log('[OPENOUTFITMODAL] Removiendo clase hidden');
  refs.outfitModal.classList.remove('hidden');
  refs.outfitModal.removeAttribute('aria-hidden');
  refs.outfitName?.focus();
  console.log('[OPENOUTFITMODAL] Llamando renderOutfitSelection');
  renderOutfitSelection();
  console.log('[OPENOUTFITMODAL] Modal abierto');
  lockBodyScroll();
}

function closeOutfitModal() {
  if (!refs.outfitModal) {
    refs.outfitModal = document.querySelector('#outfitModal');
    if (!refs.outfitModal) {
      return;
    }
  }

  refs.outfitModal.classList.add('hidden');
  refs.outfitModal.setAttribute('aria-hidden', 'true');
  if (refs.outfitName) {
    refs.outfitName.value = '';
  }

  if (!refs.outfitSelectionGrid) {
    refs.outfitSelectionGrid = document.querySelector('#outfitSelectionGrid');
  }

  const checkboxes = refs.outfitSelectionGrid?.querySelectorAll('input[name="outfitItem"]');
  if (checkboxes) {
    checkboxes.forEach(function (checkbox) {
      if (checkbox instanceof HTMLInputElement) {
        checkbox.checked = false;
      }
    });
  }

  unlockBodyScroll();
}

function handleSaveOutfit() {
  if (!refs.outfitName) {
    refs.outfitName = document.querySelector('#outfitName');
  }
  if (!refs.outfitSelectionGrid) {
    refs.outfitSelectionGrid = document.querySelector('#outfitSelectionGrid');
  }

  if (!refs.outfitName || !refs.outfitSelectionGrid) {
    console.error('handleSaveOutfit: Missing required elements');
    return;
  }

  const outfitName = refs.outfitName.value.trim() || 'Nuevo outfit';
  const selectedIds = Array.from(refs.outfitSelectionGrid.querySelectorAll('input[name="outfitItem"]'))
    .filter(function (input) {
      return input instanceof HTMLInputElement && input.checked;
    })
    .map(function (input) {
      return input.value;
    })
    .filter(function (value) {
      return value;
    });

  if (selectedIds.length === 0) {
    alert('Selecciona al menos una prenda para guardar el outfit.');
    return;
  }

  state.outfits.unshift({
    id: generateId('outfit'),
    name: outfitName,
    itemIds: selectedIds,
    createdAt: new Date().toISOString(),
  });

  saveState();
  renderOutfits();
  closeOutfitModal();
}

function handleOutfitListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const deleteOutfitBtn = target.closest('[data-action="delete-outfit"]');
  if (deleteOutfitBtn) {
    return;
  }

  const outfitCard = target.closest('.outfit-card');
  if (outfitCard) {
    const outfitId = outfitCard.getAttribute('data-id');
    if (outfitId) {
      openOutfitPreviewModal(outfitId);
    }
  }
}

function handleDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.matches('#outfitModal')) {
    closeOutfitModal();
  }

  if (target.matches('#outfitPreviewModal')) {
    closeOutfitPreviewModal();
  }

  const deleteOutfitBtn = target.closest('[data-action="delete-outfit"]');
  if (deleteOutfitBtn) {
    const outfitId = deleteOutfitBtn.getAttribute('data-id');
    if (outfitId) {
      deleteOutfit(outfitId);
    }
  }
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    if (!refs.outfitPreviewModal?.classList.contains('hidden')) {
      closeOutfitPreviewModal();
      return;
    }

    if (!refs.outfitModal?.classList.contains('hidden')) {
      closeOutfitModal();
    }
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  saveState();
}

function applyStoredTheme() {
  if (!refs.themeToggle) {
    return;
  }

  if (document.body.classList.contains('dark')) {
    refs.themeToggle.classList.add('active');
  } else {
    refs.themeToggle.classList.remove('active');
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('03-sw.js', { scope: './' })
      .then(function (registration) {
        console.log('Service Worker registrado con alcance:', registration.scope);
      })
      .catch(function (error) {
        console.warn('Error registrando Service Worker:', error);
      });
  });
}

function setupBeforeInstallPrompt() {
  window.addEventListener('beforeinstallprompt', function (event) {
    window.deferredInstallPrompt = event;
    console.log('Evento beforeinstallprompt capturado.');
  });

  window.addEventListener('appinstalled', function () {
    window.deferredInstallPrompt = null;
    console.log('App instalada.');
  });
}

function generateId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function escapeHtml(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.addEventListener('DOMContentLoaded', init);


