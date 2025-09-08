import { motion } from "framer-motion";

interface ComingSoonOverlayProps {
  title: string;
  emoji: string;
  description: string;
}

export function ComingSoonOverlay({ title, emoji, description }: ComingSoonOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Glassmorphism Background */}
      <div 
        className="absolute inset-0 bg-black/20 dark:bg-black/40"
        style={{ backdropFilter: 'blur(12px)' }}
      />
      
      {/* Content Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 100 }}
        className="relative z-10 max-w-md mx-4 p-8 text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Animated Emoji */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-6xl mb-6"
        >
          {emoji}
        </motion.div>
        
        {/* Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-2xl font-bold text-white dark:text-white mb-4"
        >
          {title}
        </motion.h2>
        
        {/* Coming Soon Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="inline-block mb-4"
        >
          <div 
            className="px-4 py-2 text-sm font-medium text-white rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            🚧 Coming Soon
          </div>
        </motion.div>
        
        {/* Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-white/90 dark:text-white/90 leading-relaxed"
        >
          {description}
        </motion.p>
        
        {/* Animated Progress Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex justify-center space-x-2 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="w-2 h-2 bg-white/60 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}