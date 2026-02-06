document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const closeSearch = document.getElementById('close-search');
  const searchInput = document.getElementById('search-input');

  // If a page doesn't include the modal markup, don't crash
  if (!searchBtn || !searchModal || !closeSearch || !searchInput) return;

  // Cards + filters only exist on shop pages; on other pages we can redirect
  const cards = document.querySelectorAll('.card');
  const checkboxes = document.querySelectorAll('aside input[type="checkbox"]');

  const openModal = (e) => {
    if (e) e.preventDefault();
    searchModal.style.display = 'flex';
    searchInput.focus();
  };

  const closeModal = () => {
    searchModal.style.display = 'none';
  };

  searchBtn.addEventListener('click', openModal);
  closeSearch.addEventListener('click', closeModal);

  window.addEventListener('click', (e) => {
    if (e.target === searchModal) closeModal();
  });

  function applyFilters() {
    const query = searchInput.value.toLowerCase();

    // If this page has character cards, filter them (same behavior as shop-characters.html)
    if (cards.length) {
      const activeTypes = Array.from(checkboxes)
        .filter(i => i.checked)
        .map(i => i.value.toLowerCase());

      cards.forEach(card => {
        const name = card.querySelector('.name')?.textContent.toLowerCase() || "";
        const category = card.getAttribute('data-category')?.toLowerCase() || "";

        const matchesSearch = name.includes(query);
        const matchesType = activeTypes.length === 0 || activeTypes.some(type => category.includes(type));

        card.style.display = (matchesSearch && matchesType) ? 'block' : 'none';
      });

      return;
    }

    // If this page has NO cards, pressing Enter will jump to Shop Characters with the search pre-filled
    // (so search still “works” everywhere)
  }

  searchInput.addEventListener('input', applyFilters);

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // If we're not on a page with cards, redirect search to shop-characters
      if (!cards.length) {
        const q = encodeURIComponent(searchInput.value.trim());
        window.location.href = `shop-characters.html?search=${q}`;
        return;
      }
      closeModal();
    }
    if (e.key === 'Escape') closeModal();
  });

  checkboxes.forEach(cb => cb.addEventListener('change', applyFilters));

  // Handle URL search param (works on shop-characters.html)
  const params = new URLSearchParams(window.location.search);
  if (params.has('search')) {
    searchInput.value = params.get('search');
    applyFilters();
  }
});
