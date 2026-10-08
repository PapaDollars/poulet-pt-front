import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../../api'
import { aujourdhui, fcfa, LISTE_TYPES, nombre, TYPES_ALIMENT } from '../../format'
import type { Fabrication, Formule, LigneStock, Produit, TypeAliment, Unite } from '../../types'
import { useCharger } from '../../useCharger'

interface Ligne {
  cle: number
  produitId: string | null
  nom: string
  unite: string
  quantite: string
  prixUnitaire: string
  depuisStock: boolean
}

interface Props {
  formules: Formule[]
  rechargerFormules: () => Promise<void>
  formuleInitiale: string | null
  apresFabrication: () => void
}

let compteur = 0
const nouvelleCle = () => ++compteur

/** Compose un mélange depuis une formule (tout reste modifiable) et le transforme en sacs. */
export default function Fabriquer({ formules, rechargerFormules, formuleInitiale, apresFabrication }: Props) {
  const produits = useCharger<Produit[]>('/produits?categorie=aliment')
  const stock = useCharger<LigneStock[]>('/stock')
  const unites = useCharger<Unite[]>('/unites')

  const [formuleId, setFormuleId] = useState('')
  const [nom, setNom] = useState('')
  const [type, setType] = useState<TypeAliment>('demarrage')
  const [date, setDate] = useState(aujourdhui())
  const [nombreSacs, setNombreSacs] = useState('10')
  const [repetitions, setRepetitions] = useState('1')
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [envoi, setEnvoi] = useState(false)

  const stockDe = (produitId: string | null) => stock.donnees?.find((s) => s.produitId === produitId)

  // Prix proposé : coût réel du stock (achat + transport) pour le maïs, sinon le prix des Paramètres
  const prixPropose = (produitId: string | null, prixParDefaut: number) => {
    const s = stockDe(produitId)
    if (s && s.coutMoyen > 0) return s.coutMoyen
    return produits.donnees?.find((p) => p.id === produitId)?.prix ?? prixParDefaut
  }

  function chargerFormule(id: string) {
    setFormuleId(id)
    const f = formules.find((x) => x.id === id)
    if (!f) return
    setNom(f.nom)
    setType(f.type)
    setNombreSacs(String(f.nombreSacs))
    setLignes(
      f.lignes.map((l) => {
        // Nom et unité à jour depuis les Paramètres
        const produit = produits.donnees?.find((p) => p.id === l.produitId)
        return {
          cle: nouvelleCle(),
          produitId: l.produitId,
          nom: produit?.nom ?? l.nom,
          unite: produit?.unite ?? l.unite,
          quantite: l.quantite ? String(l.quantite) : '',
          prixUnitaire: String(prixPropose(l.produitId, l.prixUnitaire)),
          // Seul un produit géré en stock (le maïs) peut y être pris
          depuisStock: l.depuisStock && Boolean(stockDe(l.produitId)),
        }
      }),
    )
  }

  // Formule choisie depuis l'onglet Formules, ou la première par défaut, dès que tout est chargé
  const initialise = useRef(false)
  useEffect(() => {
    if (initialise.current || !formules.length || !stock.donnees || !produits.donnees) return
    initialise.current = true
    chargerFormule(formuleInitiale ?? formules[0].id)
    // Exécuté une seule fois (garde initialise) : chargerFormule n'a pas à être une dépendance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formules, stock.donnees, produits.donnees, formuleInitiale])

  const maj = (cle: number, valeurs: Partial<Ligne>) => setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, ...valeurs } : l)))

  function choisirProduit(cle: number, produitId: string) {
    if (produitId === '') {
      maj(cle, { produitId: null, nom: '', unite: 'unité', depuisStock: false })
      return
    }
    const p = produits.donnees?.find((x) => x.id === produitId)
    if (!p) return
    const s = stockDe(p.id)
    maj(cle, { produitId: p.id, nom: p.nom, unite: p.unite, prixUnitaire: String(prixPropose(p.id, p.prix)), depuisStock: Boolean(s && s.quantite > 0) })
  }

  const ajouterLigne = () =>
    setLignes((ls) => [...ls, { cle: nouvelleCle(), produitId: null, nom: '', unite: 'unité', quantite: '', prixUnitaire: '', depuisStock: false }])

  const sacs = Number(nombreSacs) || 0
  const fois = Math.max(1, Math.round(Number(repetitions) || 1))
  const montantLigne = (l: Ligne) => Math.round((Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0))
  const coutMelange = lignes.reduce((t, l) => t + montantLigne(l), 0)
  const prixSac = sacs > 0 ? Math.round(coutMelange / sacs) : 0

  const lignesPourApi = () =>
    lignes.map((l) => ({
      produitId: l.produitId,
      nom: l.nom,
      unite: l.unite,
      quantite: l.quantite || 0,
      prixUnitaire: l.prixUnitaire || 0,
      depuisStock: l.depuisStock,
    }))

  async function fabriquer() {
    setEnvoi(true)
    try {
      const res = await api.post<Fabrication>('/fabrications', {
        date,
        formuleId: formuleId || null,
        nom,
        type,
        nombreSacs,
        repetitions: fois,
        lignes: lignesPourApi(),
      })
      toast.success(`${nombre(res.data.nombreSacs * res.data.repetitions)} sacs ${TYPES_ALIMENT[res.data.type]} fabriqués à ${fcfa(res.data.prixSac)} le sac`)
      void stock.recharger()
      apresFabrication()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  async function enregistrerFormule(nouvelle: boolean) {
    let nomFormule = nom
    if (nouvelle) {
      const saisi = window.prompt('Nom de la nouvelle formule', nom ? `${nom} (2)` : TYPES_ALIMENT[type])
      if (!saisi) return
      nomFormule = saisi
    }
    try {
      const corps = { nom: nomFormule, type, nombreSacs, lignes: lignesPourApi() }
      const res = nouvelle || !formuleId ? await api.post<Formule>('/formules', corps) : await api.put<Formule>(`/formules/${formuleId}`, corps)
      toast.success(`Formule « ${res.data.nom} » enregistrée`)
      await rechargerFormules()
      setFormuleId(res.data.id)
      setNom(res.data.nom)
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-md-3">
            <label className="form-label">Partir de la formule</label>
            <select className="form-select" value={formuleId} onChange={(e) => chargerFormule(e.target.value)}>
              <option value="">— Mélange libre —</option>
              {formules.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} ({TYPES_ALIMENT[f.type]})
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label">Type de sacs</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value as TypeAliment)}>
              {LISTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPES_ALIMENT[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label">Sacs par mélange</label>
            <input type="number" min="1" step="1" className="form-control" value={nombreSacs} onChange={(e) => setNombreSacs(e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Nombre de mélanges</label>
            <div className="input-group">
              <input type="number" min="1" step="1" className="form-control" value={repetitions} onChange={(e) => setRepetitions(e.target.value)} />
              <span className="input-group-text">= {nombre(sacs * fois)} sacs</span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th style={{ minWidth: 190 }}>Produit</th>
                <th style={{ width: 170 }}>Quantité</th>
                <th style={{ width: 150 }}>Prix unitaire</th>
                <th className="text-center">Du stock</th>
                <th className="text-end">Montant</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const s = stockDe(l.produitId)
                const besoin = (Number(l.quantite) || 0) * fois
                const manque = l.depuisStock && s && besoin > s.quantite
                return (
                  <tr key={l.cle}>
                    <td>
                      <select className="form-select form-select-sm" value={l.produitId ?? ''} onChange={(e) => choisirProduit(l.cle, e.target.value)}>
                        <option value="">Ligne libre…</option>
                        {(produits.donnees ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom}
                          </option>
                        ))}
                      </select>
                      {!l.produitId && (
                        <input
                          className="form-control form-control-sm mt-1"
                          value={l.nom}
                          onChange={(e) => maj(l.cle, { nom: e.target.value })}
                          placeholder="Désignation"
                        />
                      )}
                    </td>
                    <td>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="form-control"
                          value={l.quantite}
                          onChange={(e) => maj(l.cle, { quantite: e.target.value })}
                          placeholder="0"
                        />
                        {l.produitId ? (
                          <span className="input-group-text">{l.unite}</span>
                        ) : (
                          <select className="form-select" value={l.unite} onChange={(e) => maj(l.cle, { unite: e.target.value })} aria-label="Unité">
                            {(unites.donnees ?? []).map((u) => (
                              <option key={u.id}>{u.nom}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="form-control form-control-sm"
                        value={l.prixUnitaire}
                        onChange={(e) => maj(l.cle, { prixUnitaire: e.target.value })}
                      />
                    </td>
                    <td className="text-center">
                      {s ? (
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={l.depuisStock}
                          onChange={(e) => maj(l.cle, { depuisStock: e.target.checked })}
                          aria-label="Retirer du stock"
                        />
                      ) : (
                        <span className="text-body-secondary">—</span>
                      )}
                      {s && (
                        <div className={`small ${manque ? 'texte-negatif fw-semibold' : 'text-body-secondary'}`}>
                          dispo {nombre(s.quantite)}
                          {manque && ` (besoin ${nombre(besoin)})`}
                        </div>
                      )}
                    </td>
                    <td className="text-end fw-semibold">{fcfa(montantLigne(l))}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => setLignes((ls) => ls.filter((x) => x.cle !== l.cle))}
                        title="Retirer la ligne"
                        aria-label="Retirer la ligne"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button className="btn btn-sm btn-outline-secondary mb-3" onClick={ajouterLigne}>
          <FontAwesomeIcon icon={faPlus} /> Ajouter un produit
        </button>

        <div className="row g-3 resume-melange">
          <div className="col-6 col-md-3">
            <div className="carte-titre">Coût d'un mélange</div>
            <div className="fw-bold fs-5">{fcfa(coutMelange)}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="carte-titre">Prix du sac (÷ {nombre(sacs)})</div>
            <div className="fw-bold fs-4 texte-positif">{fcfa(prixSac)}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="carte-titre">Sacs produits</div>
            <div className="fw-bold fs-5">
              {nombre(fois)} × {nombre(sacs)} = {nombre(sacs * fois)}
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="carte-titre">Total</div>
            <div className="fw-bold fs-5">
              {nombre(sacs * fois)} × {fcfa(prixSac)} = {fcfa(coutMelange * fois)}
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={() => enregistrerFormule(true)} disabled={!lignes.length}>
            Enregistrer comme nouvelle formule
          </button>
          {formuleId && (
            <button className="btn btn-outline-primary" onClick={() => enregistrerFormule(false)}>
              Mettre à jour la formule « {nom} »
            </button>
          )}
          <button className="btn btn-success" onClick={fabriquer} disabled={envoi || coutMelange === 0 || sacs <= 0}>
            Fabriquer {nombre(sacs * fois)} sacs
          </button>
        </div>
      </div>
    </div>
  )
}
