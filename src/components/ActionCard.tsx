import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
  onClick?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  title,
  description,
  bgColor,
  iconColor,
  onClick
}) => {
  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
    >
      <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={32} className={iconColor} />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </motion.div>
  );
};

export default ActionCard;
