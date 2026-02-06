document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const closeSearch = document.getElementById('close-search');
  const searchInput = document.getElementById('search-input');

  // Elements only exist if the page includes the search UI
  if (!searchBtn || !searchModal || !closeSearch || !searchInput) return;

  const cards = Array.from(document.querySelectorAll('.card'));
  const hasCards = cards.length > 0;

  const openModal = (e) => {
    if (e) e.preventDefault();
    searchModal.style.display = 'flex';
    searchInput.focus();
  };

  const closeModal = () => {
    searchModal.style.display = 'none';
  };

  const applyFilterOnShopPage = (query) => {
    const q = (query || '').trim().toLowerCase();
    // If no query, show everything
    if (!q) {
      cards.forEach(card => card.style.display = '');
      return;
    }

    cards.forEach(card => {
      // Try common patterns for your shop cards
      const nameEl = card.querySelector('.name') || card.querySelector('h3') || card.querySelector('h4');
      const name = (nameEl ? nameEl.textContent : '').toLowerCase();
      const category = (card.getAttribute('data-category') || '').toLowerCase();

      const matches = name.includes(q) || category.includes(q);
      card.style.display = matches ? '' : 'none';
    });

    // Optional: scroll to first visible match
    const firstVisible = cards.find(c => c.style.display !== 'none');
    if (firstVisible) firstVisible.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Open/close wiring
  searchBtn.addEventListener('click', openModal);
  closeSearch.addEventListener('click', closeModal);

  window.addEventListener('click', (e) => {
    if (e.target === searchModal) closeModal();
  });

  // Behavior:
  // - On SHOP page (cards exist): live-filter as you type.
  // - On NON-shop pages (no cards): pressing Enter redirects to shop-characters.html?search=...
  searchInput.addEventListener('input', () => {
    if (hasCards) applyFilterOnShopPage(searchInput.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();

    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (!q) return;

      if (hasCards) {
        // Already filtered live; just close
        closeModal();
      } else {
        // Redirect to shop page with query
        const encoded = encodeURIComponent(q);
        window.location.href = `shop-characters.html?search=${encoded}`;
      }
    }
  });

  // If we land on shop-characters.html with ?search=, auto-apply filter
  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('search');
  if (qParam && hasCards) {
    // Optionally open the modal on arrival:
    // searchModal.style.display = 'flex';
    searchInput.value = qParam;
    applyFilterOnShopPage(qParam);
  }
});
