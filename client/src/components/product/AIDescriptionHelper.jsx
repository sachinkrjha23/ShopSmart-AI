import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { polishDescription } from '../../store/slices/productSlice'

const AIDescriptionHelper = ({ draft, productName, category, onGenerated, disabled }) => {
  const dispatch = useDispatch()
  const { polishing } = useSelector((state) => state.product)

  const handleClick = async () => {
    if (!draft || draft.trim().length < 10) {
      return toast.error('Write a short rough draft first (at least a few words)')
    }

    try {
      const result = await dispatch(
        polishDescription({ draft, productName, category }),
      ).unwrap()
      onGenerated(result.description)
      toast.success('Description polished with AI')
    } catch (err) {
      toast.error(err || 'Failed to generate description')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || polishing}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {polishing ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Polishing...
        </>
      ) : (
        <>✨ Polish with AI</>
      )}
    </button>
  )
}

export default AIDescriptionHelper