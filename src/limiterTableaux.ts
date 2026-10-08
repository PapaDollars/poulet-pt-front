// Limite chaque tableau à 20 lignes visibles : au-delà, il défile dans son cadre.
// La hauteur est mesurée sur la 20e ligne réelle, les lignes n'ayant pas toutes la même hauteur.
const LIGNES_VISIBLES = 20

function limiter() {
  for (const cadre of document.querySelectorAll<HTMLElement>('.table-responsive')) {
    const lignes = cadre.querySelectorAll<HTMLElement>(':scope > table > tbody > tr')
    const derniere = lignes[LIGNES_VISIBLES - 1]
    if (lignes.length > LIGNES_VISIBLES && derniere) {
      const bas = derniere.getBoundingClientRect().bottom - cadre.getBoundingClientRect().top + cadre.scrollTop
      cadre.style.maxHeight = `${Math.ceil(bas)}px`
    } else {
      cadre.style.maxHeight = ''
    }
  }
}

/** Surveille la page : recalcule dès que des lignes apparaissent ou disparaissent. */
export function limiterTableaux() {
  let prevu = 0
  const planifier = () => {
    cancelAnimationFrame(prevu)
    prevu = requestAnimationFrame(limiter)
  }
  new MutationObserver(planifier).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', planifier)
  planifier()
}
