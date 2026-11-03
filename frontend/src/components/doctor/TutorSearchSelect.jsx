import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { getTutors } from '../../services/api.js'

const noTutors = []

function tutorLabel(tutor) {
  if (!tutor) return ''
  return `${tutor.dni || 'DNI pendiente'} · ${tutor.nombre}${tutor.telefono ? ` · ${tutor.telefono}` : ''}`
}

export default function TutorSearchSelect({
  token,
  value,
  onChange,
  selectedTutor = null,
  excludeId = null,
  demoTutors = noTutors,
  placeholder = 'Buscar tutor por nombre o DNI...',
}) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(selectedTutor)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedOption = selectedTutor && Number(value) === Number(selectedTutor.id)
    ? selectedTutor
    : selected && Number(value) === Number(selected.id)
      ? selected
      : null

  useEffect(() => {
    if (!isOpen) return undefined

    let isCurrent = true
    const timer = setTimeout(() => {
      if (!token) {
        const term = query.trim().toLowerCase()
        const digits = query.replace(/[.\s]/g, '')
        setOptions(demoTutors.filter((tutor) => (
          String(tutor.id) !== String(excludeId || '') &&
          (!term || tutor.nombre.toLowerCase().includes(term) ||
            (digits && String(tutor.dni || '').includes(digits)))
        )).slice(0, 50))
        return
      }

      setIsLoading(true)
      setError('')
      getTutors(token, query.trim())
        .then(({ data }) => {
          if (isCurrent) setOptions(data || [])
        })
        .catch((requestError) => {
          if (isCurrent) setError(requestError.message)
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false)
        })
    }, 250)

    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [demoTutors, excludeId, isOpen, query, token])

  const filteredOptions = options.filter(
    (tutor) => String(tutor.id) !== String(excludeId || ''),
  )

  return (
    <div
      className="tutor-search-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
    >
      <div className="input-shell">
        <Search size={16} className="input-shell__icon" />
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          placeholder={isOpen ? placeholder : (selectedOption ? tutorLabel(selectedOption) : placeholder)}
          value={isOpen ? query : tutorLabel(selectedOption)}
          onFocus={() => {
            setQuery('')
            setIsOpen(true)
          }}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="search-clear-btn"
            aria-label="Quitar tutor seleccionado"
            onClick={() => {
              setSelected(null)
              onChange('')
              setQuery('')
              setIsOpen(true)
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {isOpen && (
        <div className="tutor-search-options" role="listbox">
          {isLoading ? (
            <p className="tutor-search-message">Buscando tutores...</p>
          ) : error ? (
            <p className="tutor-search-message tutor-search-message--error" role="alert">{error}</p>
          ) : filteredOptions.length ? (
            filteredOptions.map((tutor) => (
              <button
                type="button"
                role="option"
                aria-selected={Number(value) === Number(tutor.id)}
                key={tutor.id}
                onClick={() => {
                  setSelected(tutor)
                  onChange(String(tutor.id))
                  setIsOpen(false)
                  setQuery('')
                }}
              >
                <strong>{tutor.nombre}</strong>
                <span>DNI {tutor.dni || 'pendiente'}{tutor.telefono ? ` · ${tutor.telefono}` : ''}</span>
              </button>
            ))
          ) : (
            <p className="tutor-search-message">
              {query.trim().length < 2
                ? 'Ingresá al menos dos caracteres para buscar.'
                : 'No se encontraron tutores.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
