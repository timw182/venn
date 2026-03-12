import { motion } from 'framer-motion';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : (
        children
      )}
    </motion.button>
  );
}
